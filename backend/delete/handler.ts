import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { S3Client, DeleteObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { DynamoDBClient, DeleteItemCommand } from "@aws-sdk/client-dynamodb";

const s3 = new S3Client({ region: process.env.AWS_REGION ?? "us-east-2" });
const db = new DynamoDBClient({ region: process.env.AWS_REGION ?? "us-east-2" });
const BUCKET = "flipcut-images";
const TABLE = process.env.TABLE_NAME ?? "flipcut-jobs";

function cors() {
  return {
    "Access-Control-Allow-Origin": process.env.ALLOWED_ORIGIN ?? "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "DELETE, OPTIONS",
  };
}

function res(statusCode: number, body: Record<string, unknown>): APIGatewayProxyResultV2 {
  return { statusCode, headers: { "Content-Type": "application/json", ...cors() }, body: JSON.stringify(body) };
}

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const method = event.requestContext.http.method;
  if (method === "OPTIONS") return { statusCode: 204, headers: cors(), body: "" };

  const jobId = event.queryStringParameters?.jobId;
  if (!jobId) return res(400, { error: "Missing jobId parameter" });

  // Delete input file (unknown extension, so list first)
  const listed = await s3.send(new ListObjectsV2Command({ Bucket: BUCKET, Prefix: `input/${jobId}.`, MaxKeys: 1 }));
  if (listed.Contents?.[0]?.Key) {
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: listed.Contents[0].Key }));
    console.log(`Deleted ${listed.Contents[0].Key}`);
  }

  // Delete processed file
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: `processed/${jobId}.png` }));
  console.log(`Deleted processed/${jobId}.png`);

  // Delete DynamoDB record
  await db.send(new DeleteItemCommand({ TableName: TABLE, Key: { jobId: { S: jobId } } }));
  console.log(`Deleted DynamoDB record for ${jobId}`);

  return res(200, { success: true });
};

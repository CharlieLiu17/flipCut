import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const db = new DynamoDBClient({ region: process.env.AWS_REGION ?? "us-east-2" });
const s3 = new S3Client({ region: process.env.AWS_REGION ?? "us-east-2" });
const TABLE = process.env.TABLE_NAME ?? "flipcut-jobs";
const BUCKET = "flipcut-images";
const URL_EXPIRY = 300;

function cors() {
  return {
    "Access-Control-Allow-Origin": process.env.ALLOWED_ORIGIN ?? "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
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

  const item = await db.send(new GetItemCommand({ TableName: TABLE, Key: { jobId: { S: jobId } } }));
  if (!item.Item) return res(404, { error: "Job not found" });

  const status = item.Item.status?.S ?? "unknown";
  const response: Record<string, unknown> = { jobId, status };

  if (status === "done") {
    response.url = await getSignedUrl(s3, new GetObjectCommand({
      Bucket: BUCKET, Key: `processed/${jobId}.png`,
    }), { expiresIn: URL_EXPIRY });
  }

  return res(200, response);
};

import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { randomUUID } from "crypto";

const s3 = new S3Client({ region: process.env.AWS_REGION ?? "us-east-2" });
const lambda = new LambdaClient({ region: process.env.AWS_REGION ?? "us-east-2" });
const db = new DynamoDBClient({ region: process.env.AWS_REGION ?? "us-east-2" });
const BUCKET = "flipcut-images";
const TABLE = process.env.TABLE_NAME ?? "flipcut-jobs";
const MUTATE_FUNCTION = process.env.MUTATE_FUNCTION_NAME ?? "flipCutMutateProcessor";
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_SIZE = 10 * 1024 * 1024;

function cors() {
  return {
    "Access-Control-Allow-Origin": process.env.ALLOWED_ORIGIN ?? "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

function res(statusCode: number, body: Record<string, unknown>): APIGatewayProxyResultV2 {
  return { statusCode, headers: { "Content-Type": "application/json", ...cors() }, body: JSON.stringify(body) };
}

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const method = event.requestContext.http.method;
  if (method === "OPTIONS") return { statusCode: 204, headers: cors(), body: "" };
  if (method !== "POST") return res(405, { error: "Method not allowed" });

  let image: string, mimeType: string, filename: string;
  try {
    ({ image, mimeType, filename } = JSON.parse(event.body ?? "{}"));
  } catch {
    return res(400, { error: "Invalid JSON body" });
  }

  if (!image || !mimeType || !filename) return res(400, { error: "Missing image, mimeType, or filename" });
  if (!ALLOWED_MIME_TYPES.has(mimeType)) return res(400, { error: `Unsupported type: ${mimeType}` });

  const buffer = Buffer.from(image, "base64");
  if (buffer.length > MAX_SIZE) return res(400, { error: "File exceeds 10MB limit" });

  const jobId = randomUUID();
  const ext = mimeType.split("/")[1].replace("jpeg", "jpg");
  const key = `input/${jobId}.${ext}`;

  try {
    await s3.send(new PutObjectCommand({
      Bucket: BUCKET, Key: key, Body: buffer, ContentType: mimeType,
      Metadata: { jobId, originalFilename: encodeURIComponent(filename), uploadedAt: new Date().toISOString() },
    }));
  } catch (err) {
    console.error("S3 upload failed:", err);
    return res(500, { error: "Failed to store image" });
  }

  await db.send(new PutItemCommand({
    TableName: TABLE,
    Item: {
      jobId: { S: jobId },
      status: { S: "uploaded" },
      inputKey: { S: key },
      createdAt: { S: new Date().toISOString() },
    },
  }));

  await lambda.send(new InvokeCommand({
    FunctionName: MUTATE_FUNCTION,
    InvocationType: "Event",
    Payload: Buffer.from(JSON.stringify({ jobId })),
  }));

  console.log(`Uploaded ${jobId} to ${key}, invoked mutate`);
  return res(201, { jobId, status: "uploaded", inputKey: key });
};

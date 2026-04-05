import { S3Client, GetObjectCommand, PutObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import { DynamoDBClient, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import sharp from "sharp";

const s3 = new S3Client({ region: process.env.AWS_REGION ?? "us-east-2" });
const sm = new SecretsManagerClient({ region: process.env.AWS_REGION ?? "us-east-2" });
const db = new DynamoDBClient({ region: process.env.AWS_REGION ?? "us-east-2" });
const BUCKET = "flipcut-images";
const TABLE = process.env.TABLE_NAME ?? "flipcut-jobs";
const SECRET_NAME = process.env.REMOVEBG_SECRET_NAME ?? "flipcut/removebg-api-key";

let cachedApiKey: string | null = null;

async function getApiKey(): Promise<string> {
  if (cachedApiKey) return cachedApiKey;
  const res = await sm.send(new GetSecretValueCommand({ SecretId: SECRET_NAME }));
  cachedApiKey = res.SecretString!;
  return cachedApiKey;
}

async function setStatus(jobId: string, status: string): Promise<void> {
  await db.send(new UpdateItemCommand({
    TableName: TABLE,
    Key: { jobId: { S: jobId } },
    UpdateExpression: "SET #s = :s, updatedAt = :t",
    ExpressionAttributeNames: { "#s": "status" },
    ExpressionAttributeValues: { ":s": { S: status }, ":t": { S: new Date().toISOString() } },
  }));
  console.log(`Status: ${status}`);
}

async function findInputKey(jobId: string): Promise<string> {
  const res = await s3.send(new ListObjectsV2Command({ Bucket: BUCKET, Prefix: `input/${jobId}.`, MaxKeys: 1 }));
  const key = res.Contents?.[0]?.Key;
  if (!key) throw new Error(`No input found for jobId: ${jobId}`);
  return key;
}

async function removeBg(imageBuffer: Buffer, apiKey: string): Promise<Buffer> {
  const formData = new FormData();
  formData.append("size", "auto");
  formData.append("image_file", new Blob([imageBuffer]));

  const res = await fetch("https://api.remove.bg/v1.0/removebg", {
    method: "POST",
    headers: { "X-Api-Key": apiKey },
    body: formData,
  });

  if (!res.ok) throw new Error(`remove.bg failed: ${res.status} ${res.statusText}`);
  return Buffer.from(await res.arrayBuffer());
}

export const handler = async (event: { jobId: string }): Promise<void> => {
  const { jobId } = event;
  console.log(`Starting processing for jobId: ${jobId}`);

  await setStatus(jobId, "finding_input");
  const inputKey = await findInputKey(jobId);
  console.log(`Found input file: ${inputKey}`);

  await setStatus(jobId, "downloading");
  const s3Obj = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: inputKey }));
  const inputBuffer = Buffer.from(await s3Obj.Body!.transformToByteArray());
  console.log(`Downloaded from S3: ${inputBuffer.length} bytes`);

  const apiKey = await getApiKey();
  console.log(`Retrieved API key from Secrets Manager`);

  await setStatus(jobId, "removing_background");
  const noBgBuffer = await removeBg(inputBuffer, apiKey);
  console.log(`remove.bg complete: ${noBgBuffer.length} bytes`);

  await setStatus(jobId, "flipping");
  const flippedBuffer = await sharp(noBgBuffer).flop().png().toBuffer();
  console.log(`Sharp flop complete: ${flippedBuffer.length} bytes`);

  await setStatus(jobId, "uploading_result");
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: `processed/${jobId}.png`,
    Body: flippedBuffer,
    ContentType: "image/png",
  }));

  await setStatus(jobId, "done");
  console.log(`Uploaded to processed/${jobId}.png — done`);
};

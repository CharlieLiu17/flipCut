import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import * as Busboy from "busboy";

const s3 = new S3Client({ region: process.env.AWS_REGION ?? "us-east-1" });

const BUCKET = "flipcut-images";
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

interface ParsedFile {
  buffer: Buffer;
  mimeType: string;
  filename: string;
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": process.env.ALLOWED_ORIGIN ?? "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

function response(
  statusCode: number,
  body: Record<string, unknown>
): APIGatewayProxyResult {
  return {
    statusCode,
    headers: { "Content-Type": "application/json", ...corsHeaders() },
    body: JSON.stringify(body),
  };
}

function parseMultipart(event: APIGatewayProxyEvent): Promise<ParsedFile> {
  return new Promise((resolve, reject) => {
    const contentType = event.headers["content-type"] ?? event.headers["Content-Type"];
    if (!contentType) return reject(new Error("Missing content-type header"));

    const busboy = Busboy.default({ headers: { "content-type": contentType } });
    const chunks: Buffer[] = [];
    let mimeType = "";
    let filename = "";
    let fileFound = false;
    let totalSize = 0;

    busboy.on("file", (_fieldname, stream, info) => {
      fileFound = true;
      mimeType = info.mimeType;
      filename = info.filename;

      stream.on("data", (chunk: Buffer) => {
        totalSize += chunk.length;
        if (totalSize > MAX_FILE_SIZE_BYTES) {
          stream.destroy(new Error("File too large"));
          return;
        }
        chunks.push(chunk);
      });

      stream.on("error", reject);
    });

    busboy.on("finish", () => {
      if (!fileFound) return reject(new Error("No file found in request"));
      resolve({ buffer: Buffer.concat(chunks), mimeType, filename });
    });

    busboy.on("error", reject);

    const bodyBuffer = event.isBase64Encoded
      ? Buffer.from(event.body ?? "", "base64")
      : Buffer.from(event.body ?? "");

    busboy.write(bodyBuffer);
    busboy.end();
  });
}

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  // Preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders(), body: "" };
  }

  if (event.httpMethod !== "POST") {
    return response(405, { error: "Method not allowed" });
  }

  let file: ParsedFile;
  try {
    file = await parseMultipart(event);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to parse request";
    return response(400, { error: message });
  }

  if (!ALLOWED_MIME_TYPES.has(file.mimeType)) {
    return response(400, {
      error: `Unsupported file type: ${file.mimeType}. Allowed: jpeg, png, webp`,
    });
  }

  const uuid = randomUUID();
  const ext = file.mimeType.split("/")[1].replace("jpeg", "jpg");
  const s3Key = `input/${uuid}.${ext}`;

  try {
    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: s3Key,
        Body: file.buffer,
        ContentType: file.mimeType,
        Metadata: {
          uuid,
          originalFilename: encodeURIComponent(file.filename),
          uploadedAt: new Date().toISOString(),
        },
      })
    );
  } catch (err) {
    console.error("S3 upload failed:", err);
    return response(500, { error: "Failed to store image" });
  }

  console.log(`Uploaded ${uuid} (${file.buffer.length} bytes) to ${s3Key}`);

  return response(201, {
    uuid,
    status: "processing",
    inputKey: s3Key,
  });
};

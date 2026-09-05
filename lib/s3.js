import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getAwsRegion, getEnv, getRequiredEnv } from "./env.js";

const s3 = new S3Client({ region: getAwsRegion() });

function sanitizeFilename(filename) {
  return filename
    .normalize("NFKD")
    .replace(/[^\w.\-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

// El contenido del curso (audio, subtítulos, video de cine) es propiedad de
// la plataforma y no se debe poder descargar fuera de ella: todo se sirve
// vía URLs firmadas de vida corta, nunca como archivo público permanente.
export function buildObjectKey({ scope = "uploads", filename, userId }) {
  if (!filename) throw new Error("filename is required");

  if (userId) {
    return `users/${userId}/${scope}/${Date.now()}-${sanitizeFilename(filename)}`;
  }

  return `content/${scope}/${Date.now()}-${sanitizeFilename(filename)}`;
}

export function getBucketForScope() {
  return getRequiredEnv("S3_BUCKET");
}

export async function getSignedFileUrl(key, expiresIn = 60 * 15, bucket = getRequiredEnv("S3_BUCKET")) {
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  return getSignedUrl(s3, command, { expiresIn });
}

export async function getUploadSignedUrl({ userId, filename, mimeType, scope = "uploads", bucket }) {
  const key = buildObjectKey({ scope, filename, userId });
  const targetBucket = bucket || getBucketForScope();
  const kmsKeyId = getEnv("S3_KMS_KEY_ID");
  const serverSideEncryption = kmsKeyId ? "aws:kms" : "AES256";
  const command = new PutObjectCommand({
    Bucket: targetBucket,
    Key: key,
    ContentType: mimeType,
    ServerSideEncryption: serverSideEncryption,
    SSEKMSKeyId: kmsKeyId,
  });

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 60 * 5 });

  return {
    uploadUrl,
    key,
    bucket: targetBucket,
    expiresIn: 300,
    requiredHeaders: {
      "Content-Type": mimeType,
      "x-amz-server-side-encryption": serverSideEncryption,
      ...(kmsKeyId ? { "x-amz-server-side-encryption-aws-kms-key-id": kmsKeyId } : {}),
    },
  };
}

export async function uploadFile({ buffer, filename, mimeType, scope = "uploads", userId, bucket }) {
  const key = buildObjectKey({ scope, filename, userId });
  const targetBucket = bucket || getBucketForScope();

  await s3.send(
    new PutObjectCommand({
      Bucket: targetBucket,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
      ServerSideEncryption: getEnv("S3_KMS_KEY_ID") ? "aws:kms" : "AES256",
      SSEKMSKeyId: getEnv("S3_KMS_KEY_ID"),
    })
  );

  return { key, bucket: targetBucket };
}

export async function deleteFile(key, bucket = getRequiredEnv("S3_BUCKET")) {
  await s3.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    })
  );
}

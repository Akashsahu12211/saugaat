import 'server-only';
import { S3Client, HeadObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

/** Private object storage; no public-read ACLs or unscoped GET URLs. */
function storage() {
  const endpoint = process.env.S3_ENDPOINT;
  const bucket = process.env.S3_BUCKET;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
  if (!bucket || !accessKeyId || !secretAccessKey) throw new Error('Private object storage is not configured');
  const client = new S3Client({
    region: process.env.S3_REGION || 'auto',
    ...(endpoint ? { endpoint, forcePathStyle: true } : {}),
    credentials: { accessKeyId, secretAccessKey },
  });
  return { client, bucket };
}

export const MEDIA_TYPES: Record<string, { max: number; extension: string }> = {
  'image/jpeg': { max: 12 * 1024 * 1024, extension: 'jpg' },
  'image/png': { max: 12 * 1024 * 1024, extension: 'png' },
  'image/webp': { max: 12 * 1024 * 1024, extension: 'webp' },
  'video/mp4': { max: 50 * 1024 * 1024, extension: 'mp4' },
};
export function verifyMediaInput(mime: string, bytes: number, album: string, fileName: string): string {
  const limit = MEDIA_TYPES[mime];
  if (!limit || !Number.isSafeInteger(bytes) || bytes < 1 || bytes > limit.max) throw new Error('Unsupported media type or file size');
  if (!/^[\p{L}\p{N} ._-]{1,60}$/u.test(album.trim())) throw new Error('Invalid album name');
  if (!fileName.trim() || fileName.length > 160 || /[\r\n\x00-\x1f]/.test(fileName)) throw new Error('Invalid filename');
  return limit.extension;
}

/** Exact MIME + upload object key; browser POST must stay within size constraints. */
export async function signUpload(key: string, mime: string, maxBytes: number) {
  const { client, bucket } = storage();
  return createPresignedPost(client, {
    Bucket: bucket, Key: key,
    Fields: { 'Content-Type': mime },
    Conditions: [['content-length-range', 1, maxBytes + 64 * 1024], ['eq', '$Content-Type', mime]],
    Expires: 300,
  });
}
export async function validateObject(key: string, mime: string, expectedSize: number): Promise<boolean> {
  const { client, bucket } = storage();
  try {
    const head = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return head.ContentType === mime && head.ContentLength === expectedSize;
  } catch (err) {
    if ((err as { name?: string }).name === 'NotFound') return false;
    throw err;
  }
}
export async function viewUrl(key: string, fileName: string) {
  const { client, bucket } = storage();
  // Downloading rather than rendering prevents executable content served from bucket origin.
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100);
  return getSignedUrl(client, new GetObjectCommand({
    Bucket: bucket, Key: key,
    ResponseContentDisposition: `attachment; filename="${safeName}"`,
  }), { expiresIn: 60 });
}
export async function deleteObject(key: string) {
  const { client, bucket } = storage();
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

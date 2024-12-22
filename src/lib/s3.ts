import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function generateUploadURL(key: string) {
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME!,
    Key: key
    // ContentType: 'contentType'
  });

  const uploadURL = await getSignedUrl(s3Client, command, { expiresIn: 3600, signableHeaders: new Set(['content-type']) });
  return uploadURL;
}

// const uploadUrl = await getSignedUrl(s3Client, command, { 
//     expiresIn: 3600,
//     // Add this to handle CORS preflight
//     signableHeaders: new Set(['content-type'])
//   });

export async function generateDownloadURL(key: string) {
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME!,
    Key: key,
  });

  const downloadURL = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  return downloadURL;
}

export { s3Client };
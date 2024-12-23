// api/upload/route
import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import connectDB from '@/lib/db';
import { File } from '@/lib/models/file';

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const USER_ID = '1234';

export async function POST(request: Request) {
  let fileDoc: { _id: any; } | null = null;
  let s3Key: string | null = null;

  try {
    // Check if request is already cancelled
    const aborted = request.signal.aborted;
    if (aborted) {
      throw new Error('Request cancelled');
    }

    await connectDB();

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    s3Key = `${USER_ID}/${Date.now()}-${file.name}`;

    // Listen for request cancellation
    request.signal.addEventListener('abort', async () => {
      if (fileDoc) {
        await File.findByIdAndDelete(fileDoc._id);
      }
      if (s3Key) {
        try {
          const deleteCommand = new DeleteObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME!,
            Key: s3Key,
          });
          await s3Client.send(deleteCommand);
        } catch (cleanupError) {
          console.error('Cleanup error:', cleanupError);
        }
      }
    });

    // Upload to S3 first before creating DB record
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadCommand = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: s3Key,
      Body: buffer,
      ContentType: file.type,
    });

    await s3Client.send(uploadCommand);

    // Create MongoDB record after successful S3 upload
    fileDoc = await File.create({
      filename: s3Key,
      originalName: file.name,
      size: file.size,
      s3Key,
      contentType: file.type,
      status: 'completed',
      userId: USER_ID
    });

    return NextResponse.json({
      success: true,
      fileId: fileDoc?._id,
      message: 'File uploaded successfully'
    });

  } catch (error) {
    // Clean up any partial uploads
    if (fileDoc) {
      await File.findByIdAndDelete(fileDoc._id);
    }
    if (s3Key) {
      try {
        const deleteCommand = new DeleteObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME!,
          Key: s3Key,
        });
        await s3Client.send(deleteCommand);
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError);
      }
    }

    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
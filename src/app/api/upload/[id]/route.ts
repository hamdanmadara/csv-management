// api/upload/[id]/route.ts
import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import connectDB from '@/lib/db';
import { File } from '@/lib/models/file';

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check if request is already aborted
    if (request.signal.aborted) {
      throw new Error('Upload cancelled');
    }

    await connectDB();

    const file = await File.findById(params.id);
    if (!file) {
      return NextResponse.json(
        { error: 'File record not found' },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const uploadedFile = formData.get('file') as File;

    if (!uploadedFile) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Create an AbortController for S3 upload
    const abortController = new AbortController();
    
    // Listen for request cancellation
    request.signal.addEventListener('abort', () => {
      abortController.abort();
    });

    const arrayBuffer = await uploadedFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadCommand = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: file.s3Key,
      Body: buffer,
      ContentType: uploadedFile.type,
    });

    // Pass the abort signal to S3 upload
    await s3Client.send(uploadCommand, { abortSignal: abortController.signal });

    // Update file status to completed
    await File.findByIdAndUpdate(params.id, { status: 'completed' });

    return NextResponse.json({
      success: true,
      message: 'File uploaded successfully'
    });

  } catch (error: any) {
    console.error('Upload error:', error);
    
    // If cancelled or error, clean up the DB record
    await File.findByIdAndDelete(params.id);
    
    // Check if it was a cancellation
    if (request.signal.aborted || error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Upload cancelled' },
        { status: 499 } // Client Closed Request
      );
    }
    
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
}
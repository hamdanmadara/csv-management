import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import connectDB from '@/lib/db';
import { File } from '@/lib/models/file';

// Initialize S3 Client
const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(request: Request) {
    let fileDoc = null;
    let s3Key = null;
  
    try {
      await connectDB();
  
      const formData = await request.formData();
      const file = formData.get('file') as File;
  
      if (!file) {
        return NextResponse.json(
          { error: 'No file provided' },
          { status: 400 }
        );
      }
  
      // Generate unique S3 key
      s3Key = `${Date.now()}-${file.name}`;
  
      // Create MongoDB record first with uploading status
      fileDoc = await File.create({
        filename: s3Key,
        originalName: file.name,
        size: file.size,
        s3Key,
        contentType: file.type,
        status: 'uploading',
      });
  
      try {
        // Upload to S3
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
  
        const uploadCommand = new PutObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME!,
          Key: s3Key,
          Body: buffer,
          ContentType: file.type,
        });
  
        await s3Client.send(uploadCommand);
  
        // Update status to completed
        await File.findByIdAndUpdate(fileDoc._id, { status: 'completed' });
  
        return NextResponse.json({
          success: true,
          fileId: fileDoc._id,
          message: 'File uploaded successfully'
        });
  
      } catch (uploadError) {
        // If S3 upload fails, clean up the DB record
        if (fileDoc) {
          await File.findByIdAndDelete(fileDoc._id);
        }
        throw uploadError;
      }
  
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

export const config = {
  api: {
    bodyParser: false, // Disable body parsing, we'll handle raw multipart/form-data
  },
};
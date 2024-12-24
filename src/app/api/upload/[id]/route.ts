// api/upload/[id]/route.ts
import { NextResponse } from 'next/server';
import { S3Client, UploadPartCommand, CompleteMultipartUploadCommand, CreateMultipartUploadCommand, AbortMultipartUploadCommand } from '@aws-sdk/client-s3';
import connectDB from '@/lib/db';
import { File } from '@/lib/models/file';

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  let uploadId: string | undefined;
  
  try {
    if (request.signal.aborted) {
      throw new Error('Upload cancelled');
    }

    await connectDB();
    const file = await File.findById(params.id);
    
    if (!file) {
      return NextResponse.json({ error: 'File record not found' }, { status: 404 });
    }

    const formData = await request.formData();
    const chunk = formData.get('chunk') as Blob;
    const partNumber = parseInt(formData.get('partNumber') as string);
    const totalChunks = parseInt(formData.get('totalChunks') as string);
    const isFirstChunk = partNumber === 1;
    const isLastChunk = partNumber === totalChunks;

    if (isFirstChunk) {
      // Initialize multipart upload
      const createCommand = new CreateMultipartUploadCommand({
        Bucket: process.env.AWS_BUCKET_NAME!,
        Key: file.s3Key,
        ContentType: 'text/csv',
      });
      
      const { UploadId } = await s3Client.send(createCommand);
      uploadId = UploadId;
      
      // Store uploadId in database for potential cleanup
      await File.findByIdAndUpdate(params.id, { 
        uploadId,
        status: 'uploading',
        parts: [] 
      });
    } else {
      // Get existing uploadId from database
      uploadId = file.uploadId;
    }

    if (!uploadId) {
      throw new Error('No upload ID found');
    }

    // Upload the chunk
    const arrayBuffer = await chunk.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadPartCommand = new UploadPartCommand({
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: file.s3Key,
      UploadId: uploadId,
      PartNumber: partNumber,
      Body: buffer,
    });

    const { ETag } = await s3Client.send(uploadPartCommand);

    // Store part information
    await File.findByIdAndUpdate(params.id, {
      $push: {
        parts: {
          ETag,
          PartNumber: partNumber
        }
      }
    });

    if (isLastChunk) {
      // Complete multipart upload
      const fileDoc = await File.findById(params.id);
      const sortedParts = fileDoc.parts.sort((a:any, b:any) => a.PartNumber - b.PartNumber);

      const completeCommand = new CompleteMultipartUploadCommand({
        Bucket: process.env.AWS_BUCKET_NAME!,
        Key: file.s3Key,
        UploadId: uploadId,
        MultipartUpload: {
          Parts: sortedParts
        }
      });

      await s3Client.send(completeCommand);
      await File.findByIdAndUpdate(params.id, { 
        status: 'completed',
        uploadId: null,
        parts: []
      });
    }

    return NextResponse.json({
      success: true,
      message: isLastChunk ? 'File uploaded successfully' : 'Chunk uploaded successfully'
    });

  } catch (error: any) {
    console.error('Upload error:', error);
    
    // If we have an uploadId, abort the multipart upload
    if (uploadId && params.id) {
      try {
        // Fetch the file information again to get the s3Key
        const fileDoc = await File.findById(params.id);
        if (fileDoc) {
          const abortCommand = new AbortMultipartUploadCommand({
            Bucket: process.env.AWS_BUCKET_NAME!,
            Key: fileDoc.s3Key,
            UploadId: uploadId
          });
          await s3Client.send(abortCommand);
        }
      } catch (abortError) {
        console.error('Error aborting multipart upload:', abortError);
      }
    }

    // Clean up the database record
    if (params.id) {
      await File.findByIdAndDelete(params.id);
    
    if (request.signal.aborted || error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Upload cancelled' },
        { status: 499 }
      );
    }
    
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
}

}
// api/upload/init/route

import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { File } from '@/lib/models/file';

const USER_ID = '1234';

export async function POST(request: Request) {
  try {
    await connectDB();
    const { filename, filesize } = await request.json();

    const s3Key = `${USER_ID}/${Date.now()}-${filename}`;

    // Create initial DB record
    const file = await File.create({
      filename: s3Key,
      originalName: filename,
      size: filesize,
      s3Key,
      contentType: 'text/csv',
      status: 'uploading',
      userId: USER_ID
    });

    return NextResponse.json({
      success: true,
      fileId: file._id
    });
  } catch (error) {
    console.error('Init upload error:', error);
    return NextResponse.json(
      { error: 'Failed to initialize upload' },
      { status: 500 }
    );
  }
}
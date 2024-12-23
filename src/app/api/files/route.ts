// api/files/route
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { File } from '@/lib/models/file';

export async function GET() {
  try {
    await connectDB();
    
    const files = await File.find({})
      .sort({ uploadedAt: -1 })
      .lean();

    return NextResponse.json(files);
  } catch (error) {
    console.error('Error fetching files:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
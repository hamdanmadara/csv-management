import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';

export async function GET() {
  try {
    const db = await connectDB();
    if (!db) {
      throw new Error('Database connection failed');
    }
    return NextResponse.json({ status: 'success', message: 'Database connected' });
  } catch (error: any) {
    console.error('Test DB Error:', error);
    return NextResponse.json(
      { status: 'error', message: error.message },
      { status: 500 }
    );
  }
}
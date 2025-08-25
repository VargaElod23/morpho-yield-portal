import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    // Optional: Add admin authentication here
    const authHeader = request.headers.get('authorization');
    const adminSecret = process.env.ADMIN_SECRET;
    
    if (adminSecret && authHeader !== `Bearer ${adminSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await initializeDatabase();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database initialized successfully' 
    });
    
  } catch (error) {
    console.error('Database initialization error:', error);
    return NextResponse.json({ 
      error: 'Failed to initialize database',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Database initialization endpoint',
    usage: 'POST to this endpoint to initialize database tables'
  });
}
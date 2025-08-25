import { NextRequest, NextResponse } from 'next/server';
import { removeEmailSubscriptionDB } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const { address, email } = await request.json();
    
    if (!address || !email) {
      return NextResponse.json({ 
        error: 'Address and email are required' 
      }, { status: 400 });
    }

    // Remove email subscription from database
    await removeEmailSubscriptionDB(address, email);
    
    return NextResponse.json({
      success: true,
      message: 'Successfully unsubscribed from email notifications',
    });
    
  } catch (error) {
    console.error('Error unsubscribing from email notifications:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
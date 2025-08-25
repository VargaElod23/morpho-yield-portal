import { NextRequest, NextResponse } from 'next/server';
import { getEmailsByWalletDB } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    
    if (!address) {
      return NextResponse.json({ 
        error: 'Address parameter is required' 
      }, { status: 400 });
    }

    // Get emails for this wallet
    const emails = await getEmailsByWalletDB(address);
    
    return NextResponse.json({
      success: true,
      emails,
      count: emails.length
    });
    
  } catch (error) {
    console.error('Error getting email subscriptions:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
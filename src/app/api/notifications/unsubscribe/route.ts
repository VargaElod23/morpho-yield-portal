import { NextRequest, NextResponse } from 'next/server';
import { removeUserSubscription } from '@/lib/notifications';

export async function POST(request: NextRequest) {
  try {
    const { address } = await request.json();
    
    if (!address) {
      return NextResponse.json({ 
        error: 'Address is required' 
      }, { status: 400 });
    }

    await removeUserSubscription(address);

    return NextResponse.json({ 
      success: true, 
      message: 'Subscription removed successfully' 
    });
    
  } catch (error) {
    console.error('Error in unsubscribe endpoint:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
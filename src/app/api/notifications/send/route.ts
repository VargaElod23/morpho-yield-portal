import { NextRequest, NextResponse } from 'next/server';
import { sendYieldNotification, YieldNotificationData } from '@/lib/notifications';

export async function POST(request: NextRequest) {
  try {
    const { address, yieldData } = await request.json() as {
      address: string;
      yieldData: YieldNotificationData;
    };
    
    if (!address) {
      return NextResponse.json({ error: 'Address required' }, { status: 400 });
    }

    if (!yieldData) {
      return NextResponse.json({ error: 'Yield data required' }, { status: 400 });
    }

    const success = await sendYieldNotification(address, yieldData);
    
    if (!success) {
      return NextResponse.json({ 
        error: 'Failed to send notification - user may not be subscribed' 
      }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Yield notification sent successfully' 
    });
    
  } catch (error) {
    console.error('Error sending yield notification:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
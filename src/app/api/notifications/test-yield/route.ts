import { NextRequest, NextResponse } from 'next/server';
import { calculateUserYieldData } from '@/lib/yield-calculator';
import { sendYieldNotification, getUserSubscription } from '@/lib/notifications';

export async function POST(request: NextRequest) {
  try {
    const { address } = await request.json();
    
    if (!address) {
      return NextResponse.json({ error: 'Address required' }, { status: 400 });
    }

    // Check if user is subscribed
    const subscription = await getUserSubscription(address);
    if (!subscription) {
      return NextResponse.json({ 
        error: 'User not subscribed to notifications' 
      }, { status: 404 });
    }

    // Calculate yield data
    const yieldData = await calculateUserYieldData(address, [1, 137, 42161, 8453]);
    
    if (!yieldData) {
      return NextResponse.json({ 
        error: 'No yield data found for this address' 
      }, { status: 404 });
    }

    // Send test notification
    const success = await sendYieldNotification(address, yieldData);
    
    return NextResponse.json({
      success,
      message: success ? 'Test yield notification sent!' : 'Failed to send notification',
      yieldData,
      subscription: {
        address: subscription.address,
        createdAt: subscription.createdAt,
        lastNotified: subscription.lastNotified,
      }
    });
    
  } catch (error) {
    console.error('Error in test yield notification:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');
  
  if (!address) {
    return NextResponse.json({ 
      error: 'Address parameter required',
      usage: 'GET /api/notifications/test-yield?address=0x...'
    }, { status: 400 });
  }

  try {
    // Just calculate and return yield data without sending notification
    const yieldData = await calculateUserYieldData(address, [1, 137, 42161, 8453]);
    
    if (!yieldData) {
      return NextResponse.json({ 
        error: 'No yield data found for this address' 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Yield data calculated successfully',
      yieldData,
    });
    
  } catch (error) {
    console.error('Error calculating yield data:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
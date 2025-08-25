import { NextRequest, NextResponse } from 'next/server';
import { saveUserSubscription, sendPushNotification } from '@/lib/notifications';

export async function POST(request: NextRequest) {
  try {
    const { address, subscription, chainIds } = await request.json();
    
    if (!address || !subscription) {
      return NextResponse.json({ 
        error: 'Address and subscription are required' 
      }, { status: 400 });
    }

    // Validate subscription format
    if (!subscription.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
      return NextResponse.json({ 
        error: 'Invalid subscription format' 
      }, { status: 400 });
    }

    // Save subscription
    await saveUserSubscription(address, subscription, chainIds || [1]);

    // Send welcome notification
    try {
      await sendPushNotification(subscription, {
        title: '🔔 Notifications Enabled!',
        body: 'You\'ll now receive daily yield updates from your Morpho vaults.',
        data: { type: 'welcome', address }
      });
    } catch (notificationError) {
      console.warn('Failed to send welcome notification:', notificationError);
      // Don't fail the subscription if welcome notification fails
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Subscription saved successfully' 
    });
    
  } catch (error) {
    console.error('Error in subscribe endpoint:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
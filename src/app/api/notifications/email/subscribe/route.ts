import { NextRequest, NextResponse } from 'next/server';
import { saveEmailSubscriptionDB } from '@/lib/database';
import { sendWelcomeEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { address, email } = await request.json();
    
    if (!address || !email) {
      return NextResponse.json({ 
        error: 'Address and email are required' 
      }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ 
        error: 'Invalid email format' 
      }, { status: 400 });
    }

    // Save email subscription to database
    await saveEmailSubscriptionDB(address, email);

    // Send welcome email
    const welcomeEmailSent = await sendWelcomeEmail(email, address);
    
    return NextResponse.json({
      success: true,
      message: 'Successfully subscribed to email notifications',
      welcomeEmailSent,
    });
    
  } catch (error) {
    console.error('Error subscribing to email notifications:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
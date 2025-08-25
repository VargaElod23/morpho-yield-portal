import { NextRequest, NextResponse } from 'next/server';
import { sendYieldSummaryEmail } from '@/lib/email';
import { calculateUserYieldData } from '@/lib/yield-calculator';

export async function POST(request: NextRequest) {
  try {
    const { email, address } = await request.json();
    
    if (!email || !address) {
      return NextResponse.json({ 
        error: 'Email and wallet address are required' 
      }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ 
        error: 'Invalid email format' 
      }, { status: 400 });
    }

    console.log(`Testing real yield email for ${address} to ${email}`);

    // Get real yield data for this address
    const yieldData = await calculateUserYieldData(address);
    
    if (!yieldData) {
      return NextResponse.json({ 
        error: 'No yield data found for this address. Make sure the wallet has positions in Morpho vaults.' 
      }, { status: 404 });
    }

    console.log('Real yield data:', JSON.stringify(yieldData, null, 2));

    // Mock claimable rewards for now (would need real rewards API)
    const mockClaimableRewards = {
      usdc: 175.93,
      morpho: 52.16,
      fxn: 0.02,
      total: 303.90
    };

    // Send email with real data
    const success = await sendYieldSummaryEmail(
      email,
      address,
      yieldData,
      mockClaimableRewards
    );
    
    return NextResponse.json({
      success,
      message: success 
        ? 'Real yield email sent successfully!' 
        : 'Failed to send real yield email',
      yieldData: yieldData // Return the data for debugging
    });
    
  } catch (error) {
    console.error('Error sending real yield email:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
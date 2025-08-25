import { NextRequest, NextResponse } from 'next/server';
import { generateYieldSummaryHTML, type ClaimableRewardsData } from '@/lib/email-template-new';
import { calculateUserYieldData } from '@/lib/yield-calculator';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    
    if (!address) {
      return NextResponse.json({ 
        error: 'Wallet address is required as query parameter: ?address=0x...' 
      }, { status: 400 });
    }

    console.log(`Generating real yield preview for ${address}`);

    // Get real yield data for this address
    const yieldData = await calculateUserYieldData(address);
    
    if (!yieldData) {
      return new NextResponse(`
        <html>
          <body style="font-family: Arial, sans-serif; padding: 40px; text-align: center;">
            <h2 style="color: #ef4444;">No Yield Data Found</h2>
            <p>No yield data found for address <code>${address}</code></p>
            <p>Make sure the wallet has positions in Morpho vaults.</p>
            <a href="/api/notifications/email/preview" style="color: #3b82f6;">View Mock Data Preview Instead</a>
          </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html' },
        status: 404
      });
    }

    console.log('Real yield data:', JSON.stringify(yieldData, null, 2));

    // Mock claimable rewards for now (would need real rewards API)
    const mockClaimableRewards: ClaimableRewardsData = {
      usdc: 175.93,
      morpho: 52.16,
      fxn: 0.02,
      total: 303.90
    };

    // Generate the email HTML with real data
    const emailHtml = generateYieldSummaryHTML({
      totalBalance: yieldData.totalBalance,
      totalDeposited: yieldData.totalDeposited,
      totalEarned: yieldData.totalYield,
      yieldPercentage: yieldData.yieldPercentage,
      yield24h: yieldData.yield24h,
      yield24hPercentage: yieldData.yield24hPercentage,
      vaultBreakdown: yieldData.vaultBreakdown,
      claimableRewards: mockClaimableRewards,
    });

    // Return HTML response
    return new NextResponse(emailHtml, {
      headers: {
        'Content-Type': 'text/html',
      },
    });
    
  } catch (error) {
    console.error('Error generating real yield preview:', error);
    return new NextResponse(`
      <html>
        <body style="font-family: Arial, sans-serif; padding: 40px; text-align: center;">
          <h2 style="color: #ef4444;">Error</h2>
          <p>Failed to generate preview: ${error instanceof Error ? error.message : 'Unknown error'}</p>
          <a href="/api/notifications/email/preview" style="color: #3b82f6;">View Mock Data Preview Instead</a>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' },
      status: 500
    });
  }
}
import { NextResponse } from 'next/server';
import { generateYieldSummaryHTML, type ClaimableRewardsData } from '@/lib/email-template-new';
import type { YieldNotificationData } from '@/lib/notifications';

export async function GET() {
  // Mock data for preview
  const mockYieldData: YieldNotificationData = {
    totalBalance: "142341.89",
    totalDeposited: "140000.00", 
    totalYield: "2341.89",
    yieldPercentage: 1.67,
    yield24h: "45.23",
    yield24hPercentage: 0.32,
    vaultBreakdown: [
      { name: "Alpha USDC Catalyst", balance: "85420.12", yield: "1420.12", apy: 4.2 },
      { name: "Relend USDC", balance: "32156.77", yield: "612.34", apy: 3.8 },
      { name: "OEV-boosted USDC", balance: "18765.00", yield: "245.67", apy: 2.9 },
      { name: "Gauntlet USDC Core", balance: "6000.00", yield: "63.76", apy: 2.1 },
    ]
  };

  const mockClaimableRewards: ClaimableRewardsData = {
    usdc: 175.93,
    morpho: 52.16,
    fxn: 0.02,
    total: 303.90
  };

  // Generate the email HTML
  const emailHtml = generateYieldSummaryHTML({
    totalBalance: mockYieldData.totalBalance,
    totalDeposited: mockYieldData.totalDeposited,
    totalEarned: mockYieldData.totalYield,
    yieldPercentage: mockYieldData.yieldPercentage,
    yield24h: mockYieldData.yield24h,
    yield24hPercentage: mockYieldData.yield24hPercentage,
    vaultBreakdown: mockYieldData.vaultBreakdown,
    claimableRewards: mockClaimableRewards,
  });

  // Return HTML response
  return new NextResponse(emailHtml, {
    headers: {
      'Content-Type': 'text/html',
    },
  });
}
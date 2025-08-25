import { Resend } from 'resend';
import { generateYieldSummaryHTML, type ClaimableRewardsData } from './email-template-new';
import type { YieldNotificationData } from './notifications';

const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailSubscription {
  email: string;
  address: string;
  isActive: boolean;
  createdAt: Date;
  lastEmailed?: Date;
}


export async function sendYieldSummaryEmail(
  email: string,
  address: string,
  yieldData: YieldNotificationData,
  claimableRewards?: ClaimableRewardsData
): Promise<boolean> {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn('RESEND_API_KEY not configured. Email sending disabled.');
      console.warn('Make sure to set RESEND_API_KEY in your environment variables.');
      return false;
    }

    console.log(`Attempting to send yield summary email to ${email} for address ${address}`);

    // Generate the email HTML
    const emailHtml = generateYieldSummaryHTML({
      totalBalance: yieldData.totalBalance,
      totalDeposited: yieldData.totalDeposited,
      totalEarned: yieldData.totalYield,
      yieldPercentage: yieldData.yieldPercentage,
      yield24h: yieldData.yield24h,
      yield24hPercentage: yieldData.yield24hPercentage,
      vaultBreakdown: yieldData.vaultBreakdown,
      claimableRewards,
    });

    const totalEarned = parseFloat(yieldData.totalYield);
    const yield24h = parseFloat(yieldData.yield24h);
    
    // Create subject line with key metrics
    const subject = `💰 Daily Yield: ${totalEarned > 0 ? '+' : ''}$${Math.abs(totalEarned).toFixed(2)} Total | ${yield24h > 0 ? '+' : ''}$${Math.abs(yield24h).toFixed(2)} 24h`;

    const result = await resend.emails.send({
      from: 'Morpho Yield Monitor <onboarding@resend.dev>',
      to: [email],
      subject,
      html: emailHtml,
      headers: {
        'X-Entity-Ref-ID': address,
        'X-Notification-Type': 'yield-summary',
      },
    });

    console.log('Resend API response:', JSON.stringify(result, null, 2));
    
    if (result.data) {
      console.log(`✅ Yield summary email sent to ${email}: ${result.data.id}`);
      return true;
    } else if (result.error) {
      console.error(`❌ Resend API error:`, result.error);
      return false;
    } else {
      console.error(`❌ Unexpected Resend API response:`, result);
      return false;
    }

  } catch (error) {
    console.error(`❌ Failed to send email to ${email}:`, error);
    return false;
  }
}

export async function sendWelcomeEmail(
  email: string,
  address: string
): Promise<boolean> {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn('RESEND_API_KEY not configured. Email sending disabled.');
      console.warn('Make sure to set RESEND_API_KEY in your environment variables.');
      return false;
    }

    console.log(`Attempting to send welcome email to ${email} for address ${address}`);

    const result = await resend.emails.send({
      from: 'Morpho Yield Portal <onboarding@resend.dev>',
      to: [email],
      subject: '🎉 Welcome to Morpho Yield Portal Notifications',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #0f1419; color: #ffffff;">
          <div style="text-align: center; margin-bottom: 40px;">
            <img src="https://morpho-yield-portal.vercel.app/favicon.svg" alt="Morpho" width="48" height="48" style="margin-bottom: 20px;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Welcome to Morpho Yield Monitor!</h1>
          </div>
          
          <div style="background-color: #1a1a1a; border: 1px solid #262626; border-radius: 12px; padding: 32px; margin-bottom: 32px;">
            <h2 style="color: #ffffff; margin: 0 0 16px 0; font-size: 20px;">🎯 You're All Set!</h2>
            <p style="color: #a1a1aa; margin: 0 0 20px 0; line-height: 1.6;">
              Thank you for subscribing to daily yield notifications for your Morpho vault positions.
            </p>
            <p style="color: #a1a1aa; margin: 0 0 20px 0; line-height: 1.6;">
              <strong>Wallet Address:</strong> <code style="background: #262626; padding: 2px 6px; border-radius: 4px; color: #ffffff;">${address}</code>
            </p>
            
            <h3 style="color: #ffffff; margin: 24px 0 16px 0; font-size: 16px;">📧 What You'll Receive:</h3>
            <ul style="color: #a1a1aa; padding-left: 20px; line-height: 1.6;">
              <li>Daily email summaries with your yield performance</li>
              <li>Total balance, deposited amounts, and earnings</li>
              <li>24-hour yield changes and percentage gains</li>
              <li>Vault-by-vault breakdown of your positions</li>
              <li>Claimable rewards information when available</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin-bottom: 32px;">
            <a href="https://morpho-yield-portal.vercel.app" style="background-color: #3b82f6; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 500; display: inline-block;">
              View Your Dashboard
            </a>
          </div>
          
          <div style="text-align: center; padding: 20px; border-top: 1px solid #262626;">
            <p style="color: #6b7280; margin: 0; font-size: 12px;">
              You can unsubscribe at any time by visiting your dashboard or 
              <a href="https://morpho-yield-portal.vercel.app/unsubscribe" style="color: #3b82f6;">clicking here</a>.
            </p>
          </div>
        </div>
      `,
    });

    console.log('Resend API response:', JSON.stringify(result, null, 2));
    
    if (result.data) {
      console.log(`✅ Welcome email sent to ${email}: ${result.data.id}`);
      return true;
    } else if (result.error) {
      console.error(`❌ Resend API error:`, result.error);
      return false;
    } else {
      console.error(`❌ Unexpected Resend API response:`, result);
      return false;
    }

  } catch (error) {
    console.error(`❌ Failed to send welcome email to ${email}:`, error);
    return false;
  }
}

// Test function for development
export async function sendTestEmail(email: string): Promise<boolean> {
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

  return sendYieldSummaryEmail(
    email,
    "0x742d35Cc6634C0532925a3b8D99D94e13aECCeA8",
    mockYieldData,
    mockClaimableRewards
  );
}
import { NextRequest, NextResponse } from 'next/server';
import { getAllSubscriptions, sendYieldNotification } from '@/lib/notifications';
import { calculateUserYieldData } from '@/lib/yield-calculator';
import { getAllEmailSubscriptionsDB, updateLastEmailedDB } from '@/lib/database';
import { sendYieldSummaryEmail } from '@/lib/email';

import type { ClaimableRewardsData } from '@/lib/email-template';

export async function POST(request: NextRequest) {
  try {
    // Verify this is a cron job (optional security check)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get both push and email subscriptions
    const pushSubscriptions = await getAllSubscriptions();
    const emailSubscriptions = await getAllEmailSubscriptionsDB();
    
    if (pushSubscriptions.length === 0 && emailSubscriptions.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No subscriptions found',
        processed: 0 
      });
    }

    const results = {
      pushNotifications: {
        total: pushSubscriptions.length,
        successful: 0,
        failed: 0,
        errors: [] as string[],
      },
      emailNotifications: {
        total: emailSubscriptions.length,
        successful: 0,
        failed: 0,
        errors: [] as string[],
      },
    };

    // Helper function to get mock claimable rewards (you can enhance this with real data)
    const getMockClaimableRewards = (): ClaimableRewardsData => ({
      usdc: Math.random() * 200,
      morpho: Math.random() * 100,
      fxn: Math.random() * 1,
      total: Math.random() * 400,
    });

    // Process push notifications in batches
    const batchSize = 3; // Reduced batch size for better rate limiting
    for (let i = 0; i < pushSubscriptions.length; i += batchSize) {
      const batch = pushSubscriptions.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(async (sub) => {
          try {
            // Calculate yield data for this user
            const yieldData = await calculateUserYieldData(sub.address, sub.chainIds);
            
            if (!yieldData) {
              console.error(`No yield data found for ${sub.address}`);
              return;
            }

            // Only send notification if user has meaningful positions
            const totalBalance = parseFloat(yieldData.totalBalance);
            if (totalBalance < 0.01) {
              console.log(`Skipping ${sub.address} - balance too low: $${totalBalance}`);
              return;
            }

            // Send push notification
            const success = await sendYieldNotification(sub.address, yieldData);
            
            if (success) {
              results.pushNotifications.successful++;
              console.log(`✅ Sent push notification to ${sub.address}`);
            } else {
              results.pushNotifications.failed++;
              results.pushNotifications.errors.push(`Failed to send push to ${sub.address}`);
            }
            
          } catch (error) {
            results.pushNotifications.failed++;
            const errorMsg = `Error processing push for ${sub.address}: ${error instanceof Error ? error.message : 'Unknown error'}`;
            results.pushNotifications.errors.push(errorMsg);
            console.error(errorMsg);
          }
        })
      );
      
      // Delay between batches
      if (i + batchSize < pushSubscriptions.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Process email notifications in batches 
    for (let i = 0; i < emailSubscriptions.length; i += batchSize) {
      const batch = emailSubscriptions.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(async (emailSub) => {
          try {
            // Calculate yield data for this user
            const yieldData = await calculateUserYieldData(emailSub.address, [1, 137, 42161, 8453]);
            
            if (!yieldData) {
              console.error(`No yield data found for ${emailSub.address}`);
              return;
            }

            // Only send email if user has meaningful positions
            const totalBalance = parseFloat(yieldData.totalBalance);
            if (totalBalance < 0.01) {
              console.log(`Skipping email for ${emailSub.address} - balance too low: $${totalBalance}`);
              return;
            }

            // Get claimable rewards (mock for now, you can enhance with real API calls)
            const claimableRewards = getMockClaimableRewards();

            // Send email notification
            const success = await sendYieldSummaryEmail(
              emailSub.email, 
              emailSub.address, 
              yieldData, 
              claimableRewards
            );
            
            if (success) {
              await updateLastEmailedDB(emailSub.address, emailSub.email);
              results.emailNotifications.successful++;
              console.log(`✅ Sent email to ${emailSub.email} for ${emailSub.address}`);
            } else {
              results.emailNotifications.failed++;
              results.emailNotifications.errors.push(`Failed to send email to ${emailSub.email}`);
            }
            
          } catch (error) {
            results.emailNotifications.failed++;
            const errorMsg = `Error processing email for ${emailSub.email}: ${error instanceof Error ? error.message : 'Unknown error'}`;
            results.emailNotifications.errors.push(errorMsg);
            console.error(errorMsg);
          }
        })
      );
      
      // Delay between batches
      if (i + batchSize < emailSubscriptions.length) {
        await new Promise(resolve => setTimeout(resolve, 1500)); // Slightly longer delay for emails
      }
    }

    console.log(`Daily notifications completed:`);
    console.log(`Push: ${results.pushNotifications.successful} successful, ${results.pushNotifications.failed} failed`);
    console.log(`Email: ${results.emailNotifications.successful} successful, ${results.emailNotifications.failed} failed`);
    
    return NextResponse.json({
      success: true,
      message: 'Daily notifications processed',
      results,
    });
    
  } catch (error) {
    console.error('Error in daily notifications cron:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// For manual testing
export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: 'Daily notifications endpoint',
    usage: 'POST to this endpoint to trigger daily notifications',
    subscriptions: (await getAllSubscriptions()).length
  });
}
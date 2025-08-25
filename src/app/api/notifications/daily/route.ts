import { NextRequest, NextResponse } from 'next/server';
import { getAllSubscriptions, sendYieldNotification } from '@/lib/notifications';
import { calculateUserYieldData } from '@/lib/yield-calculator';

export async function POST(request: NextRequest) {
  try {
    // Verify this is a cron job (optional security check)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subscriptions = await getAllSubscriptions();
    
    if (subscriptions.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No subscriptions found',
        processed: 0 
      });
    }

    console.log(`Processing daily notifications for ${subscriptions.length} users`);
    
    const results = {
      total: subscriptions.length,
      successful: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Process notifications in batches to avoid rate limits
    const batchSize = 5;
    for (let i = 0; i < subscriptions.length; i += batchSize) {
      const batch = subscriptions.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(async (sub) => {
          try {
            // Calculate yield data for this user
            const yieldData = await calculateUserYieldData(sub.address, sub.chainIds);
            
            if (!yieldData) {
              console.log(`No yield data found for ${sub.address}`);
              return;
            }

            // Only send notification if user has meaningful positions
            const totalBalance = parseFloat(yieldData.totalBalance);
            if (totalBalance < 0.01) {
              console.log(`Skipping ${sub.address} - balance too low: $${totalBalance}`);
              return;
            }

            // Send notification
            const success = await sendYieldNotification(sub.address, yieldData);
            
            if (success) {
              results.successful++;
              console.log(`✅ Sent notification to ${sub.address}`);
            } else {
              results.failed++;
              results.errors.push(`Failed to send to ${sub.address}`);
            }
            
          } catch (error) {
            results.failed++;
            const errorMsg = `Error processing ${sub.address}: ${error instanceof Error ? error.message : 'Unknown error'}`;
            results.errors.push(errorMsg);
            console.error(errorMsg);
          }
        })
      );
      
      // Small delay between batches
      if (i + batchSize < subscriptions.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`Daily notifications completed: ${results.successful} successful, ${results.failed} failed`);
    
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
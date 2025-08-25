import webpush from 'web-push';

// VAPID configuration
const vapidDetails = {
  subject: 'mailto:admin@morpho-yield-monitor.com',
  publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  privateKey: process.env.VAPID_PRIVATE_KEY!,
};

// Configure web-push
webpush.setVapidDetails(
  vapidDetails.subject,
  vapidDetails.publicKey,
  vapidDetails.privateKey
);

export interface NotificationSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface UserNotificationData {
  address: string;
  subscription: NotificationSubscription;
  chainIds: number[];
  createdAt: Date;
  lastNotified?: Date;
}

import {
  saveUserSubscriptionDB,
  getUserSubscriptionDB,
  removeUserSubscriptionDB,
  getAllSubscriptionsDB,
  updateLastNotifiedDB,
} from './database';

// Use database functions (fallback to in-memory for development)
const USE_DATABASE = process.env.NODE_ENV === 'production' || process.env.POSTGRES_URL;

// In-memory fallback for development
const subscriptions: Map<string, UserNotificationData> = new Map();

export async function saveUserSubscription(
  address: string,
  subscription: NotificationSubscription,
  chainIds: number[] = [1]
): Promise<void> {
  if (USE_DATABASE) {
    return saveUserSubscriptionDB(address, subscription, chainIds);
  }
  
  // Fallback to in-memory
  const userData: UserNotificationData = {
    address: address.toLowerCase(),
    subscription,
    chainIds,
    createdAt: new Date(),
  };
  
  subscriptions.set(address.toLowerCase(), userData);
  console.log(`Subscription saved for address: ${address} (in-memory)`);
}

export async function getUserSubscription(address: string): Promise<UserNotificationData | null> {
  if (USE_DATABASE) {
    return getUserSubscriptionDB(address);
  }
  
  return subscriptions.get(address.toLowerCase()) || null;
}

export async function removeUserSubscription(address: string): Promise<void> {
  if (USE_DATABASE) {
    return removeUserSubscriptionDB(address);
  }
  
  subscriptions.delete(address.toLowerCase());
  console.log(`Subscription removed for address: ${address} (in-memory)`);
}

export async function getAllSubscriptions(): Promise<UserNotificationData[]> {
  if (USE_DATABASE) {
    return getAllSubscriptionsDB();
  }
  
  return Array.from(subscriptions.values());
}

export async function sendPushNotification(
  subscription: NotificationSubscription,
  payload: {
    title: string;
    body: string;
    data?: any;
  }
): Promise<void> {
  try {
    await webpush.sendNotification(
      subscription,
      JSON.stringify(payload)
    );
    console.log('Push notification sent successfully');
  } catch (error) {
    console.error('Error sending push notification:', error);
    throw error;
  }
}

export interface YieldNotificationData {
  totalBalance: string;
  totalDeposited: string;
  totalYield: string;
  yieldPercentage: number;
  yield24h: string;
  yield24hPercentage: number;
  vaultBreakdown: {
    name: string;
    balance: string;
    yield: string;
    apy: number;
  }[];
}

export async function sendYieldNotification(
  address: string,
  yieldData: YieldNotificationData
): Promise<boolean> {
  try {
    const userSub = await getUserSubscription(address);
    if (!userSub) {
      console.log(`No subscription found for address: ${address}`);
      return false;
    }

    const payload = {
      title: '📈 Daily Yield Update',
      body: `Total: $${parseFloat(yieldData.totalBalance).toFixed(2)} | 24h: ${yieldData.yield24hPercentage > 0 ? '+' : ''}${yieldData.yield24hPercentage.toFixed(2)}%`,
      data: {
        address,
        yieldData,
        timestamp: Date.now(),
      },
    };

    await sendPushNotification(userSub.subscription, payload);
    
    // Update last notified timestamp
    if (USE_DATABASE) {
      await updateLastNotifiedDB(address);
    } else {
      userSub.lastNotified = new Date();
      subscriptions.set(address.toLowerCase(), userSub);
    }
    
    return true;
  } catch (error) {
    console.error(`Failed to send yield notification to ${address}:`, error);
    return false;
  }
}
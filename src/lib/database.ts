import { sql } from '@vercel/postgres';
import type { NotificationSubscription, UserNotificationData } from './notifications';

// Database schema initialization
export async function initializeDatabase() {
  try {
    // Create users table for notification subscriptions
    await sql`
      CREATE TABLE IF NOT EXISTS user_subscriptions (
        id SERIAL PRIMARY KEY,
        address TEXT UNIQUE NOT NULL,
        endpoint TEXT NOT NULL,
        p256dh_key TEXT NOT NULL,
        auth_key TEXT NOT NULL,
        chain_ids INTEGER[] DEFAULT ARRAY[1],
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_notified TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create yield history table for tracking 24h changes
    await sql`
      CREATE TABLE IF NOT EXISTS yield_history (
        id SERIAL PRIMARY KEY,
        address TEXT NOT NULL,
        total_balance DECIMAL(18,6) NOT NULL,
        total_deposited DECIMAL(18,6) NOT NULL,
        total_yield DECIMAL(18,6) NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        chain_data JSONB
      )
    `;

    // Create index on address and timestamp for efficient queries
    await sql`
      CREATE INDEX IF NOT EXISTS idx_user_subscriptions_address ON user_subscriptions(address)
    `;
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_yield_history_address_timestamp ON yield_history(address, timestamp DESC)
    `;

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

// User subscription functions
export async function saveUserSubscriptionDB(
  address: string,
  subscription: NotificationSubscription,
  chainIds: number[] = [1]
): Promise<void> {
  try {
    await sql`
      INSERT INTO user_subscriptions (address, endpoint, p256dh_key, auth_key, chain_ids)
      VALUES (${address.toLowerCase()}, ${subscription.endpoint}, ${subscription.keys.p256dh}, ${subscription.keys.auth}, ${chainIds.join(',')})
      ON CONFLICT (address) 
      DO UPDATE SET 
        endpoint = EXCLUDED.endpoint,
        p256dh_key = EXCLUDED.p256dh_key,
        auth_key = EXCLUDED.auth_key,
        chain_ids = EXCLUDED.chain_ids,
        updated_at = CURRENT_TIMESTAMP
    `;
    
    console.log(`Subscription saved for address: ${address}`);
  } catch (error) {
    console.error('Failed to save user subscription:', error);
    throw error;
  }
}

export async function getUserSubscriptionDB(address: string): Promise<UserNotificationData | null> {
  try {
    const result = await sql`
      SELECT * FROM user_subscriptions 
      WHERE address = ${address.toLowerCase()}
    `;
    
    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      address: row.address,
      subscription: {
        endpoint: row.endpoint,
        keys: {
          p256dh: row.p256dh_key,
          auth: row.auth_key,
        },
      },
      chainIds: row.chain_ids,
      createdAt: new Date(row.created_at),
      lastNotified: row.last_notified ? new Date(row.last_notified) : undefined,
    };
  } catch (error) {
    console.error('Failed to get user subscription:', error);
    throw error;
  }
}

export async function removeUserSubscriptionDB(address: string): Promise<void> {
  try {
    await sql`
      DELETE FROM user_subscriptions 
      WHERE address = ${address.toLowerCase()}
    `;
    
    console.log(`Subscription removed for address: ${address}`);
  } catch (error) {
    console.error('Failed to remove user subscription:', error);
    throw error;
  }
}

export async function getAllSubscriptionsDB(): Promise<UserNotificationData[]> {
  try {
    const result = await sql`
      SELECT * FROM user_subscriptions 
      ORDER BY created_at DESC
    `;
    
    return result.rows.map(row => ({
      address: row.address,
      subscription: {
        endpoint: row.endpoint,
        keys: {
          p256dh: row.p256dh_key,
          auth: row.auth_key,
        },
      },
      chainIds: row.chain_ids,
      createdAt: new Date(row.created_at),
      lastNotified: row.last_notified ? new Date(row.last_notified) : undefined,
    }));
  } catch (error) {
    console.error('Failed to get all subscriptions:', error);
    throw error;
  }
}

export async function updateLastNotifiedDB(address: string): Promise<void> {
  try {
    await sql`
      UPDATE user_subscriptions 
      SET last_notified = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE address = ${address.toLowerCase()}
    `;
  } catch (error) {
    console.error('Failed to update last notified:', error);
    throw error;
  }
}

// Yield history functions
export interface HistoricalYieldData {
  timestamp: Date;
  totalBalance: number;
  totalDeposited: number;
  totalYield: number;
  chainData?: any;
}

export async function saveYieldHistoryDB(
  address: string,
  yieldData: HistoricalYieldData
): Promise<void> {
  try {
    await sql`
      INSERT INTO yield_history (address, total_balance, total_deposited, total_yield, chain_data)
      VALUES (${address.toLowerCase()}, ${yieldData.totalBalance}, ${yieldData.totalDeposited}, ${yieldData.totalYield}, ${JSON.stringify(yieldData.chainData)})
    `;
  } catch (error) {
    console.error('Failed to save yield history:', error);
    throw error;
  }
}

export async function getYieldHistoryDB(
  address: string,
  days: number = 30
): Promise<HistoricalYieldData[]> {
  try {
    const result = await sql`
      SELECT * FROM yield_history 
      WHERE address = ${address.toLowerCase()} 
        AND timestamp >= NOW() - INTERVAL '${days} days'
      ORDER BY timestamp DESC
    `;
    
    return result.rows.map(row => ({
      timestamp: new Date(row.timestamp),
      totalBalance: parseFloat(row.total_balance),
      totalDeposited: parseFloat(row.total_deposited),
      totalYield: parseFloat(row.total_yield),
      chainData: row.chain_data,
    }));
  } catch (error) {
    console.error('Failed to get yield history:', error);
    throw error;
  }
}

export async function getYield24hAgo(address: string): Promise<HistoricalYieldData | null> {
  try {
    const result = await sql`
      SELECT * FROM yield_history 
      WHERE address = ${address.toLowerCase()} 
        AND timestamp <= NOW() - INTERVAL '24 hours'
      ORDER BY timestamp DESC
      LIMIT 1
    `;
    
    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      timestamp: new Date(row.timestamp),
      totalBalance: parseFloat(row.total_balance),
      totalDeposited: parseFloat(row.total_deposited),
      totalYield: parseFloat(row.total_yield),
      chainData: row.chain_data,
    };
  } catch (error) {
    console.error('Failed to get 24h yield data:', error);
    throw error;
  }
}

export async function cleanupOldYieldHistory(days: number = 90): Promise<void> {
  try {
    const result = await sql`
      DELETE FROM yield_history 
      WHERE timestamp < NOW() - INTERVAL '${days} days'
    `;
    
    console.log(`Cleaned up ${result.rowCount} old yield history records`);
  } catch (error) {
    console.error('Failed to cleanup old yield history:', error);
    throw error;
  }
}
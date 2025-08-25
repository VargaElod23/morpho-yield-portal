import { Pool, QueryResult } from 'pg';

// Database adapter - works with both Vercel Postgres and Supabase
interface SqlFunction {
  (strings: TemplateStringsArray, ...values: unknown[]): Promise<QueryResult>;
  array?: <T>(arr: T[]) => T[];
}

let sql: SqlFunction | null = null;

function getSql(): SqlFunction {
  if (!sql) {
    throw new Error('Database connection not available');
  }
  return sql;
}

// Initialize the appropriate SQL client
if (process.env.DATABASE_URL || process.env.POSTGRES_URL) {
  // For Supabase or other PostgreSQL connections
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
  
  // Create a sql template function similar to @vercel/postgres
  const sqlFunction: SqlFunction = (strings: TemplateStringsArray, ...values: unknown[]) => {
    const query = strings.reduce((acc, str, i) => {
      return acc + str + (values[i] !== undefined ? '$' + (i + 1) : '');
    }, '');
    
    return pool.query(query, values);
  };
  
  // Add array support for backwards compatibility
  sqlFunction.array = <T>(arr: T[]) => arr;
  sql = sqlFunction;
} else {
  // Fallback to @vercel/postgres if available
  try {
    const vercelSql = require('@vercel/postgres');
    sql = vercelSql.sql;
  } catch (error) {
    console.warn('No database connection available');
    sql = null;
  }
}
import type { NotificationSubscription, UserNotificationData } from './notifications';

// Database row interfaces
interface UserSubscriptionRow {
  id: number;
  address: string;
  endpoint: string;
  p256dh_key: string;
  auth_key: string;
  chain_ids: string | number[]; // Can be string (comma-separated) or array
  created_at: string;
  last_notified?: string;
  updated_at: string;
}

interface YieldHistoryRow {
  id: number;
  address: string;
  total_balance: string;
  total_deposited: string;
  total_yield: string;
  timestamp: string;
  chain_data?: unknown;
}

// Database schema initialization
export async function initializeDatabase() {
  const sqlClient = getSql();
  
  try {
    // Create users table for notification subscriptions
    await sqlClient`
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
    await sqlClient`
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
    await sqlClient`
      CREATE INDEX IF NOT EXISTS idx_user_subscriptions_address ON user_subscriptions(address)
    `;
    
    await sqlClient`
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
  const sqlClient = getSql();
  
  try {
    await sqlClient`
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
  const sqlClient = getSql();
  
  try {
    const result = await sqlClient`
      SELECT * FROM user_subscriptions 
      WHERE address = ${address.toLowerCase()}
    `;
    
    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0] as UserSubscriptionRow;
    return {
      address: row.address,
      subscription: {
        endpoint: row.endpoint,
        keys: {
          p256dh: row.p256dh_key,
          auth: row.auth_key,
        },
      },
      chainIds: Array.isArray(row.chain_ids) ? row.chain_ids : row.chain_ids.split(',').map(Number),
      createdAt: new Date(row.created_at),
      lastNotified: row.last_notified ? new Date(row.last_notified) : undefined,
    };
  } catch (error) {
    console.error('Failed to get user subscription:', error);
    throw error;
  }
}

export async function removeUserSubscriptionDB(address: string): Promise<void> {
  const sqlClient = getSql();
  
  try {
    await sqlClient`
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
  const sqlClient = getSql();
  
  try {
    const result = await sqlClient`
      SELECT * FROM user_subscriptions 
      ORDER BY created_at DESC
    `;
    
    return result.rows.map((row: UserSubscriptionRow) => ({
      address: row.address,
      subscription: {
        endpoint: row.endpoint,
        keys: {
          p256dh: row.p256dh_key,
          auth: row.auth_key,
        },
      },
      chainIds: Array.isArray(row.chain_ids) ? row.chain_ids : row.chain_ids.split(',').map(Number),
      createdAt: new Date(row.created_at),
      lastNotified: row.last_notified ? new Date(row.last_notified) : undefined,
    }));
  } catch (error) {
    console.error('Failed to get all subscriptions:', error);
    throw error;
  }
}

export async function updateLastNotifiedDB(address: string): Promise<void> {
  const sqlClient = getSql();
  
  try {
    await sqlClient`
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
  chainData?: unknown;
}

export async function saveYieldHistoryDB(
  address: string,
  yieldData: HistoricalYieldData
): Promise<void> {
  const sqlClient = getSql();
  
  try {
    await sqlClient`
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
  const sqlClient = getSql();
  
  try {
    const result = await sqlClient`
      SELECT * FROM yield_history 
      WHERE address = ${address.toLowerCase()} 
        AND timestamp >= NOW() - INTERVAL '${days} days'
      ORDER BY timestamp DESC
    `;
    
    return result.rows.map((row: YieldHistoryRow) => ({
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
  const sqlClient = getSql();
  
  try {
    const result = await sqlClient`
      SELECT * FROM yield_history 
      WHERE address = ${address.toLowerCase()} 
        AND timestamp <= NOW() - INTERVAL '24 hours'
      ORDER BY timestamp DESC
      LIMIT 1
    `;
    
    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0] as YieldHistoryRow;
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
  const sqlClient = getSql();
  
  try {
    const result = await sqlClient`
      DELETE FROM yield_history 
      WHERE timestamp < NOW() - INTERVAL '${days} days'
    `;
    
    console.log(`Cleaned up ${result.rowCount} old yield history records`);
  } catch (error) {
    console.error('Failed to cleanup old yield history:', error);
    throw error;
  }
}
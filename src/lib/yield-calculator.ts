import { getVaults, getUserVaultPositions, getUserTransactions } from './graphql';
import { combineVaultWithUserData } from './utils';
import type { VaultWithYield } from '@/types/morpho';
import type { YieldNotificationData } from '@/lib/notifications';

import {
  saveYieldHistoryDB,
  getYieldHistoryDB,
  getYield24hAgo,
  type HistoricalYieldData,
} from './database';

// Use database functions (fallback to in-memory for development)
const USE_DATABASE = process.env.NODE_ENV === 'production' || process.env.POSTGRES_URL;

// In-memory storage for yield history (fallback for development)
const yieldHistory: Map<string, HistoricalYieldData[]> = new Map();

export async function calculateUserYieldData(
  address: string,
  chainIds: number[] = [1, 137, 42161, 8453]
): Promise<YieldNotificationData | null> {
  try {
    let allVaults: VaultWithYield[] = [];
    
    // Fetch data from all specified chains
    for (const chainId of chainIds) {
      try {
        const [vaults, userPositions, userTransactions] = await Promise.all([
          getVaults(chainId),
          getUserVaultPositions(address, chainId),
          getUserTransactions(address, chainId)
        ]);
        
        // Combine vault data with user positions
        const vaultsWithUserData = vaults.map(vault => {
          const userPosition = userPositions.find(
            position => position.vault.address.toLowerCase() === vault.address.toLowerCase()
          );
          return combineVaultWithUserData(vault, userPosition, userTransactions);
        });
        
        // Only include vaults where user has positions
        const userVaults = vaultsWithUserData.filter(vault => 
          vault.userPosition && vault.yieldData && vault.yieldData.currentBalance > 0
        );
        
        allVaults = [...allVaults, ...userVaults];
      } catch (chainError) {
        console.warn(`Failed to fetch data for chain ${chainId}:`, chainError);
      }
    }
    
    if (allVaults.length === 0) {
      return null;
    }
    
    // Calculate totals
    const totals = allVaults.reduce(
      (acc, vault) => {
        const balance = vault.yieldData?.currentBalance || 0;
        const deposited = vault.yieldData?.totalDeposited || 0;
        const yield_ = vault.yieldData?.netYield || 0;
        
        return {
          balance: acc.balance + balance,
          deposited: acc.deposited + deposited,
          yield: acc.yield + yield_,
        };
      },
      { balance: 0, deposited: 0, yield: 0 }
    );
    
    // Calculate 24h yield change
    const currentData: HistoricalYieldData = {
      timestamp: new Date(),
      totalBalance: totals.balance,
      totalDeposited: totals.deposited,
      totalYield: totals.yield,
    };
    
    let yield24h = 0;
    let yield24hPercentage = 0;
    
    if (USE_DATABASE) {
      // Get data from 24 hours ago using database
      const previousData = await getYield24hAgo(address);
      
      if (previousData) {
        yield24h = totals.yield - previousData.totalYield;
        yield24hPercentage = previousData.totalYield > 0 
          ? (yield24h / previousData.totalYield) * 100 
          : 0;
      }
      
      // Store current data in database
      await saveYieldHistoryDB(address, currentData);
    } else {
      // Fallback to in-memory storage
      const userHistory = yieldHistory.get(address.toLowerCase()) || [];
      
      // Find data from 24 hours ago (or closest available)
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const previousData = userHistory
        .filter(data => data.timestamp <= twentyFourHoursAgo)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];
      
      if (previousData) {
        yield24h = totals.yield - previousData.totalYield;
        yield24hPercentage = previousData.totalYield > 0 
          ? (yield24h / previousData.totalYield) * 100 
          : 0;
      }
      
      // Store current data in history
      userHistory.push(currentData);
      
      // Keep only last 30 days of data
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const filteredHistory = userHistory.filter(data => data.timestamp >= thirtyDaysAgo);
      yieldHistory.set(address.toLowerCase(), filteredHistory);
    }
    
    // Prepare vault breakdown
    const vaultBreakdown = allVaults
      .filter(vault => vault.yieldData && vault.yieldData.currentBalance > 0)
      .map(vault => ({
        name: vault.name,
        balance: vault.yieldData!.currentBalance.toFixed(6),
        yield: vault.yieldData!.netYield.toFixed(6),
        apy: vault.apy?.base || 0,
      }))
      .sort((a, b) => parseFloat(b.balance) - parseFloat(a.balance));
    
    const yieldPercentage = totals.deposited > 0 
      ? (totals.yield / totals.deposited) * 100 
      : 0;
    
    return {
      totalBalance: totals.balance.toFixed(6),
      totalDeposited: totals.deposited.toFixed(6),
      totalYield: totals.yield.toFixed(6),
      yieldPercentage,
      yield24h: yield24h.toFixed(6),
      yield24hPercentage,
      vaultBreakdown,
    };
    
  } catch (error) {
    console.error(`Failed to calculate yield data for ${address}:`, error);
    return null;
  }
}

export async function getYieldHistory(address: string): Promise<HistoricalYieldData[]> {
  if (USE_DATABASE) {
    return getYieldHistoryDB(address);
  }
  
  return yieldHistory.get(address.toLowerCase()) || [];
}

export function clearYieldHistory(address: string): void {
  if (!USE_DATABASE) {
    yieldHistory.delete(address.toLowerCase());
  }
  // For database, you'd implement a clearYieldHistoryDB function if needed
}
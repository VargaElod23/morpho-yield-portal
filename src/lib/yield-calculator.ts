import { isSupportedChain } from './chains';
import type { YieldNotificationData } from '@/lib/notifications';

import {
  saveYieldHistoryDB,
  getYieldHistoryDB,
  getYield24hAgo,
  type HistoricalYieldData,
} from './database';

// Import the same functions used by useMorphoData hook
import { getVaults, getUserVaultPositions, getUserTransactions } from './graphql';
import { combineVaultWithUserData } from './utils';

// Use database functions (fallback to in-memory for development)
const USE_DATABASE = process.env.NODE_ENV === 'production' || process.env.POSTGRES_URL;

// In-memory storage for yield history (fallback for development)
const yieldHistory: Map<string, HistoricalYieldData[]> = new Map();

export async function calculateUserYieldData(
  address: string,
  chainIds: number[] = [1, 137, 42161, 8453]
): Promise<YieldNotificationData | null> {
  try {
    // Use the same logic as Dashboard but aggregate across multiple chains
    let allUserVaults: any[] = [];
    let allTransactions: any[] = [];
    
    // Process each chain using the same logic as useMorphoData hook
    for (const chainId of chainIds) {
      if (!isSupportedChain(chainId)) {
        console.warn(`Chain ${chainId} is not supported`);
        continue;
      }
      
      try {
        console.log(`Fetching data for chain ${chainId} and address ${address}...`);
        
        // Fetch all vaults for the chain
        const vaults = await getVaults(chainId);
        
        // Fetch user positions and transactions (same as useMorphoData hook)
        const [userPositions, userTransactions] = await Promise.all([
          getUserVaultPositions(address, chainId),
          getUserTransactions(address, chainId)
        ]);
        
        console.log(`Chain ${chainId} results:`, {
          vaults: vaults.length,
          userPositions: userPositions.length,
          userTransactions: userTransactions.length
        });
        
        // Combine vault data with user positions (same as useMorphoData)
        const vaultsWithUserData = vaults.map(vault => {
          const userPosition = userPositions.find(
            position => position.vault.address.toLowerCase() === vault.address.toLowerCase()
          );
          return combineVaultWithUserData(vault, userPosition, userTransactions);
        });

        // Add user positions that don't have matching vaults in the general list (same as useMorphoData)
        const userPositionsNotInVaults = userPositions.filter(userPosition => 
          !vaults.some(vault => vault.address.toLowerCase() === userPosition.vault.address.toLowerCase())
        );

        // Convert user-only positions to VaultWithYield format (same as useMorphoData)
        const userOnlyVaults = userPositionsNotInVaults.map(userPosition => {
          const userBalance = parseFloat(userPosition.balance);
          const estimatedTotalAssets = userBalance * 100;
          
          const vault = {
            id: userPosition.vault.address,
            name: userPosition.vault.name,
            address: userPosition.vault.address,
            totalAssets: (estimatedTotalAssets * Math.pow(10, userPosition.vault.asset.decimals)).toString(),
            totalSupply: "0",
            sharePrice: "1000000",
            apy: userPosition.apy || { base: 0, rewards: 0 },
            asset: userPosition.vault.asset,
          };
          return combineVaultWithUserData(vault, userPosition, userTransactions);
        });

        // Add user-only vaults to the main list
        const chainVaultsWithUserData = [...vaultsWithUserData, ...userOnlyVaults];
        
        // Filter to only user vaults (same as Dashboard line 63)
        const chainUserVaults = chainVaultsWithUserData.filter(v => v.userPosition);
        
        allUserVaults = [...allUserVaults, ...chainUserVaults];
        allTransactions = [...allTransactions, ...userTransactions];
        
      } catch (chainError) {
        console.warn(`Failed to fetch data for chain ${chainId}:`, chainError);
      }
    }
    
    console.log(`Total user vaults found across all chains: ${allUserVaults.length}`);
    console.log(`Total transactions found: ${allTransactions.length}`);
    
    if (allUserVaults.length === 0) {
      console.log(`No vaults with positions found for address: ${address}`);
      return null;
    }
    
    // Use the exact same calculation logic as Dashboard.tsx lines 64-75
    const totalBalance = allUserVaults.reduce((sum, v) => sum + (v.yieldData?.currentBalance || 0), 0);
    
    // Calculate total deposited from actual transaction data (matches Dashboard.tsx:69-71)
    const totalDepositedFromTransactions = allTransactions
      .filter(tx => tx.type === 'MetaMorphoDeposit')
      .reduce((sum, tx) => sum + tx.data.assetsUsd, 0);
    
    const totalDeposited = totalDepositedFromTransactions;
    const totalYield = totalBalance - totalDeposited; // Matches Dashboard.tsx:74
    
    const totals = {
      balance: totalBalance,
      deposited: totalDeposited,
      yield: totalYield,
    };
    
    console.log('Transaction-based totals:', totals);
    
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
    
    // Determine the primary asset symbol (same as Dashboard.tsx:77-81)
    const assetSymbols = allUserVaults.map(v => v.asset?.symbol || 'ETH');
    const primaryAsset = assetSymbols.length > 0 ? assetSymbols.reduce((a, b, i, arr) => 
      arr.filter(v => v === a).length >= arr.filter(v => v === b).length ? a : b
    ) : 'ETH';

    // Prepare vault breakdown using allUserVaults (consistent with variable naming)
    const vaultBreakdown = allUserVaults
      .filter(vault => vault.yieldData && vault.yieldData.currentBalance > 0)
      .map(vault => ({
        name: vault.name,
        balance: vault.yieldData!.currentBalance.toFixed(6),
        yield: vault.yieldData!.netYield.toFixed(6),
        apy: vault.apy?.base || 0,
      }))
      .sort((a, b) => parseFloat(b.balance) - parseFloat(a.balance));
    
    // Use the same yield percentage calculation as Dashboard.tsx:75
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
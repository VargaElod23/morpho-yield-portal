import { useState, useEffect, useCallback } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { getVaults, getUserVaultPositions, getUserTransactions } from '@/lib/graphql';
import { combineVaultWithUserData, calculateTotalNetYield } from '@/lib/utils';
import { isSupportedChain } from '@/lib/chains';
import type { VaultWithYield, ChainVaultData, Transaction } from '@/types/morpho';

export function useMorphoData() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  
  const [vaultData, setVaultData] = useState<ChainVaultData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVaultData = useCallback(async (targetChainId?: number) => {
    const currentChainId = targetChainId || chainId;
    
    if (!isSupportedChain(currentChainId)) {
      setError(`Chain ${currentChainId} is not supported by Morpho`);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch all vaults for the chain
      const vaults = await getVaults(currentChainId);
      let vaultsWithUserData: VaultWithYield[] = [];

      if (isConnected && address) {
        // Fetch user positions and transactions
        const [userPositions, userTransactions] = await Promise.all([
          getUserVaultPositions(address, currentChainId),
          getUserTransactions(address, currentChainId)
        ]);
        
        // Set transactions for the chart
        setTransactions(userTransactions);
        
        // Combine vault data with user positions
        vaultsWithUserData = vaults.map(vault => {
          const userPosition = userPositions.find(
            position => position.vault.address.toLowerCase() === vault.address.toLowerCase()
          );
          return combineVaultWithUserData(vault, userPosition, userTransactions);
        });

        // Add user positions that don't have matching vaults in the general list
        const userPositionsNotInVaults = userPositions.filter(userPosition => 
          !vaults.some(vault => vault.address.toLowerCase() === userPosition.vault.address.toLowerCase())
        );

        // Convert user-only positions to VaultWithYield format
        const userOnlyVaults = userPositionsNotInVaults.map(userPosition => {
          // Calculate estimated total assets based on user's position
          // This is a rough estimate since we don't have the actual vault data
          const userBalance = parseFloat(userPosition.balance);
          const estimatedTotalAssets = userBalance * 100; // Assume user represents ~1% of total vault
          
          // Create a minimal vault object from user position data
          const vault = {
            id: userPosition.vault.address,
            name: userPosition.vault.name,
            address: userPosition.vault.address,
            totalAssets: (estimatedTotalAssets * Math.pow(10, userPosition.vault.asset.decimals)).toString(), // Estimated total assets
            totalSupply: "0", // Not available for user-only vaults
            sharePrice: "1000000", // Default to 1.0 in asset decimals format
            apy: userPosition.apy || { base: 0, rewards: 0 }, // Use APY from user position (rewards calculated in graphql.ts)
            asset: userPosition.vault.asset,
          };
          return combineVaultWithUserData(vault, userPosition, userTransactions);
        });

        // Add user-only vaults to the main list
        vaultsWithUserData = [...vaultsWithUserData, ...userOnlyVaults];
      } else {
        // Just return vault data without user positions
        vaultsWithUserData = vaults.map(vault => combineVaultWithUserData(vault));
        setTransactions([]);
      }

      const totalNetYield = calculateTotalNetYield(vaultsWithUserData);

      setVaultData({
        chainId: currentChainId,
        chainName: getChainNameById(currentChainId),
        vaults: vaultsWithUserData,
        totalNetYield,
        isLoading: false,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch vault data';
      setError(errorMessage);
      setVaultData(null);
    } finally {
      setIsLoading(false);
    }
  }, [chainId, address, isConnected]);

  // Fetch data when wallet connects or chain changes
  useEffect(() => {
    if (isSupportedChain(chainId)) {
      fetchVaultData();
    }
  }, [fetchVaultData, chainId]);

  // Refetch data when account changes
  useEffect(() => {
    if (vaultData && isConnected) {
      fetchVaultData(vaultData.chainId);
    }
  }, [address, isConnected]); // Don't include fetchVaultData to avoid infinite loop

  const refetch = useCallback(() => {
    fetchVaultData(vaultData?.chainId);
  }, [fetchVaultData, vaultData?.chainId]);

  const switchChain = useCallback((newChainId: number) => {
    fetchVaultData(newChainId);
  }, [fetchVaultData]);

  return {
    vaultData,
    transactions,
    isLoading,
    error,
    refetch,
    switchChain,
    isSupported: isSupportedChain(chainId),
  };
}

// Helper function to get chain name by ID
function getChainNameById(chainId: number): string {
  switch (chainId) {
    case 1: return 'Ethereum';
    case 137: return 'Polygon';
    case 42161: return 'Arbitrum';
    case 8453: return 'Base';
    case 1301: return 'Unichain';
    case 1002: return 'Katana';
    default: return 'Unknown';
  }
}
'use client';

import { useState, useEffect } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { Header } from './Header';
import { VaultList } from './VaultList';
import { DepositChart } from './DepositChart';
import { useMorphoData } from '@/hooks/useMorphoData';
import { isSupportedChain, getMorphoChainById } from '@/lib/chains';
import { 
  AlertTriangle, 
  Wallet, 
  TrendingUp, 
  DollarSign, 
  Percent,
  BarChart3
} from 'lucide-react';
import { formatTokenAmount, getValueColorClass, cn } from '@/lib/utils';

export function Dashboard() {
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const { vaultData, transactions, isLoading, error, refetch, switchChain, isSupported } = useMorphoData();
  
  const [selectedChainId, setSelectedChainId] = useState<number>(chainId);
  const [showOnlyUserPositions, setShowOnlyUserPositions] = useState<boolean>(false);

  // Update selected chain when wallet chain changes
  useEffect(() => {
    if (isSupportedChain(chainId)) {
      setSelectedChainId(chainId);
    }
  }, [chainId]);

  // Auto-enable user positions filter when wallet connects
  useEffect(() => {
    if (isConnected) {
      setShowOnlyUserPositions(true);
    } else {
      setShowOnlyUserPositions(false);
    }
  }, [isConnected]);

  const handleChainSelect = (newChainId: number) => {
    setSelectedChainId(newChainId);
    switchChain(newChainId);
  };

  const handleRefresh = () => {
    refetch();
  };

  // Stats calculation
  const userVaults = vaultData?.vaults?.filter(v => v.userPosition) || [];
  const totalBalance = userVaults.reduce((sum, v) => sum + (v.yieldData?.currentBalance || 0), 0);
  
  // Calculate total deposited from actual transaction data (more accurate than vault.userPosition.deposited)
  const totalDepositedFromTransactions = transactions
    .filter(tx => tx.type === 'MetaMorphoDeposit')
    .reduce((sum, tx) => sum + tx.data.assetsUsd, 0);
  
  const totalDeposited = totalDepositedFromTransactions;
  const totalYield = totalBalance - totalDeposited; // Recalculate yield based on accurate deposits
  const overallYieldPercentage = totalDeposited > 0 ? (totalYield / totalDeposited) * 100 : 0;
  
  // Determine the primary asset symbol (most common among user's positions)
  const assetSymbols = userVaults.map(v => v.asset?.symbol || 'ETH');
  const primaryAsset = assetSymbols.length > 0 ? assetSymbols.reduce((a, b, i, arr) => 
    arr.filter(v => v === a).length >= arr.filter(v => v === b).length ? a : b
  ) : 'ETH';
  
  // Get decimals for the primary asset
  const primaryAssetDecimals = userVaults.find(v => v.asset?.symbol === primaryAsset)?.asset?.decimals || 18;

  return (
    <div className="min-h-screen bg-morpho-bg">
      <Header 
        onChainSelect={handleChainSelect}
        onRefresh={handleRefresh}
        isRefreshing={isLoading}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Unsupported Chain Warning */}
        {!isSupported && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <h3 className="font-medium text-orange-800">Unsupported Chain</h3>
            </div>
            <p className="text-orange-700 mt-2">
              The current chain (ID: {chainId}) is not supported by Morpho. 
              Please switch to a supported chain using the chain selector above.
            </p>
          </div>
        )}

        {/* Not Connected State */}
        {!isConnected && (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <Wallet className="w-16 h-16 text-gray-400 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Connect Your Wallet
              </h2>
              <p className="text-gray-600 mb-8">
                Connect your wallet to view your Morpho vault positions and track your yields 
                across multiple chains.
              </p>
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Supported Features
                </h3>
                <ul className="text-left space-y-2 text-gray-600">
                  <li className="flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <span>Real-time yield tracking</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <BarChart3 className="w-4 h-4 text-blue-500" />
                    <span>Multi-chain support</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <DollarSign className="w-4 h-4 text-purple-500" />
                    <span>Detailed position analytics</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Percent className="w-4 h-4 text-morpho-500" />
                    <span>APY and rewards tracking</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Connected State */}
        {isConnected && isSupported && (
          <div className="space-y-8">
            {/* Deposit Chart */}
            {userVaults.length > 0 && (
              <DepositChart vaults={vaultData?.vaults || []} transactions={transactions} />
            )}

            {/* User Stats */}
            {userVaults.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-morpho-surface border border-morpho-border rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-morpho-text-secondary uppercase tracking-wide">
                        Total Balance
                      </p>
                      <p className="text-2xl font-bold text-morpho-text mt-1">
                        {formatTokenAmount(totalBalance, primaryAsset, 4, primaryAssetDecimals)}
                      </p>
                    </div>
                    <div className="p-3 bg-morpho-accent/10 rounded-lg">
                      <Wallet className="w-6 h-6 text-morpho-accent" />
                    </div>
                  </div>
                </div>

                <div className="bg-morpho-surface border border-morpho-border rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-morpho-text-secondary uppercase tracking-wide">
                        Total Deposited
                      </p>
                      <p className="text-2xl font-bold text-morpho-text mt-1">
                        {formatTokenAmount(totalDeposited, primaryAsset, 4, primaryAssetDecimals)}
                      </p>
                    </div>
                    <div className="p-3 bg-morpho-success/10 rounded-lg">
                      <DollarSign className="w-6 h-6 text-morpho-success" />
                    </div>
                  </div>
                </div>

                <div className="bg-morpho-surface border border-morpho-border rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-morpho-text-secondary uppercase tracking-wide">
                        Total Earned
                      </p>
                      <p className={cn("text-2xl font-bold mt-1", getValueColorClass(totalYield))}>
                        {totalYield > 0 ? '+' : ''}{formatTokenAmount(totalYield, primaryAsset, 6, primaryAssetDecimals)}
                      </p>
                    </div>
                    <div className={cn(
                      "p-3 rounded-lg",
                      totalYield > 0 ? "bg-morpho-success/10" : totalYield < 0 ? "bg-morpho-error/10" : "bg-morpho-surface-hover"
                    )}>
                      <TrendingUp className={cn(
                        "w-6 h-6",
                        totalYield > 0 ? "text-morpho-success" : totalYield < 0 ? "text-morpho-error" : "text-morpho-text-secondary"
                      )} />
                    </div>
                  </div>
                </div>

                <div className="bg-morpho-surface border border-morpho-border rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-morpho-text-secondary uppercase tracking-wide">
                        Yield %
                      </p>
                      <p className={cn("text-2xl font-bold mt-1", getValueColorClass(overallYieldPercentage))}>
                        {overallYieldPercentage > 0 ? '+' : ''}{overallYieldPercentage.toFixed(2)}%
                      </p>
                    </div>
                    <div className={cn(
                      "p-3 rounded-lg",
                      overallYieldPercentage > 0 ? "bg-morpho-accent/10" : overallYieldPercentage < 0 ? "bg-morpho-error/10" : "bg-morpho-surface-hover"
                    )}>
                      <Percent className={cn(
                        "w-6 h-6",
                        overallYieldPercentage > 0 ? "text-morpho-accent" : overallYieldPercentage < 0 ? "text-morpho-error" : "text-morpho-text-secondary"
                      )} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Vault List */}
            <VaultList
              vaults={vaultData?.vaults || []}
              isLoading={isLoading}
              error={error}
              chainName={vaultData?.chainName || getMorphoChainById(selectedChainId)?.name || 'Unknown'}
              showOnlyUserPositions={showOnlyUserPositions}
              onToggleUserPositions={setShowOnlyUserPositions}
              isConnected={isConnected}
            />
          </div>
        )}

        {/* Browse Vaults (when not connected) */}
        {!isConnected && isSupported && (
          <div className="mt-12">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Explore Morpho Vaults
              </h2>
              <p className="text-gray-600">
                Browse available vaults on {getMorphoChainById(selectedChainId)?.name}
              </p>
            </div>
            
            <VaultList
              vaults={vaultData?.vaults || []}
              isLoading={isLoading}
              error={error}
              chainName={vaultData?.chainName || getMorphoChainById(selectedChainId)?.name || 'Unknown'}
              showOnlyUserPositions={false}
              onToggleUserPositions={() => {}}
              isConnected={false}
            />
          </div>
        )}
      </main>
    </div>
  );
}
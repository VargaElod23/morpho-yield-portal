'use client';

import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Percent,
  ArrowUpDown,
  ExternalLink,
  Wallet,
  Info
} from 'lucide-react';
import type { VaultWithYield } from '@/types/morpho';
import { 
  formatTokenAmount, 
  formatPercentage, 
  formatAPY, 
  getValueColorClass,
  sortVaults,
  truncateAddress,
  cn,
  calculateRewardAmount
} from '@/lib/utils';

interface VaultListProps {
  vaults: VaultWithYield[];
  isLoading?: boolean;
  error?: string | null;
  chainName: string;
  showOnlyUserPositions?: boolean;
  onToggleUserPositions?: (value: boolean) => void;
  isConnected?: boolean;
}

type SortOption = 'apy' | 'yield' | 'balance' | 'name';

export function VaultList({ 
  vaults, 
  isLoading, 
  error, 
  chainName, 
  showOnlyUserPositions = false,
  onToggleUserPositions = () => {},
  isConnected = false 
}: VaultListProps) {
  const [sortBy, setSortBy] = useState<SortOption>('apy');
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-morpho-text">
            {chainName} Vaults
          </h2>
          <div className="h-4 w-20 bg-morpho-surface-hover rounded animate-pulse" />
        </div>
        
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-morpho-surface border border-morpho-border rounded-lg p-6 animate-pulse">
              <div className="flex items-center justify-between mb-4">
                <div className="h-6 w-32 bg-morpho-surface-hover rounded" />
                <div className="h-5 w-16 bg-morpho-surface-hover rounded" />
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="space-y-2">
                    <div className="h-4 w-20 bg-morpho-surface-hover rounded" />
                    <div className="h-6 w-24 bg-morpho-surface-hover rounded" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-morpho-error/10 border border-morpho-error/20 rounded-lg p-6">
        <div className="flex items-center space-x-2 text-morpho-error">
          <TrendingDown className="w-5 h-5" />
          <h3 className="font-medium">Error loading vaults</h3>
        </div>
        <p className="text-morpho-error/80 mt-2">{error}</p>
      </div>
    );
  }

  if (!vaults || vaults.length === 0) {
    return (
      <div className="bg-morpho-surface border border-morpho-border rounded-lg p-8 text-center">
        <Wallet className="w-12 h-12 text-morpho-text-secondary mx-auto mb-4" />
        <h3 className="text-lg font-medium text-morpho-text mb-2">No vaults found</h3>
        <p className="text-morpho-text-secondary">
          No Morpho vaults are available on {chainName} at the moment.
        </p>
      </div>
    );
  }

  // Filter vaults based on user position toggle
  const filteredVaults = showOnlyUserPositions && isConnected 
    ? vaults.filter(v => v.userPosition) 
    : vaults;
  
  const sortedVaults = sortVaults(filteredVaults, sortBy);
  const vaultsWithUserPositions = sortedVaults.filter(v => v.userPosition);
  const totalNetYield = vaultsWithUserPositions.reduce((sum, v) => sum + (v.yieldData?.netYield || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-morpho-text">
            {chainName} Vaults ({vaults.length})
          </h2>
          {isConnected && vaultsWithUserPositions.length > 0 && (
            <p className="text-sm text-morpho-text-secondary mt-1">
              Total Net Yield: 
              <span className={cn("ml-1 font-medium", getValueColorClass(totalNetYield))}>
                {totalNetYield > 0 ? '+' : ''}{totalNetYield.toFixed(4)} {vaultsWithUserPositions[0]?.asset?.symbol || 'USDC'}
              </span>
            </p>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-4">
          {/* User Positions Toggle */}
          {isConnected && (
            <div className="flex items-center space-x-2">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={showOnlyUserPositions}
                  onChange={(e) => onToggleUserPositions(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-morpho-surface-hover peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-morpho-accent/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-morpho-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-morpho-accent"></div>
              </label>
              <span className="text-sm text-morpho-text-secondary">My Positions Only</span>
            </div>
          )}

          {/* Sort Options */}
          <div className="flex items-center space-x-2">
            <ArrowUpDown className="w-4 h-4 text-morpho-text-secondary" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="border border-morpho-border bg-morpho-surface rounded-lg px-3 py-2 text-sm text-morpho-text focus:outline-none focus:ring-2 focus:ring-morpho-accent focus:border-morpho-accent"
            >
              <option value="apy">Sort by APY</option>
              <option value="yield">Sort by Yield</option>
              <option value="balance">Sort by Balance</option>
              <option value="name">Sort by Name</option>
            </select>
          </div>
        </div>
      </div>

      {/* Vault Cards */}
      <div className="grid gap-4">
        {sortedVaults.map((vault) => (
          <VaultCard key={vault.id} vault={vault} />
        ))}
      </div>
    </div>
  );
}

function VaultCard({ vault }: { vault: VaultWithYield }) {
  const { isConnected } = useAccount();
  const hasUserPosition = !!vault.userPosition;
  const yieldData = vault.yieldData;

  return (
    <div className="bg-morpho-surface border border-morpho-border rounded-lg p-6 card-hover hover:border-morpho-accent/30 transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-morpho-text">{vault.name}</h3>
          <div className="flex items-center space-x-2 mt-1">
            <p className="text-sm text-morpho-text-secondary">
              {truncateAddress(vault.address)}
            </p>
            <ExternalLink className="w-3 h-3 text-morpho-text-secondary cursor-pointer hover:text-morpho-accent" />
          </div>
        </div>
        
        <div className="text-right">
          <div className="flex items-center space-x-1">
            <span className="text-lg font-bold text-morpho-accent">
              {formatAPY(vault.apy?.base || 0, vault.apy?.rewards || 0)}
            </span>
          </div>
          <p className="text-xs text-morpho-text-secondary">APY</p>
        </div>
      </div>

      {/* APY Summary */}
      <div className={cn(
        "mb-3 p-3 rounded-lg",
        vault.apy?.rewards && vault.apy.rewards > 0 
          ? "bg-gradient-to-r from-morpho-accent/10 to-morpho-purple/10 border border-morpho-accent/20" 
          : "bg-morpho-accent/5 border border-morpho-accent/10"
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-morpho-text">Total APY:</span>
            <span className="text-lg font-bold text-morpho-text">
              {formatPercentage((vault.apy?.base || 0) + (vault.apy?.rewards || 0))}
            </span>
            {vault.apy?.rewards && vault.apy.rewards > 0 ? (
              <span className="text-xs bg-morpho-accent text-white px-2 py-1 rounded-full">
                +REWARDS
              </span>
            ) : <></>}
          </div>
          <div className="text-xs text-morpho-text-secondary">
            Base + Rewards
          </div>
        </div>
        
        {/* Show total annual rewards if user has position */}
        {vault.userPosition && vault.apy?.rewards && vault.apy.rewards > 0 ? (
          <div className="mt-2 pt-2 border-t border-morpho-accent/20">
            <div className="flex items-center justify-between text-xs">
              <span className="text-morpho-text-secondary">Annual Rewards:</span>
              <span className="font-medium text-morpho-text">
                {calculateRewardAmount(
                  parseFloat(vault.userPosition.balance),
                  vault.apy.rewards,
                  'REWARD'
                )}
              </span>
            </div>
          </div>
        ) : <></>}
      </div>

      {/* Vault Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div className="space-y-1">
          <p className="text-xs text-morpho-text-secondary uppercase tracking-wide">Total Assets</p>
          <p className="text-sm font-medium text-morpho-text">
            {formatTokenAmount(
              parseFloat(vault.totalAssets) / Math.pow(10, vault.asset?.decimals || 18),
              vault.asset?.symbol || 'ETH'
            )}
          </p>
        </div>
        
        <div className="space-y-1">
          <div className="flex items-center space-x-1">
            <p className="text-xs text-morpho-text-secondary uppercase tracking-wide">Base APY</p>
            <Tooltip content="Core yield from the underlying protocol (e.g., lending, staking). This is your main source of returns.">
              <Info className="w-3 h-3 text-morpho-text-secondary cursor-help" />
            </Tooltip>
          </div>
          <p className="text-sm font-medium text-morpho-success">
            {formatPercentage(vault.apy?.base || 0)}
          </p>
        </div>
        
        <div className="space-y-1">
          <div className="flex items-center space-x-1">
            <p className="text-xs text-morpho-text-secondary uppercase tracking-wide">Rewards APY</p>
            <Tooltip content="Additional incentive tokens on top of base yield. Examples: IMF USDS offers IMF rewards, Gauntlet eUSD Core offers eUSD rewards.">
              <Info className="w-3 h-3 text-morpho-text-secondary cursor-help" />
            </Tooltip>
          </div>
            <div className="space-y-1">
              <div className="flex items-center space-x-1">
                <p className={cn(
                  "text-sm font-medium",
                  vault.apy?.rewards && vault.apy.rewards > 0 ? "text-morpho-accent" : "text-morpho-text-secondary"
                )}>
                  {formatPercentage(vault.apy?.rewards || 0)}
                </p>
            {vault.apy?.rewards && vault.apy.rewards > 0 ? (
              <span className={cn(
                "text-xs px-1.5 py-0.5 rounded-full",
                vault.apy.rewardTokens && vault.apy.rewardTokens.length > 1
                  ? "text-morpho-purple bg-morpho-purple/10 border border-morpho-purple/20"
                  : "text-morpho-accent bg-morpho-accent/10"
              )}>
                {vault.apy.rewardTokens && vault.apy.rewardTokens.length > 1 
                  ? `+${vault.apy.rewardTokens.length} REWARDS`
                  : '+BONUS'
                }
              </span>
            ) : <></>}
            </div>
            
            {/* Show reward amounts and token details */}
            {vault.apy?.rewardTokens && vault.apy.rewardTokens.length > 0 ? (
              <div className="space-y-1">
                {vault.apy.rewardTokens.map((reward, index) => (
                  <div key={index} className="text-xs text-morpho-accent bg-morpho-accent/10 px-2 py-1 rounded border border-morpho-accent/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1">
                        <span className="font-medium text-morpho-text">
                          {reward.asset?.symbol || 'REWARD'}
                        </span>
                        <span className="text-morpho-accent">
                          {reward.supplyApr.toFixed(2)}%
                        </span>
                      </div>
                      <span className="font-semibold text-morpho-text">
                        {calculateRewardAmount(
                          vault.userPosition ? parseFloat(vault.userPosition.balance) : 0,
                          reward.supplyApr,
                          reward.asset?.symbol || 'REWARD'
                        )}
                      </span>
                    </div>
                    {reward.asset?.name && (
                      <div className="text-xs text-morpho-text-secondary mt-1 flex items-center justify-between">
                        <span>{reward.asset.name}</span>
                        <span className="text-morpho-text-secondary">
                          {reward.asset.address ? truncateAddress(reward.asset.address) : ''}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
                
                {/* Show total rewards summary */}
                {vault.apy.rewardTokens.length > 1 && (
                  <div className="text-xs text-morpho-accent bg-morpho-accent/20 px-2 py-1 rounded border border-morpho-accent/30">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-morpho-text">Total Rewards:</span>
                      <span className="font-semibold text-morpho-text">
                        {vault.apy.rewardTokens.reduce((total, reward) => {
                          const amount = vault.userPosition 
                            ? parseFloat(vault.userPosition.balance) * (reward.supplyApr / 100)
                            : 0;
                          return total + amount;
                        }, 0).toFixed(2)} REWARDS
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : <></>}
            
            {/* Show estimated reward amount for vaults with rewards but no specific tokens */}
            {vault.apy?.rewards && vault.apy.rewards > 0 && (!vault.apy.rewardTokens || vault.apy.rewardTokens.length === 0) ? (
              <div className="text-xs text-morpho-accent bg-morpho-accent/10 px-2 py-1 rounded">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-morpho-text">Estimated Rewards</span>
                  <span className="text-morpho-text">
                    {calculateRewardAmount(
                      vault.userPosition ? parseFloat(vault.userPosition.balance) : 0,
                      vault.apy.rewards,
                      'REWARD'
                    )}
                  </span>
                </div>
              </div>
            ) : <></>}
          </div>
        </div>
        
        <div className="space-y-1">
          <div className="flex items-center space-x-1">
            <p className="text-xs text-morpho-text-secondary uppercase tracking-wide">Price/Share</p>
            <Tooltip content="Current value of 1 vault token in the underlying asset (e.g., 1.025 USDC per vault token). Increases as the vault earns yield.">
              <Info className="w-3 h-3 text-morpho-text-secondary cursor-help" />
            </Tooltip>
          </div>
          <p className="text-sm font-medium text-morpho-text">
            {vault.sharePrice 
              ? (parseFloat(vault.sharePrice) / Math.pow(10, vault.asset?.decimals || 6)).toFixed(6)
              : 'N/A'}
          </p>
        </div>
      </div>

      {/* User Position (if connected and has position) */}
      {isConnected && hasUserPosition && yieldData && (
        <div className="border-t border-morpho-border pt-4">
          <div className="flex items-center space-x-2 mb-3">
            <Wallet className="w-4 h-4 text-morpho-accent" />
            <h4 className="text-sm font-medium text-morpho-text">Your Position</h4>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="space-y-1">
            <p className="text-xs text-morpho-text-secondary uppercase tracking-wide">Current Balance</p>
            <p className="text-sm font-medium text-morpho-text">
              {formatTokenAmount(yieldData.currentBalance, vault.asset?.symbol || 'ETH', 4)}
            </p>
          </div>
          
          <div className="space-y-1">
            <p className="text-xs text-morpho-text-secondary uppercase tracking-wide">Total Deposited</p>
            <p className="text-sm font-medium text-morpho-text">
              {formatTokenAmount(yieldData.totalDeposited, vault.asset?.symbol || 'ETH', 4)}
            </p>
          </div>
          
          <div className="space-y-1">
            <p className="text-xs text-morpho-text-secondary uppercase tracking-wide">Net Yield</p>
            <div className="flex items-center space-x-1">
              {yieldData.netYield > 0 ? (
                <TrendingUp className="w-3 h-3 text-morpho-success" />
              ) : yieldData.netYield < 0 ? (
                <TrendingDown className="w-3 h-3 text-morpho-error" />
              ) : (
                <DollarSign className="w-3 h-3 text-morpho-text-secondary" />
              )}
              <p className={cn("text-sm font-medium", getValueColorClass(yieldData.netYield))}>
                {yieldData.netYield > 0 ? '+' : ''}{formatTokenAmount(yieldData.netYield, vault.asset?.symbol || 'ETH', 4)}
              </p>
            </div>
          </div>
            
            <div className="space-y-1">
              <p className="text-xs text-morpho-text-secondary uppercase tracking-wide">Yield %</p>
              <p className={cn("text-sm font-medium", getValueColorClass(yieldData.yieldPercentage))}>
                {yieldData.yieldPercentage > 0 ? '+' : ''}{formatPercentage(yieldData.yieldPercentage)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* No Position Message */}
      {isConnected && !hasUserPosition && (
        <div className="border-t border-morpho-border pt-4">
          <p className="text-sm text-morpho-text-secondary text-center py-2">
            No position in this vault
          </p>
        </div>
      )}
    </div>
  );
}

// Tooltip component for better UX
function Tooltip({ children, content }: { children: React.ReactNode; content: string }) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="cursor-help"
      >
        {children}
      </div>
      {isVisible && (
        <div className="absolute z-10 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg whitespace-nowrap -top-2 left-1/2 transform -translate-x-1/2 -translate-y-full">
          {content}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { ExternalLink, Gift, TrendingUp } from 'lucide-react';
import { formatTokenAmount } from '@/lib/utils';
import { useAccount, useChainId } from 'wagmi';
import { getClaimableRewardsFromAllSources } from '@/lib/morpho-rewards';

interface ClaimableReward {
  symbol: string;
  name: string;
  address: string;
  claimable: number;
  accruing: number;
  claimableValue: number;
  accruingValue: number;
  price: number;
}

interface ClaimableRewardsProps {
  className?: string;
}

export function ClaimableRewards({ className = '' }: ClaimableRewardsProps) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const [claimableRewards, setClaimableRewards] = useState<ClaimableReward[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch claimable rewards from Merkl API
  useEffect(() => {
    const fetchRewards = async () => {
      if (!isConnected || !address) {
        setClaimableRewards([]);
        return;
      }

      setIsLoading(true);
      try {
        const allRewards = await getClaimableRewardsFromAllSources(address);
        
        // Transform to our component format
        const transformedRewards: ClaimableReward[] = allRewards
          .filter(reward => reward.claimable > 0 || reward.accruing > 0)
          .map(reward => ({
            symbol: reward.symbol,
            name: reward.name,
            address: reward.address,
            claimable: reward.claimable,
            accruing: reward.accruing,
            claimableValue: reward.claimableValue,
            accruingValue: reward.accruingValue,
            price: reward.price,
          }));

        setClaimableRewards(transformedRewards);
      } catch (error) {
        console.error('Error fetching claimable rewards:', error);
        setClaimableRewards([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRewards();
  }, [address, chainId, isConnected]);

  const totalClaimableValue = claimableRewards.reduce((sum, reward) => sum + reward.claimableValue, 0);
  const totalAccruingValue = claimableRewards.reduce((sum, reward) => sum + reward.accruingValue, 0);

  if (!isConnected) {
    return null;
  }

  return (
    <div className={`bg-morpho-surface border border-morpho-border rounded-lg p-4 flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Gift className="w-4 h-4 text-morpho-accent" />
          <h3 className="text-sm font-semibold text-morpho-text">Claimable Rewards</h3>
          {totalClaimableValue > 0 && (
            <span className="w-2 h-2 bg-morpho-accent rounded-full"></span>
          )}
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-morpho-text">
            ${totalClaimableValue.toFixed(2)}
          </p>
          <p className="text-xs text-morpho-text-secondary">Total</p>
        </div>
      </div>

      {/* Rewards List - Condensed */}
      <div className="flex-grow">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-8 bg-morpho-bg rounded"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {claimableRewards.slice(0, 3).map((reward, index) => (
              <div key={index} className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-morpho-accent/20 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-morpho-accent">
                      {reward.symbol.charAt(0)}
                    </span>
                  </div>
                  <span className="text-morpho-text font-medium">{reward.symbol}</span>
                </div>
                <div className="text-right">
                  <p className="text-morpho-text font-medium">
                    {formatTokenAmount(reward.claimable, reward.symbol, 2)}
                  </p>
                  <p className="text-morpho-text-secondary">
                    ${reward.claimableValue.toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
            
            {claimableRewards.length > 3 && (
              <div className="text-center pt-2 border-t border-morpho-border">
                <p className="text-xs text-morpho-text-secondary">
                  +{claimableRewards.length - 3} more tokens
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons - Condensed */}
      {totalClaimableValue > 0 && !isLoading && (
        <div className="mt-auto pt-3 border-t border-morpho-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              <TrendingUp className="w-3 h-3 text-morpho-accent" />
              <span className="text-xs text-morpho-text-secondary">
                ${totalAccruingValue.toFixed(2)} accruing
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <button className="px-2 py-1 bg-morpho-accent text-white rounded text-xs font-medium hover:bg-morpho-accent/90 transition-colors flex items-center space-x-1">
                <ExternalLink className="w-3 h-3" />
                <span>Claim</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
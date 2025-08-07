'use client';

import { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend
} from 'recharts';
import { VaultWithYield } from '@/types/morpho';
import { formatTokenAmount, getValueColorClass } from '@/lib/utils';

interface RewardsBreakdownChartProps {
  vaults: VaultWithYield[];
  className?: string;
}

interface VaultRewardData {
  vaultName: string;
  vaultAddress: string;
  totalEarned: number;
  totalDeposited: number;
  assetSymbol: string;
  color: string;
}

export function RewardsBreakdownChart({ vaults, className = '' }: RewardsBreakdownChartProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1m' | '3m' | '6m'>('3m');

  // Filter vaults that have user positions
  const userVaults = vaults.filter(vault => vault.userPosition && vault.yieldData);

  // Generate color palette for vaults
  const colors = [
    '#3b82f6', // Blue
    '#10b981', // Green
    '#f59e0b', // Yellow
    '#ef4444', // Red
    '#8b5cf6', // Purple
    '#06b6d4', // Cyan
    '#84cc16', // Lime
    '#f97316', // Orange
  ];

  // Calculate rewards breakdown data
  const rewardsData: VaultRewardData[] = userVaults.map((vault, index) => {
    const yieldData = vault.yieldData!;
    const currentBalance = yieldData.currentBalance;
    const totalDeposited = yieldData.totalDeposited;
    const totalEarned = currentBalance - totalDeposited;
    
    // Add estimated claimable rewards based on vault APY and balance
    const estimatedRewards = vault.userPosition ? 
      parseFloat(vault.userPosition.balance) * ((vault.apy?.rewards || 0) / 100) : 0;
    
    return {
      vaultName: vault.name,
      vaultAddress: vault.address,
      totalEarned: Math.max(0, totalEarned + estimatedRewards), // Include estimated rewards
      totalDeposited,
      assetSymbol: vault.asset?.symbol || 'ETH',
      color: colors[index % colors.length],
    };
  }).filter(data => data.totalEarned > 0); // Only show vaults with positive earnings

  // Sort by total earned (highest first)
  rewardsData.sort((a, b) => b.totalEarned - a.totalEarned);

  // Calculate totals
  const totalEarned = rewardsData.reduce((sum, data) => sum + data.totalEarned, 0);
  const totalDeposited = rewardsData.reduce((sum, data) => sum + data.totalDeposited, 0);

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as VaultRewardData;
      return (
        <div className="bg-morpho-surface border border-morpho-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-morpho-text mb-2">{data.vaultName}</p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-morpho-text-secondary">Total Earned:</span>
              <span className="font-medium text-morpho-text">
                {formatTokenAmount(data.totalEarned, data.assetSymbol, 4)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-morpho-text-secondary">Base Yield:</span>
              <span className="font-medium text-morpho-success">
                {formatTokenAmount(data.totalEarned - (data.totalEarned * 0.3), data.assetSymbol, 4)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-morpho-text-secondary">Rewards:</span>
              <span className="font-medium text-morpho-accent">
                {formatTokenAmount(data.totalEarned * 0.3, data.assetSymbol, 4)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-morpho-text-secondary">Total Deposited:</span>
              <span className="font-medium text-morpho-text-secondary">
                {formatTokenAmount(data.totalDeposited, data.assetSymbol, 4)}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  if (rewardsData.length === 0) {
    return (
      <div className={`bg-morpho-surface border border-morpho-border rounded-lg p-6 ${className}`}>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-morpho-text mb-2">Rewards Breakdown</h3>
          <p className="text-morpho-text-secondary">
            No earnings data available. Connect your wallet and deposit into vaults to see your rewards breakdown.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-morpho-surface border border-morpho-border rounded-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-morpho-text mb-1">Rewards Breakdown</h3>
          <p className="text-sm text-morpho-text-secondary">
            See which vaults are generating the most rewards
          </p>
        </div>
        
        {/* Timeframe Selector */}
        <div className="flex items-center space-x-1 bg-morpho-bg rounded-lg p-1">
          {(['1m', '3m', '6m'] as const).map((timeframe) => (
            <button
              key={timeframe}
              onClick={() => setSelectedTimeframe(timeframe)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                selectedTimeframe === timeframe
                  ? 'bg-morpho-accent text-white'
                  : 'text-morpho-text-secondary hover:text-morpho-text'
              }`}
            >
              {timeframe}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center">
          <p className="text-sm text-morpho-text-secondary">Total Earned</p>
          <p className="text-lg font-bold text-morpho-text">
            {formatTokenAmount(totalEarned, 'USD', 2)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-morpho-text-secondary">Total Deposited</p>
          <p className="text-lg font-bold text-morpho-success">
            {formatTokenAmount(totalDeposited, 'USD', 2)}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rewardsData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333333" />
            <XAxis 
              dataKey="vaultName" 
              stroke="#a0a0a0"
              fontSize={12}
              tickFormatter={(value) => {
                // Truncate long vault names
                return value.length > 15 ? value.substring(0, 15) + '...' : value;
              }}
            />
            <YAxis 
              stroke="#a0a0a0"
              fontSize={12}
              domain={[0, 'dataMax']}
              tickFormatter={(value) => {
                if (value >= 1000) {
                  return `$${(value / 1000).toFixed(1)}k`;
                } else {
                  return `$${value.toFixed(0)}`;
                }
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="totalEarned" radius={[4, 4, 0, 0]}>
              {rewardsData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
} 
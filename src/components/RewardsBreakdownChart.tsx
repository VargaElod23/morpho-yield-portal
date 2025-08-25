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
import { VaultWithYield, Transaction } from '@/types/morpho';
import { formatTokenAmount, getValueColorClass } from '@/lib/utils';

interface RewardsBreakdownChartProps {
  vaults: VaultWithYield[];
  transactions?: Transaction[];
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

export function RewardsBreakdownChart({ vaults, transactions = [], className = '' }: RewardsBreakdownChartProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1m' | '3m' | '6m'>('3m');

  // Use the exact same logic as Dashboard.tsx line 63
  const userVaults = vaults.filter(vault => vault.userPosition);

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

  // Use uniform transaction-based calculation (matches Dashboard logic)
  const totalBalance = userVaults.reduce((sum, v) => sum + (v.yieldData?.currentBalance || 0), 0);
  
  // Calculate total deposited from actual transaction data (matches Dashboard.tsx:69-71)
  const totalDepositedFromTransactions = transactions
    .filter(tx => tx.type === 'MetaMorphoDeposit')
    .reduce((sum, tx) => sum + tx.data.assetsUsd, 0);
  
  const totalDeposited = totalDepositedFromTransactions;
  const totalEarned = totalBalance - totalDeposited; // Matches Dashboard.tsx:74

  // Calculate per-vault breakdown while maintaining total consistency
  const rewardsData: VaultRewardData[] = userVaults.map((vault, index) => {
    if (!vault.yieldData) return null;
    
    const vaultBalance = vault.yieldData.currentBalance;
    
    // Calculate this vault's proportion of total balance
    const vaultProportion = totalBalance > 0 ? vaultBalance / totalBalance : 0;
    
    // Allocate earned yield proportionally to maintain consistency with total
    const vaultEarned = totalEarned * vaultProportion;
    const vaultDeposited = totalDeposited * vaultProportion;
    
    return {
      vaultName: vault.name,
      vaultAddress: vault.address,
      totalEarned: Math.max(0, vaultEarned),
      totalDeposited: vaultDeposited,
      assetSymbol: vault.asset?.symbol || 'ETH',
      color: colors[index % colors.length],
    };
  }).filter((data): data is VaultRewardData => data !== null && data.totalEarned > 0);

  // Sort by total earned (highest first)
  rewardsData.sort((a, b) => b.totalEarned - a.totalEarned);

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-4 sm:space-y-0">
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-morpho-text mb-1">Rewards Breakdown</h3>
          <p className="text-xs sm:text-sm text-morpho-text-secondary">
            See which vaults are generating the most rewards
          </p>
        </div>
        
        {/* Timeframe Selector */}
        <div className="flex items-center space-x-1 bg-morpho-bg rounded-lg p-1 w-fit">
          {(['1m', '3m', '6m'] as const).map((timeframe) => (
            <button
              key={timeframe}
              onClick={() => setSelectedTimeframe(timeframe)}
              className={`px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm font-medium transition-colors ${
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
          <p className="text-xs sm:text-sm text-morpho-text-secondary">Total Earned</p>
          <p className="text-sm sm:text-lg font-bold text-morpho-text">
            {formatTokenAmount(totalEarned, 'USD', 2)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs sm:text-sm text-morpho-text-secondary">Total Deposited</p>
          <p className="text-sm sm:text-lg font-bold text-morpho-success">
            {formatTokenAmount(totalDeposited, 'USD', 2)}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-48 sm:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rewardsData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333333" />
            <XAxis 
              dataKey="vaultName" 
              stroke="#a0a0a0"
              fontSize={10}
              tickFormatter={(value) => {
                // Truncate long vault names more aggressively on mobile
                return value.length > 12 ? value.substring(0, 12) + '...' : value;
              }}
              interval="preserveStartEnd"
            />
            <YAxis 
              stroke="#a0a0a0"
              fontSize={10}
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
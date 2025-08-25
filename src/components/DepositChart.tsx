'use client';

import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  ReferenceLine,
} from 'recharts';
import { VaultWithYield, Transaction } from '@/types/morpho';
import { formatTokenAmount, formatCurrency } from '@/lib/utils';

interface DepositData {
  date: string;
  totalValue: number;
  deposits: Array<{
    vault: string;
    amount: number;
    symbol: string;
  }>;
  assets: Array<{
    vault: string;
    amount: number;
    symbol: string;
  }>;
}

interface DepositChartProps {
  vaults: VaultWithYield[];
  transactions: Transaction[];
  className?: string;
}

// Define deposit events with amounts
interface DepositEvent {
  date: Date;
  amount: number;
  vault: string;
}

// Calculate position value over time based on actual transaction data
function calculatePositionValueOverTime(vault: VaultWithYield, targetDate: Date, transactions: Transaction[]): { depositAmount: number; originalAsset: string } {
  if (!vault.userPosition) return { depositAmount: 0, originalAsset: 'USDC' };
  
  const balance = parseFloat(vault.userPosition.balance);
  
  // Filter transactions for this specific vault
  const vaultTransactions = transactions.filter(tx => 
    tx.data.vault.address.toLowerCase() === vault.address.toLowerCase()
  );
  
  // Calculate cumulative deposits up to the target date
  let cumulativeAmount = 0;
  vaultTransactions.forEach(tx => {
    const txDate = new Date(tx.timestamp * 1000); // Convert timestamp to Date
    if (txDate <= targetDate) {
      if (tx.type === 'MetaMorphoDeposit') {
        cumulativeAmount += tx.data.assetsUsd;
      } else if (tx.type === 'MetaMorphoWithdraw') {
        cumulativeAmount -= tx.data.assetsUsd;
      }
    }
  });
  
  // Before any deposits, show zero
  if (cumulativeAmount === 0) {
    return { depositAmount: 0, originalAsset: 'USDC' };
  }
  
  // After deposits, show the cumulative amount (capped at current balance)
  return { 
    depositAmount: Math.min(cumulativeAmount, balance), 
    originalAsset: 'USDC' // Most vaults accept USDC deposits
  };
}

// Generate deposit data based on actual user positions
function generateDepositData(vaults: VaultWithYield[], transactions: Transaction[], timeframe: '1m' | '3m' | '6m' = '3m'): DepositData[] {
  const data: DepositData[] = [];
  const now = new Date();
  
  // Get actual user positions with balances (consistent with Dashboard.tsx:63)
  const userPositions = vaults.filter(vault => vault.userPosition);
  
  // Calculate number of days based on timeframe
  const timeframeDays = {
    '1m': 30,
    '3m': 90,
    '6m': 180,
  };
  
  const daysToShow = timeframeDays[timeframe];
  
  // Generate timeline data based on selected timeframe
  for (let i = daysToShow; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    const deposits: Array<{ vault: string; amount: number; symbol: string }> = [];
    let totalValue = 0;
    
    // Calculate deposits aggregated by asset type for this specific date
    const depositsByAsset: { [key: string]: number } = {};
    
    userPositions.forEach(vault => {
      const positionData = calculatePositionValueOverTime(vault, date, transactions);
      
      if (positionData.depositAmount > 0) {
        // Aggregate by asset type
        const assetSymbol = positionData.originalAsset;
        depositsByAsset[assetSymbol] = (depositsByAsset[assetSymbol] || 0) + positionData.depositAmount;
        totalValue += positionData.depositAmount;
      }
    });
    
    // Convert aggregated deposits to array format
    Object.entries(depositsByAsset).forEach(([symbol, amount]) => {
      deposits.push({
        vault: `Total Deposited`,
        amount,
        symbol,
      });
    });
    
    // Get assets (share tokens) for this specific date - time-based calculation
    const assets: Array<{ vault: string; amount: number; symbol: string }> = [];
    
    userPositions.forEach(vault => {
      if (vault.userPosition) {
        const positionData = calculatePositionValueOverTime(vault, date, transactions);
        
        if (positionData.depositAmount > 0) {
          // For assets, show the value breakdown at this specific date
          // This should represent the share tokens you held at that time
          const shares = parseFloat(vault.userPosition.shares);
          const shareTokens = shares / Math.pow(10, 18); // Convert from wei to human readable
          
          // Calculate the value at this specific date (similar to deposits but for display)
          const assetValue = positionData.depositAmount; // Use the same time-based calculation
          
          assets.push({
            vault: vault.name, // Keep individual vault names
            amount: assetValue, // Show the value at this specific date
            symbol: vault.asset.symbol, // Share token symbol (reUSDC, fUSDC, etc.)
          });
        }
      }
    });

    data.push({
      date: date.toISOString().split('T')[0],
      totalValue,
      deposits,
      assets,
    });
  }
  
  return data;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as DepositData;
    
    // Calculate total deposits for tooltip (should match summary)
    const totalDeposited = data.deposits.reduce((sum, deposit) => sum + deposit.amount, 0);
    
    return (
      <div className="bg-morpho-surface border border-morpho-border rounded-lg p-4 shadow-lg">
        <p className="text-morpho-text font-medium mb-2">
          {new Date(label).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          })}
        </p>
        <p className="text-morpho-text-secondary text-sm mb-3">
          Total Value: {formatCurrency(data.totalValue, 'USD')}
        </p>
        {data.deposits.length > 0 && (
          <div className="space-y-1">
            <p className="text-morpho-text-secondary text-xs mb-2">Deposits:</p>
            {data.deposits.map((deposit, index) => (
              <div key={index} className="flex justify-between text-xs">
                <span className="text-morpho-text">{deposit.vault}</span>
                <span className="text-morpho-accent">
                  {formatTokenAmount(deposit.amount, deposit.symbol)}
                </span>
              </div>
            ))}
          </div>
        )}
        {data.assets && data.assets.length > 0 && (
          <div className="space-y-1 mt-3 pt-3 border-t border-morpho-border">
            <p className="text-morpho-text-secondary text-xs mb-2">Assets:</p>
            {data.assets.map((asset, index) => (
              <div key={index} className="flex justify-between text-xs">
                <span className="text-morpho-text">{asset.vault}</span>
                <span className="text-morpho-purple">
                  {formatTokenAmount(asset.amount, asset.symbol)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
  
  return null;
};

export function DepositChart({ vaults, transactions, className = '' }: DepositChartProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1m' | '3m' | '6m'>('3m');
  
  // Filter transactions based on selected timeframe
  const getFilteredTransactions = () => {
    const now = new Date();
    const timeframeDays = {
      '1m': 30,
      '3m': 90,
      '6m': 180,
    };
    
    const cutoffDate = new Date(now.getTime() - (timeframeDays[selectedTimeframe] * 24 * 60 * 60 * 1000));
    
    return transactions.filter(tx => {
      const txDate = new Date(tx.timestamp * 1000);
      return txDate >= cutoffDate;
    });
  };
  
  const filteredTransactions = getFilteredTransactions();
  const depositData = generateDepositData(vaults, filteredTransactions, selectedTimeframe);
  
  // Use the exact same calculation logic as Dashboard.tsx lines 63-75
  const userVaults = vaults.filter(v => v.userPosition) || [];
  const totalCurrentValue = userVaults.reduce((sum, v) => sum + (v.yieldData?.currentBalance || 0), 0);
  
  // Calculate total deposited from actual transaction data (matches Dashboard.tsx:69-71)
  const totalDepositedFromTransactions = transactions
    .filter(tx => tx.type === 'MetaMorphoDeposit')
    .reduce((sum, tx) => sum + tx.data.assetsUsd, 0);
  
  const totalDeposited = totalDepositedFromTransactions;
  const totalYield = totalCurrentValue - totalDeposited; // Matches Dashboard.tsx:74
  
  const percentageChange = totalDeposited > 0 
    ? (totalYield / totalDeposited) * 100 
    : 0;
  
  return (
    <div className={`bg-morpho-surface border border-morpho-border rounded-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-morpho-text mb-1">
            Earn Timeline
          </h2>
          <div className="flex items-center space-x-4">
            <span className="text-2xl font-bold text-morpho-text">
              {formatCurrency(totalCurrentValue, 'USD')}
            </span>
            <span className={`text-sm font-medium ${
              percentageChange >= 0 ? 'text-morpho-success' : 'text-morpho-error'
            }`}>
              {percentageChange >= 0 ? '+' : ''}{percentageChange.toFixed(2)}%
            </span>
          </div>
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
      
      {/* Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={depositData}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#333333" />
            <XAxis 
              dataKey="date" 
              stroke="#a0a0a0"
              fontSize={12}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                });
              }}
            />
            <YAxis 
              stroke="#a0a0a0"
              fontSize={12}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="totalValue"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#colorValue)"
            />
            {/* Reference lines for all deposit dates */}
            {transactions
              .filter(tx => tx.type === 'MetaMorphoDeposit')
              .sort((a, b) => a.timestamp - b.timestamp)
              .map((tx, index) => {
                // Create a color palette for multiple deposits
                const colors = ["#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4", "#84cc16"];
                const color = colors[index % colors.length];
                
                return (
                  <ReferenceLine 
                    key={tx.id}
                    x={new Date(tx.timestamp * 1000).toISOString().split('T')[0]}
                    stroke={color}
                    strokeDasharray="3 3"
                    label={{ 
                      value: `+${tx.data.assetsUsd.toFixed(0)}`, 
                      position: "top", 
                      fill: color,
                      fontSize: 10
                    }}
                  />
                );
              })}
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-morpho-border">
        <div>
          <p className="text-morpho-text-secondary text-sm">Total Deposited</p>
          <p className="text-morpho-text font-semibold">
            {formatCurrency(totalDeposited, 'USD')}
          </p>
        </div>
        <div>
          <p className="text-morpho-text-secondary text-sm">Current Value</p>
          <p className="text-morpho-text font-semibold">
            {formatCurrency(totalCurrentValue, 'USD')}
          </p>
        </div>
        <div>
          <p className="text-morpho-text-secondary text-sm">Total Earned Until Now</p>
          <p className={`font-semibold ${
            totalYield >= 0 ? 'text-morpho-success' : 'text-morpho-error'
          }`}>
            {formatCurrency(totalYield, 'USD')}
          </p>
        </div>
      </div>
    </div>
  );
} 
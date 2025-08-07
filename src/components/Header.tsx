'use client';

import { WalletConnect } from './WalletConnect';
import { ChainSelector } from './ChainSelector';
import { TrendingUp, RefreshCw } from 'lucide-react';

interface HeaderProps {
  onChainSelect?: (chainId: number) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function Header({ onChainSelect, onRefresh, isRefreshing }: HeaderProps) {
  return (
    <header className="bg-morpho-surface border-b border-morpho-border sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Title */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-morpho-accent to-morpho-purple rounded-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-morpho-text">
                Morpho Yield Monitor
              </h1>
              <p className="text-sm text-morpho-text-secondary">
                Track your DeFi yields across chains
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-4">
            {/* Refresh Button */}
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={isRefreshing}
                className="p-2 text-morpho-text-secondary hover:text-morpho-accent hover:bg-morpho-accent/10 rounded-lg transition-colors disabled:opacity-50"
                title="Refresh data"
              >
                <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            )}

            {/* Chain Selector */}
            <ChainSelector onChainSelect={onChainSelect} />

            {/* Wallet Connect */}
            <WalletConnect />
          </div>
        </div>
      </div>
    </header>
  );
}
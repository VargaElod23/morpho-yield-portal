'use client';

import { WalletConnect } from './WalletConnect';
import { ChainSelector } from './ChainSelector';
import { NotificationManager } from './NotificationManager';
import { TrendingUp, RefreshCw } from 'lucide-react';

interface HeaderProps {
  onChainSelect?: (chainId: number) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function Header({ onChainSelect, onRefresh, isRefreshing }: HeaderProps) {
  return (
    <header className="bg-morpho-surface border-b border-morpho-border sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        {/* Desktop Layout */}
        <div className="hidden md:flex items-center justify-between h-16">
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

            {/* Notifications */}
            <NotificationManager />

            {/* Wallet Connect */}
            <WalletConnect />
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden">
          {/* Single Row - All Elements */}
          <div className="flex items-center justify-between h-12">
            <div className="flex items-center space-x-1 sm:space-x-2">
              <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-morpho-accent to-morpho-purple rounded-lg">
                <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
              </div>
              <h1 className="text-base sm:text-lg font-bold text-morpho-text">Monitor</h1>
            </div>

            <div className="flex items-center space-x-0.5 sm:space-x-1">
              {/* Refresh Button */}
              {onRefresh && (
                <button
                  onClick={onRefresh}
                  disabled={isRefreshing}
                  className="p-0.5 sm:p-1 text-morpho-text-secondary hover:text-morpho-accent hover:bg-morpho-accent/10 rounded-lg transition-colors disabled:opacity-50"
                  title="Refresh data"
                >
                  <RefreshCw className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>
              )}

              {/* Chain Selector */}
              <ChainSelector onChainSelect={onChainSelect} />

              {/* Notifications */}
              <NotificationManager />

              {/* Wallet Connect */}
              <WalletConnect />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
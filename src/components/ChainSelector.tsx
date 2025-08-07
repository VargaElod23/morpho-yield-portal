'use client';

import { useState } from 'react';
import { useChainId, useSwitchChain } from 'wagmi';
import { ChevronDown, Check, AlertCircle } from 'lucide-react';
import { MORPHO_CHAINS, isSupportedChain } from '@/lib/chains';
import { cn } from '@/lib/utils';

interface ChainSelectorProps {
  onChainSelect?: (chainId: number) => void;
  className?: string;
}

export function ChainSelector({ onChainSelect, className }: ChainSelectorProps) {
  const chainId = useChainId();
  const { switchChain, isPending } = useSwitchChain();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const currentChain = MORPHO_CHAINS.find(chain => chain.id === chainId);
  const isSupported = isSupportedChain(chainId);

  const handleChainSelect = async (selectedChainId: number) => {
    setIsDropdownOpen(false);
    
    try {
      // If we have access to wagmi's switch chain, use it
      if (switchChain) {
        switchChain({ chainId: selectedChainId as 1 | 137 | 42161 | 8453 | 1301 | 1002 });
      }
      
      // Also call the callback for data refresh
      onChainSelect?.(selectedChainId);
    } catch (error) {
      console.error('Failed to switch chain:', error);
    }
  };

  return (
    <div className={cn("relative", className)}>
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        disabled={isPending}
        className={cn(
          "flex items-center space-x-3 px-4 py-2 rounded-lg border transition-all duration-200 min-w-[160px]",
          isSupported 
            ? "bg-morpho-surface border-morpho-border hover:border-morpho-accent hover:shadow-md text-morpho-text" 
            : "bg-morpho-error/10 border-morpho-error text-morpho-error",
          isPending && "opacity-50 cursor-not-allowed"
        )}
      >
        {/* Chain Icon */}
        <div className={cn(
          "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
          isSupported ? "bg-morpho-accent/20 text-morpho-accent" : "bg-morpho-error/20 text-morpho-error"
        )}>
          {currentChain ? currentChain.name.charAt(0) : '?'}
        </div>
        
        {/* Chain Name */}
        <div className="flex-1 text-left">
          <p className="text-sm font-medium text-morpho-text">
            {currentChain?.name || 'Unsupported Chain'}
          </p>
          {!isSupported && (
            <p className="text-xs text-morpho-error">Not supported by Morpho</p>
          )}
        </div>

        {/* Status Icon */}
        {!isSupported ? (
          <AlertCircle className="w-4 h-4 text-morpho-error" />
        ) : (
          <ChevronDown className={cn(
            "w-4 h-4 text-morpho-text-secondary transition-transform",
            isDropdownOpen && "rotate-180"
          )} />
        )}
      </button>

      {/* Dropdown */}
      {isDropdownOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-morpho-surface rounded-lg shadow-xl border border-morpho-border py-2 z-50 max-h-64 overflow-y-auto">
          <div className="px-4 py-2 border-b border-morpho-border">
            <h3 className="text-sm font-medium text-morpho-text">Select Chain</h3>
            <p className="text-xs text-morpho-text-secondary">Switch to a Morpho-supported network</p>
          </div>
          
          <div className="py-2">
            {MORPHO_CHAINS.map((chain) => {
              const isSelected = chain.id === chainId;
              
              return (
                <button
                  key={chain.id}
                  onClick={() => handleChainSelect(chain.id)}
                  disabled={isPending}
                  className={cn(
                    "w-full flex items-center space-x-3 px-4 py-3 text-left transition-colors",
                    isSelected 
                      ? "bg-morpho-accent/10 text-morpho-accent" 
                      : "hover:bg-morpho-surface-hover text-morpho-text",
                    isPending && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {/* Chain Icon */}
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                    isSelected 
                      ? "bg-morpho-600 text-white" 
                      : "bg-gray-100 text-gray-600"
                  )}>
                    {chain.name.charAt(0)}
                  </div>
                  
                  {/* Chain Info */}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{chain.name}</p>
                    <p className="text-xs text-gray-500">
                      Chain ID: {chain.id}
                    </p>
                  </div>

                  {/* Selected Indicator */}
                  {isSelected && (
                    <Check className="w-4 h-4 text-morpho-600" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              {MORPHO_CHAINS.length} supported chains
            </p>
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isDropdownOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsDropdownOpen(false)}
        />
      )}
    </div>
  );
}
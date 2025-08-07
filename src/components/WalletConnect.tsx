'use client';

import { useConnect, useAccount, useDisconnect } from 'wagmi';
import { Wallet, LogOut, ChevronDown } from 'lucide-react';
import { useState, useEffect } from 'react';
import { truncateAddress } from '@/lib/utils';

export function WalletConnect() {
  const { connectors, connect, isPending } = useConnect();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only rendering wallet state after mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg">
        <Wallet className="w-4 h-4" />
        <span>Connect Wallet</span>
      </button>
    );
  }

  if (isConnected && address) {
    return (
      <div className="relative">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center space-x-2 bg-morpho-600 hover:bg-morpho-700 text-white px-4 py-2 rounded-lg transition-all duration-200 shadow-lg"
        >
          <Wallet className="w-4 h-4" />
          <span className="font-medium">{truncateAddress(address)}</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {isDropdownOpen && (
          <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
            <div className="px-4 py-2 border-b border-gray-100">
              <p className="text-sm text-gray-500">Connected</p>
              <p className="text-sm font-medium text-gray-900 break-all">{address}</p>
            </div>
            <button
              onClick={() => {
                disconnect();
                setIsDropdownOpen(false);
              }}
              className="w-full flex items-center space-x-2 px-4 py-2 text-left text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Disconnect</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        disabled={isPending}
        className="flex items-center space-x-2 bg-morpho-600 hover:bg-morpho-700 disabled:bg-morpho-400 text-white px-6 py-2 rounded-lg transition-all duration-200 shadow-lg font-medium"
      >
        <Wallet className="w-4 h-4" />
        <span>{isPending ? 'Connecting...' : 'Connect Wallet'}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
      </button>

      {isDropdownOpen && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
          <div className="px-4 py-2 border-b border-gray-100">
            <h3 className="text-sm font-medium text-gray-900">Connect a Wallet</h3>
            <p className="text-xs text-gray-500 mt-1">Choose your preferred wallet</p>
          </div>
          
          <div className="py-2">
            {connectors.map((connector) => (
              <button
                key={connector.uid}
                onClick={() => {
                  connect({ connector });
                  setIsDropdownOpen(false);
                }}
                disabled={isPending}
                className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-morpho-500 to-morpho-600 rounded-full flex items-center justify-center">
                  <Wallet className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{connector.name}</p>
                  <p className="text-xs text-gray-500">
                    {connector.name === 'Injected' ? 'Browser Wallet' : 
                     connector.name === 'WalletConnect' ? 'Scan with wallet' :
                     'Connect with app'}
                  </p>
                </div>
              </button>
            ))}
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
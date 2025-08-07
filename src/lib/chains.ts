import { defineChain } from 'viem';
import type { Chain } from '@/types/morpho';

// Define custom chains that might not be in viem's default set
export const unichain = defineChain({
  id: 1301, // Unichain testnet ID - update when mainnet is available
  name: 'Unichain',
  network: 'unichain',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['https://sepolia.unichain.org'],
    },
    public: {
      http: ['https://sepolia.unichain.org'],
    },
  },
  blockExplorers: {
    default: { name: 'Uniscan', url: 'https://sepolia.uniscan.xyz' },
  },
});

export const katana = defineChain({
  id: 1002, // Katana testnet ID - update when mainnet is available
  name: 'Katana',
  network: 'katana',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['https://katana-rpc.kakarot.org'], // Placeholder - update with actual RPC
    },
    public: {
      http: ['https://katana-rpc.kakarot.org'],
    },
  },
  blockExplorers: {
    default: { name: 'Katana Explorer', url: 'https://katana-explorer.kakarot.org' },
  },
});

// Morpho supported chains configuration
export const MORPHO_CHAINS: Chain[] = [
  {
    id: 1,
    name: 'Ethereum',
    graphqlEndpoint: 'https://api.morpho.org/graphql',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: {
      default: { http: ['https://eth.llamarpc.com'] },
      public: { http: ['https://eth.llamarpc.com'] },
    },
    blockExplorers: {
      default: { name: 'Etherscan', url: 'https://etherscan.io' },
    },
  },
  {
    id: 137,
    name: 'Polygon',
    graphqlEndpoint: 'https://api.morpho.org/graphql',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18,
    },
    rpcUrls: {
      default: { http: ['https://polygon-rpc.com'] },
      public: { http: ['https://polygon-rpc.com'] },
    },
    blockExplorers: {
      default: { name: 'PolygonScan', url: 'https://polygonscan.com' },
    },
  },
  {
    id: 42161,
    name: 'Arbitrum',
    graphqlEndpoint: 'https://api.morpho.org/graphql',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: {
      default: { http: ['https://arb1.arbitrum.io/rpc'] },
      public: { http: ['https://arb1.arbitrum.io/rpc'] },
    },
    blockExplorers: {
      default: { name: 'Arbiscan', url: 'https://arbiscan.io' },
    },
  },
  {
    id: 8453,
    name: 'Base',
    graphqlEndpoint: 'https://api.morpho.org/graphql',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: {
      default: { http: ['https://mainnet.base.org'] },
      public: { http: ['https://mainnet.base.org'] },
    },
    blockExplorers: {
      default: { name: 'BaseScan', url: 'https://basescan.org' },
    },
  },
  {
    id: 1301,
    name: 'Unichain',
    graphqlEndpoint: 'https://api.morpho.org/graphql', // May need to update when available
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: {
      default: { http: ['https://sepolia.unichain.org'] },
      public: { http: ['https://sepolia.unichain.org'] },
    },
    blockExplorers: {
      default: { name: 'Uniscan', url: 'https://sepolia.uniscan.xyz' },
    },
  },
  {
    id: 1002,
    name: 'Katana',
    graphqlEndpoint: 'https://api.morpho.org/graphql', // May need to update when available
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: {
      default: { http: ['https://katana-rpc.kakarot.org'] },
      public: { http: ['https://katana-rpc.kakarot.org'] },
    },
    blockExplorers: {
      default: { name: 'Katana Explorer', url: 'https://katana-explorer.kakarot.org' },
    },
  },
];

export const MORPHO_CHAIN_IDS = MORPHO_CHAINS.map(chain => chain.id);

export function getMorphoChainById(chainId: number): Chain | undefined {
  return MORPHO_CHAINS.find(chain => chain.id === chainId);
}

export function isSupportedChain(chainId: number): boolean {
  return MORPHO_CHAIN_IDS.includes(chainId);
}
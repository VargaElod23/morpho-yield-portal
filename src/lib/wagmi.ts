import { createConfig, http } from 'wagmi';
import { mainnet, polygon, arbitrum, base } from 'wagmi/chains';
import { coinbaseWallet, injected, walletConnect } from 'wagmi/connectors';
import { unichain, katana } from './chains';

// Project ID for WalletConnect (you'll need to get this from https://cloud.walletconnect.com)
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo-project-id';

// Singleton pattern to prevent multiple wagmi config instances
let configInstance: ReturnType<typeof createConfig> | null = null;

function createWagmiConfig() {
  if (configInstance) {
    return configInstance;
  }

  configInstance = createConfig({
    chains: [mainnet, polygon, arbitrum, base, unichain, katana],
    connectors: [
      injected(),
      coinbaseWallet({
        appName: 'Morpho Yield Monitor',
        appLogoUrl: '/favicon.svg',
      }),
      walletConnect({
        projectId,
        metadata: {
          name: 'Morpho Yield Monitor',
          description: 'Track your Morpho vault yields across multiple chains',
          url: typeof window !== 'undefined' ? window.location.origin : 'https://morpho-yield-portal.vercel.app',
          icons: ['/favicon.svg'],
        },
        showQrModal: false, // Prevent duplicate modal instances
      }),
    ],
    transports: {
      [mainnet.id]: http('https://eth.llamarpc.com'),
      [polygon.id]: http('https://polygon-rpc.com'),
      [arbitrum.id]: http('https://arb1.arbitrum.io/rpc'),
      [base.id]: http('https://mainnet.base.org'),
      [unichain.id]: http('https://sepolia.unichain.org'),
      [katana.id]: http('https://katana-rpc.kakarot.org'),
    },
  });

  return configInstance;
}

// Export singleton instance
export const config = createWagmiConfig();

declare module 'wagmi' {
  interface Register {
    config: typeof config;
  }
}
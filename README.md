# Morpho Yield Monitor 🚀

A modern, multi-chain DeFi application for tracking your Morpho vault yields across different blockchain networks with real-time transaction data and beautiful visualizations.

## Features ✨

- **Multi-Chain Support**: Track yields on Ethereum, Polygon, Arbitrum, Base, Unichain, and Katana
- **Real-time Data**: Connect to Morpho's GraphQL API for live vault and position data
- **Transaction-Based Calculations**: Accurate yield calculations using actual deposit/withdrawal transactions
- **Interactive Timeline Chart**: Visualize your deposit history and portfolio growth over time
- **Wallet Integration**: Support for multiple wallet types via WalletConnect and Coinbase Wallet
- **Yield Calculations**: Automatic calculation of net yield and yield percentages based on real transaction data
- **Beautiful Dark UI**: Modern, responsive design with Morpho-themed dark interface
- **Performance Optimized**: Built with Next.js 14 and React Query for optimal performance
- **Dynamic Timeframes**: View your portfolio performance over 1 month, 3 months, or 6 months

## Quick Start 🚀

### Prerequisites

- Node.js 18+ 
- npm or yarn
- A Web3 wallet (MetaMask, Coinbase Wallet, etc.)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd morpho-yield-monitor
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env.local` file with:
   ```bash
   # WalletConnect Project ID (get from https://cloud.walletconnect.com)
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
   
   # Optional: Custom RPC URLs for better performance
   NEXT_PUBLIC_ETHEREUM_RPC_URL=https://eth.llamarpc.com
   NEXT_PUBLIC_POLYGON_RPC_URL=https://polygon-rpc.com
   NEXT_PUBLIC_ARBITRUM_RPC_URL=https://arb1.arbitrum.io/rpc
   NEXT_PUBLIC_BASE_RPC_URL=https://mainnet.base.org
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## How It Works 🔧

### Architecture

The application is built with:
- **Frontend**: Next.js 14 + React + TypeScript + Tailwind CSS
- **Wallet Integration**: Wagmi v2 + Viem for Web3 connectivity
- **Data Layer**: GraphQL client for Morpho API integration
- **State Management**: React Query for server state management
- **Charts**: Recharts for interactive data visualizations

### Key Components

1. **Dashboard**: Main interface showing user statistics, vault positions, and timeline chart
2. **WalletConnect**: Handles wallet connection and user authentication
3. **ChainSelector**: Allows switching between supported blockchain networks
4. **VaultList**: Displays available vaults and user positions with yield calculations
5. **DepositChart**: Interactive timeline showing portfolio growth and deposit events
6. **Header**: Navigation and controls with beautiful dark theme

### Yield Calculation

The app calculates yield using real transaction data:
```
Net Yield = Current Balance - (Total Deposited - Total Withdrawn)
Yield Percentage = (Net Yield / Total Deposited) × 100
```

**Key Features:**
- Uses actual `MetaMorphoDeposit` and `MetaMorphoWithdraw` transactions
- Calculates individual vault yields based on transaction history
- Shows total portfolio yield across all vaults
- Displays rewards APY and additional incentive tokens

### Timeline Chart

The interactive chart provides:
- **Portfolio Value Over Time**: Shows your total portfolio value across selected timeframe
- **Deposit Events**: Visual markers for all your deposit transactions
- **Dynamic Timeframes**: 1 month, 3 months, or 6 months view
- **Tooltip Details**: Hover to see deposits and current asset breakdown
- **Color-Coded Deposits**: Different colors for each deposit event

## Supported Chains 🌐

| Chain | Chain ID | Status |
|-------|----------|---------|
| Ethereum | 1 | ✅ Supported |
| Polygon | 137 | ✅ Supported |
| Arbitrum | 42161 | ✅ Supported |
| Base | 8453 | ✅ Supported |
| Unichain | 1301 | 🚧 Testnet |
| Katana | 1002 | 🚧 Testnet |

## API Integration 📡

The app integrates with Morpho's GraphQL API to fetch:
- Available vaults per chain
- User vault positions with real-time balances
- APY data (base + rewards)
- Vault metrics (total assets, supply, share price)
- Transaction history (deposits and withdrawals)

### Example Queries

**Get Vaults:**
```graphql
query GetVaults($chainIds: [Int!]!) {
  vaults(where: { chainId_in: $chainIds }, first: 100) {
    items {
      address
      symbol
      name
      asset { address symbol decimals }
      state {
        totalAssets
        totalSupply
        sharePrice
        apy
        netApy
        rewards { supplyApr asset { symbol name address } }
      }
    }
  }
}
```

**Get User Positions:**
```graphql
query GetUserVaults($chainIds: [Int!]!, $userAddress: String!) {
  vaultPositions(where: { 
    chainId_in: $chainIds, 
    userAddress_in: [$userAddress] 
  }, first: 100) {
    items {
      user { address }
      vault { address symbol name asset { address symbol decimals } }
      state { shares }
    }
  }
}
```

**Get Transaction History:**
```graphql
query GetUserTransactions($userAddress: String!, $chainIds: [Int!]!) {
  transactions(where: { 
    userAddress_in: [$userAddress], 
    chainId_in: $chainIds, 
    type_in: [MetaMorphoDeposit, MetaMorphoWithdraw] 
  }, first: 100, orderBy: Timestamp) {
    items {
      id
      timestamp
      hash
      type
      data {
        ... on VaultTransactionData {
          shares
          assets
          assetsUsd
          vault { address symbol name }
        }
      }
    }
  }
}
```

## UI/UX Features 🎨

### Dark Theme
- **Morpho Branded**: Custom color palette matching Morpho's design
- **Responsive Design**: Works perfectly on desktop and mobile
- **Accessibility**: High contrast ratios and readable typography
- **Smooth Animations**: Hover effects and transitions

### Interactive Elements
- **Timeframe Selector**: Switch between 1m, 3m, and 6m views
- **Vault Filtering**: Toggle to show only your positions
- **Sort Options**: Sort vaults by APY, yield, balance, or name
- **Tooltips**: Detailed information on hover
- **Real-time Updates**: Live data refresh capabilities

## Development 🛠️

### Project Structure

```
src/
├── app/                 # Next.js app directory
├── components/          # React components
│   ├── Dashboard.tsx   # Main dashboard with chart
│   ├── DepositChart.tsx # Interactive timeline chart
│   ├── VaultList.tsx   # Vault display and filtering
│   ├── WalletConnect.tsx # Wallet connection
│   └── ChainSelector.tsx # Chain switching
├── hooks/              # Custom React hooks
│   └── useMorphoData.ts # Data fetching and caching
├── lib/                # Utility functions and configs
│   ├── wagmi.ts        # Wagmi configuration
│   ├── graphql.ts      # GraphQL client and queries
│   ├── chains.ts       # Chain configurations
│   └── utils.ts        # Utility functions
└── types/              # TypeScript type definitions
    └── morpho.ts       # Morpho API types
```

### Key Files

- `src/lib/wagmi.ts` - Wagmi configuration for multi-chain support
- `src/lib/graphql.ts` - GraphQL client and queries
- `src/lib/chains.ts` - Chain configurations
- `src/hooks/useMorphoData.ts` - Data fetching hook with transaction support
- `src/components/Dashboard.tsx` - Main application component
- `src/components/DepositChart.tsx` - Interactive timeline chart
- `src/components/VaultList.tsx` - Vault display with yield calculations

### Building for Production

```bash
npm run build
npm start
```

## Recent Updates 🆕

### Latest Features
- ✅ **Transaction-Based Yield Calculations**: Uses real deposit/withdrawal data
- ✅ **Interactive Timeline Chart**: Visualize portfolio growth over time
- ✅ **Beautiful Dark Theme**: Morpho-branded interface
- ✅ **Dynamic Timeframes**: 1m, 3m, 6m portfolio views
- ✅ **Accurate KPI Display**: Real-time total balance, deposited, and earned amounts
- ✅ **Individual Vault Yields**: Precise yield calculations per vault
- ✅ **Deposit Event Markers**: Visual indicators for all deposit transactions

### Technical Improvements
- ✅ **GraphQL Integration**: Direct API queries for real-time data
- ✅ **TypeScript Types**: Complete type safety for all components
- ✅ **Performance Optimization**: React Query for efficient data caching
- ✅ **Responsive Design**: Mobile-friendly interface
- ✅ **Error Handling**: Graceful error states and loading indicators

## Contributing 🤝

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License 📄

This project is licensed under the MIT License - see the LICENSE file for details.

## Support 💬

If you have any questions or run into issues:
- Check the [Morpho Documentation](https://docs.morpho.org/)
- Open an issue on this repository
- Join the [Morpho Discord](https://discord.gg/morpho)

---

**Happy yield farming! 🌾**
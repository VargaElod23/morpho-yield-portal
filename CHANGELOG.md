# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.1] - 2025-08-25### Fixed

- Fixed WalletConnect duplicate initialization warnings
- Suppressed Lit dev mode warnings in development
- Fixed multiple Lit versions loading warnings
- Improved console output cleanliness in development

### Changed

- Improved provider initialization with memoization
- Added singleton pattern for wagmi config to prevent duplicates
### Added
- releases email subscription
## [1.1.0] - 2025-01-24

### Added

- 🔔 **Push Notification System**
  - Daily yield update notifications for subscribed users
  - Browser push notifications with Web Push API
  - Service worker for background notification handling
  - VAPID key authentication for secure push messaging
  - Database persistence for notification subscriptions
  - Multi-chain yield tracking and 24h comparison
  - Smart filtering to only notify users with active positions (>$0.01)

- **Database Integration**
  - PostgreSQL support for notification subscriptions
  - Yield history tracking for 24h comparisons
  - Automatic cleanup of old historical data
  - Fallback to in-memory storage for development

- **Enhanced User Experience**
  - Notification subscription toggle in UI
  - Brave browser compatibility warnings
  - Test notification functionality (removed in production)
  - One-click subscription/unsubscription

### Changed

- **Unified Calculation Logic**
  - Standardized yield calculations across Dashboard, DepositChart, and notifications
  - Transaction-based deposit calculations for accuracy
  - Consistent yield percentage calculations
  - Improved vault position filtering

- **Enhanced Notification Content**
  - Rich notification format with absolute yield amounts
  - Global yield percentage display
  - Current balance and 24h change tracking
  - Meaningful notification titles and descriptions

### Fixed

- Fixed TypeScript compilation errors in notification system
- Resolved database SSL certificate issues
- Fixed SQL syntax errors with null chainData
- Corrected yield calculation discrepancies between components
- Fixed Brave browser notification blocking detection

## [1.0.2] - 2025-01-16

### Fixed

- Fixed mobile responsive design issues
- Improved layout consistency across screen sizes
- Enhanced mobile navigation and component spacing

## [1.0.1] - 2025-01-16

### Fixed

- Fixed layout rendering issues
- Improved component positioning and alignment
- Enhanced responsive design for better mobile experience

### Added

- Redirect functionality for earn page interactions
- Improved user navigation flow

## [1.0.0] - 2025-01-16

### Added

- 🚀 **Initial Release - Morpho Yield Monitor**
- **Multi-Chain DeFi Yield Tracking**
  - Support for Ethereum, Polygon, Arbitrum, Base, Unichain, and Katana
  - Real-time vault position monitoring
  - Cross-chain yield aggregation

- **Comprehensive Dashboard**
  - Total balance, deposited amounts, and earned yield tracking
  - Yield percentage calculations with color-coded indicators
  - Vault list with detailed position information
  - Claimable rewards tracking and management

- **Interactive Charts and Visualizations**
  - Earn timeline with deposit history visualization
  - Rewards breakdown chart showing vault performance
  - Historical data tracking with 1m/3m/6m timeframes
  - Transaction-based deposit tracking with reference lines

- **Advanced Wallet Integration**
  - Support for MetaMask, Coinbase Wallet, and WalletConnect
  - Multi-chain wallet switching
  - Real-time balance updates
  - Transaction history integration

- **Smart Data Processing**
  - GraphQL integration with Morpho's API
  - Efficient caching with React Query
  - Automatic data refresh capabilities
  - User position filtering and aggregation

- **Professional UI/UX**
  - Custom Morpho-themed dark mode design
  - Responsive design for all screen sizes
  - Loading states and error handling
  - Accessibility considerations

### Technical Implementation

- **Frontend**: Next.js 14 with TypeScript and Tailwind CSS
- **Web3**: Wagmi v2 for wallet connections and chain interactions
- **State Management**: React Query for server state management
- **Charts**: Recharts for data visualization
- **Styling**: Custom Morpho theme with dark mode support

### Infrastructure

- **Deployment**: Vercel with automatic deployments
- **Performance**: Optimized for fast loading and minimal re-renders
- **Security**: Secure API endpoints and data validation
- **Monitoring**: Built-in error handling and logging

---

## Development Notes

### Notification System Architecture

The push notification system uses:
- **Service Worker** (`/public/sw.js`) for background processing
- **Web Push API** with VAPID authentication
- **PostgreSQL** for persistent storage (with in-memory fallback)
- **Cron Jobs** for daily notification delivery
- **Batch Processing** to handle rate limits (5 users per batch)

### Calculation Consistency

All yield calculations now use the same transaction-based approach:

```typescript
// Standard calculation used across all components
const totalBalance = userVaults.reduce((sum, v) => sum + (v.yieldData?.currentBalance || 0), 0);
const totalDeposited = transactions
  .filter(tx => tx.type === 'MetaMorphoDeposit')
  .reduce((sum, tx) => sum + tx.data.assetsUsd, 0);
const totalYield = totalBalance - totalDeposited;
```

### Browser Compatibility

- ✅ Chrome/Edge: Full support including notifications
- ✅ Firefox: Full support including notifications  
- ✅ Safari: Full support including notifications
- ⚠️ Brave: Notifications blocked by default (warning shown)
- ✅ Mobile PWA: Full notification support when installed

### Performance Optimizations

- Memoized providers to prevent unnecessary re-renders
- Batched API calls to reduce server load
- Efficient caching strategies with React Query
- Optimized bundle size with tree shaking
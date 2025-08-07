export interface Chain {
  id: number;
  name: string;
  graphqlEndpoint?: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: {
    default: { http: string[] };
    public: { http: string[] };
  };
  blockExplorers: {
    default: { name: string; url: string };
  };
}

export interface VaultReward {
  supplyApr: number;
  asset?: {
    symbol: string;
    name: string;
    address: string;
  };
}

export interface MorphoVault {
  id: string;
  name: string;
  address: string;
  totalAssets: string;
  totalSupply: string;
  sharePrice: string;
  apy: {
    base: number;
    rewards: number;
    rewardTokens?: VaultReward[];
  };
  asset: {
    symbol: string;
    decimals: number;
    address: string;
  };
}

export interface UserVaultPosition {
  vault: {
    id: string;
    address: string;
    name: string;
    asset: {
      symbol: string;
      decimals: number;
      address: string;
    };
  };
  balance: string;
  deposited: string;
  withdrawn: string;
  shares: string;
  sharePrice?: number;
  timestamp?: number;
  apy?: {
    base: number;
    rewards: number;
  };
}

export interface YieldCalculation {
  currentBalance: number;
  totalDeposited: number;
  totalWithdrawn: number;
  netYield: number;
  yieldPercentage: number;
  pricePerShare: number;
}

export interface VaultWithYield extends MorphoVault {
  userPosition?: UserVaultPosition;
  yieldData?: YieldCalculation;
}

export interface ChainVaultData {
  chainId: number;
  chainName: string;
  vaults: VaultWithYield[];
  totalNetYield: number;
  isLoading: boolean;
  error?: string;
}

// GraphQL response types - matching actual Morpho API
export interface VaultResponse {
  address: string;
  symbol: string;
  name?: string;
  asset: {
    address: string;
    symbol: string;
    decimals: number;
  };
  metadata?: {
    description?: string;
  };
  state?: {
    totalAssets?: string;
    totalSupply?: string;
    sharePrice?: string;
    apy?: number;
    netApy?: number;
    rewards?: Array<{
      supplyApr: number;
      asset?: {
        symbol: string;
        name: string;
        address: string;
      };
    }>;
  };
}

export interface VaultPositionResponse {
  user: {
    address: string;
  };
  vault: {
    address: string;
    symbol: string;
    name?: string;
    asset: {
      address: string;
      symbol: string;
      decimals: number;
    };
    state?: {
      sharePrice?: number;
      apy?: number;
      netApy?: number;
    };
  };
  state: {
    shares: string;
    timestamp?: number;
  };
}

export interface GetVaultsResponse {
  vaults?: {
    items: VaultResponse[];
  };
}

export interface GetUserVaultsResponse {
  vaultPositions?: {
    items: VaultPositionResponse[];
  };
}

export interface GraphQLError {
  message: string;
  locations?: Array<{
    line: number;
    column: number;
  }>;
  path?: string[];
}

export interface Transaction {
  id: string;
  timestamp: number;
  hash: string;
  type: 'MetaMorphoDeposit' | 'MetaMorphoWithdraw';
  data: {
    shares: string;
    assets: number;
    assetsUsd: number;
    vault: {
      address: string;
      symbol: string;
      name: string;
    };
  };
}

export interface GetUserTransactionsResponse {
  transactions: {
    items: Transaction[];
  };
}
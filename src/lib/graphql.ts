import { GraphQLClient } from 'graphql-request';
import type { 
  GetVaultsResponse, 
  GetUserVaultsResponse, 
  GetUserTransactionsResponse,
  MorphoVault, 
  UserVaultPosition,
  Transaction
} from '@/types/morpho';

const MORPHO_GRAPHQL_ENDPOINT = 'https://api.morpho.org/graphql';

// Create GraphQL client
const client = new GraphQLClient(MORPHO_GRAPHQL_ENDPOINT);

// GraphQL queries based on the actual Morpho API schema
export const GET_VAULTS_QUERY = `
  query GetVaults($chainIds: [Int!]!) {
    vaults(where: { chainId_in: $chainIds }, first: 100) {
      items {
        address
        symbol
        name
        asset {
          address
          symbol
          decimals
        }
        metadata {
          description
        }
        state {
          totalAssets
          totalSupply
          sharePrice
          apy
          netApy
          rewards {
            supplyApr
            asset {
              symbol
              name
              address
            }
          }
        }
      }
    }
  }
`;

export const GET_USER_VAULTS_QUERY = `
  query GetUserVaults($chainIds: [Int!]!, $userAddresses: [String!]!) {
    vaultPositions(where: { 
      chainId_in: $chainIds, 
      userAddress_in: $userAddresses 
    }, first: 100) {
      items {
        user {
          address
        }
        vault {
          address
          symbol
          name
          asset {
            address
            symbol
            decimals
          }
          state {
            sharePrice
            apy
            netApy
          }
        }
        state {
          shares
        }
      }
    }
  }
`;

export const GET_USER_TRANSACTIONS_QUERY = `
  query GetUserTransactions($userAddress: String!, $chainIds: [Int!]!) {
    transactions(
      where: { 
        userAddress_in: [$userAddress], 
        chainId_in: $chainIds, 
        type_in: [MetaMorphoDeposit, MetaMorphoWithdraw] 
      }, 
      first: 100, 
      orderBy: Timestamp
    ) {
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
            vault {
              address
              symbol
              name
            }
          }
        }
      }
    }
  }
`;

// Utility functions for API calls
export async function getVaults(chainId: number): Promise<MorphoVault[]> {
  try {
    const response = await client.request<GetVaultsResponse>(GET_VAULTS_QUERY, {
      chainIds: [chainId],
    });
    
    // Map the vault response to our MorphoVault interface
    return (response.vaults?.items || []).map(vault => {
      const sharePrice = parseFloat(vault.state?.sharePrice || "1000000"); // Default to 1.0 in asset decimals format
      const assetDecimals = vault.asset.decimals;
      const pricePerShare = sharePrice / Math.pow(10, assetDecimals);
      
      return {
        id: vault.address,
        name: vault.name || vault.symbol,
        address: vault.address,
        totalAssets: vault.state?.totalAssets || "0",
        totalSupply: vault.state?.totalSupply || "0",
        sharePrice: sharePrice.toString(),
        apy: {
          base: (vault.state?.netApy || vault.state?.apy || 0) * 100, // Convert decimal to percentage
          rewards: Math.max(0, ((vault.state?.apy || 0) - (vault.state?.netApy || 0)) * 100), // Calculate rewards as difference, minimum 0
          rewardTokens: vault.state?.rewards?.map(reward => ({
            supplyApr: reward.supplyApr * 100, // Convert to percentage
            asset: reward.asset
          })) || [],
        },
        asset: {
          symbol: vault.asset.symbol,
          decimals: vault.asset.decimals,
          address: vault.asset.address,
        },
      };
    });
  } catch (error) {
    console.error(`Error fetching vaults for chain ${chainId}:`, error);
    throw new Error(`Failed to fetch vaults: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getUserVaultPositions(
  userAddress: string, 
  chainId: number
): Promise<UserVaultPosition[]> {
  try {
    const response = await client.request<GetUserVaultsResponse>(GET_USER_VAULTS_QUERY, {
      chainIds: [chainId],
      userAddresses: [userAddress.toLowerCase()],
    });
    
        // Map the VaultPosition response to our UserVaultPosition interface
    return (response.vaultPositions?.items || []).map(position => {
      // Convert shares to actual balance using sharePrice
      // Formula: balance = (shares * sharePrice) / (10^18) / (10^assetDecimals)
      const shares = parseFloat(position.state.shares);
      const sharePrice = position.vault.state?.sharePrice || 1000000; // Default to 1.0 (1e6 format)
      const assetDecimals = position.vault.asset.decimals;
      
      // Morpho shares are in 18 decimals, sharePrice is in asset decimals format
      const balanceInWei = (shares * sharePrice) / Math.pow(10, 18);
      const actualBalance = balanceInWei / Math.pow(10, assetDecimals);
      
      // For yield calculation, we need to know the original deposit amount
      // Since we don't have historical data, we'll assume the user deposited
      // when share price was 1.0 (which is the standard for most vaults)
      // This gives us a baseline for yield calculation
      const originalValue = (shares * 1000000) / Math.pow(10, 18) / Math.pow(10, assetDecimals);
      
      return {
        vault: {
          id: position.vault.address,
          address: position.vault.address,
          name: position.vault.name || position.vault.symbol,
          asset: {
            symbol: position.vault.asset.symbol,
            decimals: position.vault.asset.decimals,
            address: position.vault.asset.address,
          },
        },
        balance: actualBalance.toString(),
        deposited: originalValue.toString(), // Original value when shares were purchased
        withdrawn: "0", // Not available in this response
        shares: position.state.shares,
        sharePrice: sharePrice, // Include share price for yield calculations
        timestamp: position.state.timestamp, // Include timestamp for yield calculations
        apy: {
          base: (position.vault.state?.netApy || position.vault.state?.apy || 0) * 100, // Convert decimal to percentage
          rewards: 0, // Most vaults don't have separate rewards APY
        },
      };
    });
  } catch (error) {
    console.error(`Error fetching user vaults for chain ${chainId}:`, error);
    throw new Error(`Failed to fetch user positions: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getUserTransactions(
  userAddress: string, 
  chainId: number
): Promise<Transaction[]> {
  try {
    const response = await client.request<GetUserTransactionsResponse>(GET_USER_TRANSACTIONS_QUERY, {
      userAddress: userAddress.toLowerCase(),
      chainIds: [chainId],
    });
    
    return response.transactions?.items || [];
  } catch (error) {
    console.error(`Error fetching user transactions for chain ${chainId}:`, error);
    throw new Error(`Failed to fetch user transactions: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Chain ID mapping for supported Morpho chains
const SUPPORTED_CHAIN_IDS = [1, 137, 42161, 8453, 1301, 1002];

export function isSupportedChainId(chainId: number): boolean {
  return SUPPORTED_CHAIN_IDS.includes(chainId);
}

// Utility function to handle GraphQL errors
export function handleGraphQLError(error: any): string {
  if (error?.response?.errors) {
    return error.response.errors.map((e: any) => e.message).join(', ');
  }
  if (error?.message) {
    return error.message;
  }
  return 'An unknown error occurred';
}
import type { 
  MorphoVault, 
  UserVaultPosition, 
  YieldCalculation, 
  VaultWithYield,
  Transaction
} from '@/types/morpho';

/**
 * Calculate yield for a user's vault position based on actual transaction data
 */
export function calculateYieldFromTransactions(
  vault: MorphoVault,
  position: UserVaultPosition,
  transactions: Transaction[]
): YieldCalculation {
  const currentBalance = parseFloat(position.balance);
  
  // Calculate total deposited from actual transaction data for this specific vault
  const vaultTransactions = transactions.filter(tx => 
    tx.data.vault.address.toLowerCase() === vault.address.toLowerCase()
  );
  
  const totalDeposited = vaultTransactions
    .filter(tx => tx.type === 'MetaMorphoDeposit')
    .reduce((sum, tx) => sum + tx.data.assetsUsd, 0);
  
  const totalWithdrawn = vaultTransactions
    .filter(tx => tx.type === 'MetaMorphoWithdraw')
    .reduce((sum, tx) => sum + tx.data.assetsUsd, 0);
  
  // Calculate ACTUAL yield earned up to this moment
  // Net yield = current balance - (total deposited - total withdrawn)
  const netYield = currentBalance - (totalDeposited - totalWithdrawn);
  const yieldPercentage = totalDeposited > 0 ? (netYield / totalDeposited) * 100 : 0;
  
  // Price per share from user position data (converted to human readable)
  const sharePrice = position.sharePrice || 1000000; // Default to 1.0 in asset decimals format
  const assetDecimals = position.vault.asset.decimals;
  const pricePerShare = sharePrice / Math.pow(10, assetDecimals);
  
  return {
    currentBalance,
    totalDeposited,
    totalWithdrawn,
    netYield, // Use actual earned yield
    yieldPercentage, // Use actual earned yield percentage
    pricePerShare,
  };
}

/**
 * Calculate yield for a user's vault position (legacy function using position data)
 */
export function calculateYield(
  vault: MorphoVault,
  position: UserVaultPosition
): YieldCalculation {
  const currentBalance = parseFloat(position.balance);
  const totalDeposited = parseFloat(position.deposited);
  const totalWithdrawn = parseFloat(position.withdrawn);
  
  // Calculate ACTUAL yield earned up to this moment
  // Net yield = current balance - (total deposited - total withdrawn)
  const netYield = currentBalance - (totalDeposited - totalWithdrawn);
  const yieldPercentage = totalDeposited > 0 ? (netYield / totalDeposited) * 100 : 0;
  
  // Price per share from user position data (converted to human readable)
  const sharePrice = position.sharePrice || 1000000; // Default to 1.0 in asset decimals format
  const assetDecimals = position.vault.asset.decimals;
  const pricePerShare = sharePrice / Math.pow(10, assetDecimals);
  
  return {
    currentBalance,
    totalDeposited,
    totalWithdrawn,
    netYield, // Use actual earned yield
    yieldPercentage, // Use actual earned yield percentage
    pricePerShare,
  };
}

/**
 * Calculate price per share for a vault
 */
export function getPricePerShare(vault: MorphoVault): number {
  // Use the sharePrice directly from the vault object
  const sharePrice = parseFloat(vault.sharePrice || "1000000"); // Default to 1.0 in asset decimals format
  const assetDecimals = vault.asset.decimals;
  return sharePrice / Math.pow(10, assetDecimals);
}

/**
 * Combine vault data with user position and yield calculation
 */
export function combineVaultWithUserData(
  vault: MorphoVault,
  userPosition?: UserVaultPosition,
  transactions?: Transaction[]
): VaultWithYield {
  const vaultWithYield: VaultWithYield = { ...vault };
  
  if (userPosition) {
    vaultWithYield.userPosition = userPosition;
    // Use transaction-based calculation if transactions are available, otherwise fall back to position data
    if (transactions && transactions.length > 0) {
      vaultWithYield.yieldData = calculateYieldFromTransactions(vault, userPosition, transactions);
    } else {
      vaultWithYield.yieldData = calculateYield(vault, userPosition);
    }
  }
  
  return vaultWithYield;
}

/**
 * Calculate total net yield across all vaults
 */
export function calculateTotalNetYield(vaults: VaultWithYield[]): number {
  return vaults.reduce((total, vault) => {
    return total + (vault.yieldData?.netYield || 0);
  }, 0);
}

/**
 * Format currency value for display
 */
export function formatCurrency(
  value: number,
  currency: string = 'USD',
  decimals: number = 2
): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format token amount for display
 */
export function formatTokenAmount(
  value: string | number,
  symbol: string,
  decimals: number = 4,
  assetDecimals: number = 18
): string {
  // Convert to number - this should already be the final balance, not wei
  let numValue: number;
  
  if (typeof value === 'string') {
    numValue = parseFloat(value);
  } else {
    numValue = value;
  }
  
  if (numValue === 0 || isNaN(numValue)) return `0 ${symbol}`;
  
  // For very small amounts, show more decimals
  if (Math.abs(numValue) < 0.001) {
    return `${numValue.toFixed(8)} ${symbol}`;
  }
  
  // For regular amounts
  return `${numValue.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals
  })} ${symbol}`;
}

/**
 * Format percentage for display
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format APY for display
 */
export function formatAPY(baseAPY: number, rewardsAPY: number): string {
  const total = baseAPY + rewardsAPY;
  return formatPercentage(total);
}

/**
 * Truncate address for display
 */
export function truncateAddress(address: string, chars: number = 4): string {
  if (!address) return '';
  if (address.length <= chars * 2 + 2) return address;
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * Combine class names conditionally
 */
export function cn(...classes: (string | undefined | null | boolean)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Check if a value is positive, negative, or zero for styling
 */
export function getValueColorClass(value: number): string {
  if (value > 0) return 'text-green-600';
  if (value < 0) return 'text-red-600';
  return 'text-gray-600';
}

export function calculateRewardAmount(
  userBalance: number,
  rewardAPR: number,
  rewardTokenSymbol: string = 'REWARD'
): string {
  if (rewardAPR <= 0) return '0';
  
  // Calculate annual reward amount based on user's balance and reward APR
  const annualRewardAmount = userBalance * (rewardAPR / 100);
  
  // Format with appropriate decimals based on token
  const decimals = rewardTokenSymbol === 'MORPHO' ? 2 : 4;
  
  return formatTokenAmount(annualRewardAmount, rewardTokenSymbol, decimals);
}

/**
 * Sort vaults by different criteria
 */
export function sortVaults(
  vaults: VaultWithYield[],
  sortBy: 'apy' | 'yield' | 'balance' | 'name'
): VaultWithYield[] {
  return [...vaults].sort((a, b) => {
    switch (sortBy) {
      case 'apy':
        const aAPY = (a.apy?.base || 0) + (a.apy?.rewards || 0);
        const bAPY = (b.apy?.base || 0) + (b.apy?.rewards || 0);
        return bAPY - aAPY;
      
      case 'yield':
        const aYield = a.yieldData?.netYield || 0;
        const bYield = b.yieldData?.netYield || 0;
        return bYield - aYield;
      
      case 'balance':
        const aBalance = a.yieldData?.currentBalance || 0;
        const bBalance = b.yieldData?.currentBalance || 0;
        return bBalance - aBalance;
      
      case 'name':
        return a.name.localeCompare(b.name);
      
      default:
        return 0;
    }
  });
}

/**
 * Debounce function for search and other user inputs
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}
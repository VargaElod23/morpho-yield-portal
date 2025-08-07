interface MorphoRewardsResponse {
  timestamp: string;
  pagination: {
    per_page: number;
    page: number;
    total_pages: number;
    next: string | null;
    prev: string | null;
  };
  data: Array<{
    user: string;
    type: string;
    asset: {
      id: string;
      address: string;
      chain_id: number;
    };
    amount?: {
      total: string;
      claimable_now: string;
      claimable_next: string;
      claimed: string;
    };
    for_supply?: {
      total: string;
      claimable_now: string;
      claimable_next: string;
      claimed: string;
    };
    program?: any;
  }>;
}

interface MorphoDistributionsResponse {
  timestamp: string;
  pagination: {
    per_page: number;
    page: number;
    total_pages: number;
    next: string | null;
    prev: string | null;
  };
  data: Array<{
    user: string;
    asset: {
      id: string;
      address: string;
      chain_id: number;
    };
    distributor: {
      id: string;
      address: string;
      chain_id: number;
    };
    claimable: string;
    proof: string[];
    tx_data: string;
  }>;
}

interface MerklReward {
  root: string;
  recipient: string;
  amount: string;
  claimed: string;
  pending: string;
  proofs: string[];
  token: {
    address: string;
    chainId: number;
    symbol: string;
    decimals: number;
    price: number;
  };
  breakdowns: Array<{
    reason: string;
    amount: string;
    claimed: string;
    pending: string;
    campaignId: string;
    subCampaignId?: string;
  }>;
}

interface CombinedReward {
  symbol: string;
  name: string;
  address: string;
  claimable: number;
  accruing: number;
  claimableValue: number;
  accruingValue: number;
  price: number;
  sources: string[];
}

export async function getClaimableRewardsFromAllSources(
  userAddress: string,
  chainId: number = 1
): Promise<CombinedReward[]> {
  try {
    
    // Fetch from Morpho rewards API
    const morphoRewardsResponse = await fetch(
      `https://rewards.morpho.org/v1/users/${userAddress}/rewards?trusted=true&chain_id=${chainId}&noCache=${Date.now()}`,
      {
        method: 'GET',
        headers: {
          'accept': '*/*',
          'origin': 'https://app.morpho.org',
          'referer': 'https://app.morpho.org/',
        },
      }
    );
    
    // Fetch from Morpho distributions API
    const morphoDistributionsResponse = await fetch(
      `https://rewards.morpho.org/v1/users/${userAddress}/distributions?trusted=true&chain_id=${chainId}&noCache=${Date.now()}`,
      {
        method: 'GET',
        headers: {
          'accept': '*/*',
          'origin': 'https://app.morpho.org',
          'referer': 'https://app.morpho.org/',
        },
      }
    );
    
    // Fetch from Merkl API
    const merklResponse = await fetch(
      `https://api.merkl.xyz/v4/users/${userAddress}/rewards?chainId=${chainId}`,
      {
        method: 'GET',
        headers: {
          'accept': '*/*',
          'content-type': 'application/json',
          'origin': 'https://app.morpho.org',
          'referer': 'https://app.morpho.org/',
        },
      }
    );
    
    // Parse responses
    const morphoRewardsData: MorphoRewardsResponse = morphoRewardsResponse.ok ? await morphoRewardsResponse.json() : { timestamp: '', pagination: { per_page: 0, page: 1, total_pages: 1, next: null, prev: null }, data: [] };
    const morphoDistributionsData: MorphoDistributionsResponse = morphoDistributionsResponse.ok ? await morphoDistributionsResponse.json() : { timestamp: '', pagination: { per_page: 0, page: 1, total_pages: 1, next: null, prev: null }, data: [] };
    const merklData = merklResponse.ok ? await merklResponse.json() : [];
    
    // Process Merkl data (extract rewards from the array structure)
    const merklRewards: MerklReward[] = [];
    if (Array.isArray(merklData)) {
      merklData.forEach((chainData) => {
        if (chainData.rewards && Array.isArray(chainData.rewards)) {
          chainData.rewards.forEach((reward: any) => {
            merklRewards.push(reward as MerklReward);
          });
        }
      });
    }
    
        // Use Merkl as base, then add missing rewards from Morpho APIs
    const combinedRewards = new Map<string, CombinedReward>();
    
    // Process Merkl rewards first (base source)
    merklRewards.forEach(reward => {
      const address = reward.token.address.toLowerCase();
      
      // Calculate from breakdowns
      let totalClaimable = 0;
      let totalAccruing = 0;
      
      if (reward.breakdowns && Array.isArray(reward.breakdowns)) {
        reward.breakdowns.forEach(breakdown => {
          const amount = parseFloat(breakdown.amount);
          const claimed = parseFloat(breakdown.claimed);
          const pending = parseFloat(breakdown.pending);
          
          totalClaimable += (amount - claimed);
          totalAccruing += pending;
        });
      }
      
      const claimable = totalClaimable / Math.pow(10, reward.token.decimals);
      const accruing = totalAccruing / Math.pow(10, reward.token.decimals);
      const claimableValue = claimable * reward.token.price;
      const accruingValue = accruing * reward.token.price;
      
      combinedRewards.set(address, {
        symbol: reward.token.symbol,
        name: reward.token.symbol,
        address: reward.token.address,
        claimable,
        accruing,
        claimableValue,
        accruingValue,
        price: reward.token.price,
        sources: ['merkl'],
      });
    });
    
    // Add Morpho rewards data (may have additional rewards not in Merkl)
    const morphoRewardsByAddress = new Map<string, { claimable: number; accruing: number; symbol: string; decimals: number; price: number }>();
    
    morphoRewardsData.data.forEach(reward => {
      const address = reward.asset.address.toLowerCase();
      const amountData = reward.amount || reward.for_supply;
      
      if (amountData) {
        const claimableRaw = parseFloat(amountData.claimable_now);
        const accruingRaw = parseFloat(amountData.claimable_next);
        
        // Get token info from Merkl data or use defaults
        const tokenInfo = merklRewards.find(r => r.token.address.toLowerCase() === address);
        const symbol = tokenInfo?.token.symbol || 'UNKNOWN';
        const decimals = tokenInfo?.token.decimals || 18;
        const price = tokenInfo?.token.price || 0;
        
        const claimable = claimableRaw / Math.pow(10, decimals);
        const accruing = accruingRaw / Math.pow(10, decimals);
        
        if (morphoRewardsByAddress.has(address)) {
          const existing = morphoRewardsByAddress.get(address)!;
          existing.claimable += claimable;
          existing.accruing += accruing;
        } else {
          morphoRewardsByAddress.set(address, { claimable, accruing, symbol, decimals, price });
        }
      }
    });
    
    // Add Morpho distributions data
    const morphoDistributionsByAddress = new Map<string, { claimable: number; symbol: string; decimals: number; price: number }>();
    
    morphoDistributionsData.data.forEach(distribution => {
      const address = distribution.asset.address.toLowerCase();
      const claimableRaw = parseFloat(distribution.claimable);
      
      // Get token info from Merkl data or use defaults
      const tokenInfo = merklRewards.find(r => r.token.address.toLowerCase() === address);
      const symbol = tokenInfo?.token.symbol || 'UNKNOWN';
      const decimals = tokenInfo?.token.decimals || 18;
      const price = tokenInfo?.token.price || 0;
      
      const claimable = claimableRaw / Math.pow(10, decimals);
      
      if (morphoDistributionsByAddress.has(address)) {
        const existing = morphoDistributionsByAddress.get(address)!;
        existing.claimable += claimable;
      } else {
        morphoDistributionsByAddress.set(address, { claimable, symbol, decimals, price });
      }
    });
    
    // Now combine all sources, using the higher value for each token
    morphoRewardsByAddress.forEach((data, address) => {
      const claimableValue = data.claimable * data.price;
      const accruingValue = data.accruing * data.price;
      
      if (combinedRewards.has(address)) {
        const existing = combinedRewards.get(address)!; 
         if (data.claimable > existing.claimable) {
           existing.claimable = data.claimable;
           existing.claimableValue = claimableValue;
           existing.sources.push('morpho-rewards');
         }
         if (data.accruing > existing.accruing) {
           existing.accruing = data.accruing;
           existing.accruingValue = accruingValue;
         }
      } else {
        combinedRewards.set(address, {
          symbol: data.symbol,
          name: data.symbol,
          address: address,
          claimable: data.claimable,
          accruing: data.accruing,
          claimableValue,
          accruingValue,
          price: data.price,
          sources: ['morpho-rewards'],
        });
      }
    });
    
    morphoDistributionsByAddress.forEach((data, address) => {
      const claimableValue = data.claimable * data.price;
      
      if (combinedRewards.has(address)) {
        const existing = combinedRewards.get(address)!; 
         if (data.claimable > existing.claimable) {
           existing.claimable = data.claimable;
           existing.claimableValue = claimableValue;
           existing.sources.push('morpho-distributions');
         }
      } else {
        combinedRewards.set(address, {
          symbol: data.symbol,
          name: data.symbol,
          address: address,
          claimable: data.claimable,
          accruing: 0,
          claimableValue,
          accruingValue: 0,
          price: data.price,
          sources: ['morpho-distributions'],
        });
      }
    });
    
    const result = Array.from(combinedRewards.values());
    
    return result;
    
  } catch (error) {
    console.error('Error fetching rewards from all sources:', error);
    return [];
  }
} 
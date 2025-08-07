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

interface MerklRewardsResponse {
  id: number;
  name: string;
  icon: string;
  liveCampaigns: number;
  endOfDisputePeriod: number;
  Explorer: Array<{
    id: string;
    type: string;
    url: string;
    chainId: number;
  }>;
  [key: string]: MerklReward | any;
  chainId: number;
}

export async function getClaimableRewardsFromMerkl(
  userAddress: string,
  chainIds: number[] = [1, 8453, 137, 130, 747474, 42161, 10]
): Promise<MerklReward[]> {
  try {
    const chainIdParams = chainIds.map(id => `chainId=${id}`).join('&');
    const url = `https://api.merkl.xyz/v4/users/${userAddress}/rewards?${chainIdParams}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'accept': '*/*',
        'content-type': 'application/json',
        'origin': 'https://app.morpho.org',
        'referer': 'https://app.morpho.org/',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: MerklRewardsResponse = await response.json();
    
    // Process the API response - it's an array of chain objects with rewards
    const rewards: MerklReward[] = [];
    
    if (Array.isArray(data)) {
      data.forEach((chainData) => {
        
        // Check if this chain data has a rewards array
        if (chainData.rewards && Array.isArray(chainData.rewards)) {
          chainData.rewards.forEach((reward: any, index: number) => {
            rewards.push(reward as MerklReward);
          });
        } else {
          // Fallback: try to extract from numbered keys
          Object.entries(chainData).forEach(([key, value]) => {
            if (!isNaN(parseInt(key)) && typeof value === 'object' && value !== null) {
              rewards.push(value as MerklReward);
            }
          });
        }
      });
    }

    return rewards;
  } catch (error) {
    console.error('Error fetching claimable rewards from Merkl:', error);
    return [];
  }
} 
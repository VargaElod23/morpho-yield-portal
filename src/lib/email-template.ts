import type { YieldNotificationData } from './notifications';

export interface ClaimableRewardsData {
  usdc: number;
  morpho: number;
  fxn: number;
  total: number;
}

interface EmailTemplateProps {
  totalBalance: string;
  totalDeposited: string;
  totalEarned: string;
  yieldPercentage: number;
  yield24h: string;
  yield24hPercentage: number;
  vaultBreakdown: Array<{
    name: string;
    balance: string;
    yield: string;
    apy: number;
  }>;
  claimableRewards?: ClaimableRewardsData;
}

export function generateYieldSummaryHTML({
  totalBalance,
  totalDeposited,
  totalEarned,
  yieldPercentage,
  yield24h,
  yield24hPercentage,
  vaultBreakdown,
  claimableRewards,
}: EmailTemplateProps): string {
  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getValueColor = (value: number | string) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (num > 0) return '#10b981'; // green
    if (num < 0) return '#ef4444'; // red
    return '#6b7280'; // gray
  };

  const totalEarnedNum = parseFloat(totalEarned);
  const yield24hNum = parseFloat(yield24h);

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Morpho Daily Yield Summary</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen-Sans, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif;
          background-color: #0f1419;
          color: #ffffff;
        }
        .container {
          margin: 0 auto;
          padding: 20px;
          width: 100%;
          max-width: 600px;
        }
        .header {
          padding: 24px 0;
          text-align: center;
          border-bottom: 1px solid #262626;
          margin-bottom: 32px;
        }
        .header img {
          margin: 0 auto 16px;
          width: 32px;
          height: 32px;
        }
        .header h1 {
          font-size: 24px;
          font-weight: bold;
          color: #ffffff;
          margin: 0;
        }
        .stats-grid {
          width: 100%;
          margin-bottom: 32px;
        }
        .stats-row {
          width: 100%;
          margin-bottom: 16px;
        }
        .stats-row:last-child {
          margin-bottom: 0;
        }
        .stats-row table {
          width: 100%;
          border-collapse: collapse;
        }
        .stats-row td {
          width: 50%;
          vertical-align: top;
        }
        .stats-row td:last-child {
          padding-left: 8px;
        }
        .stats-row td:first-child {
          padding-right: 8px;
        }
        .stat-card {
          background-color: #1a1a1a;
          border: 1px solid #262626;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
        }
        .stat-label {
          font-size: 12px;
          color: #a1a1aa;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin: 0 0 8px 0;
        }
        .stat-value {
          font-size: 18px;
          font-weight: bold;
          color: #ffffff;
          margin: 0;
        }
        .change-section {
          background-color: #1a1a1a;
          border: 1px solid #262626;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
          margin-bottom: 32px;
        }
        .change-label {
          font-size: 14px;
          color: #a1a1aa;
          margin: 0 0 8px 0;
        }
        .change-value {
          font-size: 16px;
          font-weight: bold;
          margin: 0;
        }
        .rewards-section {
          background-color: #1a1a1a;
          border: 1px solid #262626;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 32px;
        }
        .section-title {
          font-size: 18px;
          font-weight: bold;
          color: #ffffff;
          margin: 0 0 16px 0;
        }
        .rewards-total {
          font-size: 20px;
          font-weight: bold;
          color: #10b981;
          text-align: center;
          margin: 0 0 16px 0;
        }
        .rewards-breakdown {
          text-align: center;
        }
        .reward-item {
          font-size: 14px;
          color: #ffffff;
          margin: 4px 8px;
          display: inline-block;
        }
        .vault-section {
          margin-bottom: 32px;
        }
        .vault-row {
          background-color: #1a1a1a;
          border: 1px solid #262626;
          border-radius: 8px;
          padding: 16px 20px;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
        }
        .vault-name {
          flex: 1;
          font-size: 14px;
          color: #ffffff;
          font-weight: 500;
        }
        .vault-data {
          flex: 1;
          text-align: center;
        }
        .vault-balance {
          font-size: 14px;
          color: #ffffff;
          margin: 0 0 4px 0;
        }
        .vault-yield {
          font-size: 12px;
          margin: 0;
          font-weight: 500;
        }
        .vault-apy {
          text-align: right;
          font-size: 12px;
          color: #a1a1aa;
        }
        .footer {
          text-align: center;
          padding-top: 32px;
          border-top: 1px solid #262626;
        }
        .footer-text {
          font-size: 14px;
          color: #a1a1aa;
          margin: 0 0 16px 0;
        }
        .footer a {
          color: #3b82f6;
          text-decoration: underline;
        }
        .disclaimer {
          font-size: 12px;
          color: #6b7280;
          margin: 0;
          line-height: 1.5;
        }
        @media (max-width: 640px) {
          .container {
            width: 100% !important;
            padding: 20px 16px 48px !important;
          }
          .stats-row table {
            width: 100% !important;
          }
          .stats-row td {
            width: 100% !important;
            display: block !important;
            padding: 0 0 16px 0 !important;
          }
          .stats-row td:last-child {
            padding-left: 0 !important;
          }
          .stats-row td:first-child {
            padding-right: 0 !important;
          }
          .vault-row {
            flex-direction: column !important;
            align-items: flex-start !important;
          }
          .vault-data, .vault-apy {
            text-align: left !important;
            margin-top: 8px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <img src="https://morpho-yield-portal.vercel.app/favicon.svg" alt="Morpho" width="32" height="32">
          <h1>Daily Yield Summary</h1>
        </div>

        <!-- Main Stats Grid -->
        <div class="stats-grid">
          <div class="stats-row">
            <table>
              <tr>
                <td>
                  <div class="stat-card">
                    <div class="stat-label">Total Balance</div>
                    <div class="stat-value">${formatCurrency(totalBalance)} USDC</div>
                  </div>
                </td>
                <td>
                  <div class="stat-card">
                    <div class="stat-label">Total Deposited</div>
                    <div class="stat-value">${formatCurrency(totalDeposited)} USDC</div>
                  </div>
                </td>
              </tr>
            </table>
          </div>
          <div class="stats-row">
            <table>
              <tr>
                <td>
                  <div class="stat-card">
                    <div class="stat-label">Total Earned</div>
                    <div class="stat-value" style="color: ${getValueColor(totalEarnedNum)}">
                      ${totalEarnedNum > 0 ? '+' : ''}${formatCurrency(totalEarned)} USDC
                    </div>
                  </div>
                </td>
                <td>
                  <div class="stat-card">
                    <div class="stat-label">Yield %</div>
                    <div class="stat-value" style="color: ${getValueColor(yieldPercentage)}">
                      ${yieldPercentage > 0 ? '+' : ''}${yieldPercentage.toFixed(2)}%
                    </div>
                  </div>
                </td>
              </tr>
            </table>
          </div>
        </div>

        <!-- 24h Change -->
        <div class="change-section">
          <div class="change-label">24h Change</div>
          <div class="change-value" style="color: ${getValueColor(yield24hNum)}">
            ${yield24hNum > 0 ? '+' : ''}${formatCurrency(yield24h)} USDC
            (${yield24hPercentage > 0 ? '+' : ''}${yield24hPercentage.toFixed(2)}%)
          </div>
        </div>

        ${claimableRewards && claimableRewards.total > 0 ? `
        <!-- Claimable Rewards -->
        <div class="rewards-section">
          <div class="section-title">💰 Claimable Rewards</div>
          <div class="rewards-total">${formatCurrency(claimableRewards.total)}</div>
          <div class="rewards-breakdown">
            ${claimableRewards.usdc > 0 ? `<span class="reward-item">🔵 ${claimableRewards.usdc.toFixed(2)} USDC</span>` : ''}
            ${claimableRewards.morpho > 0 ? `<span class="reward-item">🔴 ${claimableRewards.morpho.toFixed(2)} MORPHO</span>` : ''}
            ${claimableRewards.fxn > 0 ? `<span class="reward-item">🟣 ${claimableRewards.fxn.toFixed(4)} FXN</span>` : ''}
          </div>
        </div>
        ` : ''}

        <!-- Vault Breakdown -->
        <div class="vault-section">
          <div class="section-title">📊 Vault Breakdown</div>
          ${vaultBreakdown.slice(0, 5).map(vault => `
            <div class="vault-row">
              <div class="vault-name">${vault.name}</div>
              <div class="vault-data">
                <div class="vault-balance">${formatCurrency(vault.balance)}</div>
                <div class="vault-yield" style="color: ${getValueColor(vault.yield)}">
                  ${parseFloat(vault.yield) > 0 ? '+' : ''}${formatCurrency(vault.yield)}
                </div>
              </div>
              <div class="vault-apy">${vault.apy.toFixed(2)}% APY</div>
            </div>
          `).join('')}
        </div>

        <!-- Footer -->
        <div class="footer">
          <div class="footer-text">
            <a href="https://morpho-yield-portal.vercel.app">View Full Dashboard</a>
            |
            <a href="https://morpho-yield-portal.vercel.app/unsubscribe">Unsubscribe</a>
          </div>
          <div class="disclaimer">
            This is an automated daily summary of your Morpho vault positions. 
            Data is fetched in real-time from Morpho's API.
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}
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

  const getTrendIcon = (value: number) => {
    return value > 0 ? '📈' : value < 0 ? '📉' : '➡️';
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
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #1a202c;
          background-color: #f7fafc;
          padding: 20px 0;
        }
        
        .container {
          max-width: 600px;
          margin: 0 auto;
          background: #ffffff;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        
        /* Header with gradient */
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 32px 24px;
          text-align: center;
          position: relative;
        }
        
        .header::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #10b981, #3b82f6, #8b5cf6);
        }
        
        .logo {
          width: 48px;
          height: 48px;
          margin: 0 auto 16px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
        }
        
        .header-title {
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 8px;
          letter-spacing: -0.5px;
        }
        
        .header-subtitle {
          font-size: 16px;
          opacity: 0.9;
          font-weight: 500;
        }
        
        /* Content area */
        .content {
          padding: 32px 24px;
        }
        
        /* Stats grid */
        .stats-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 32px;
        }
        
        .stat-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 20px;
          text-align: center;
          transition: transform 0.2s ease;
        }
        
        .stat-card:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .stat-label {
          font-size: 12px;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 8px;
        }
        
        .stat-value {
          font-size: 18px;
          font-weight: 700;
          font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
          color: #1a202c;
          line-height: 1.2;
        }
        
        /* 24h Change section */
        .change-section {
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
          border: 1px solid #0ea5e9;
          border-radius: 12px;
          padding: 24px;
          text-align: center;
          margin-bottom: 32px;
          position: relative;
        }
        
        .change-label {
          font-size: 14px;
          font-weight: 600;
          color: #0369a1;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        
        .change-value {
          font-size: 24px;
          font-weight: 700;
          font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        
        /* Rewards section */
        .rewards-section {
          background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
          border: 1px solid #22c55e;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 32px;
        }
        
        .rewards-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }
        
        .rewards-title {
          font-size: 18px;
          font-weight: 700;
          color: #15803d;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .rewards-total {
          font-size: 28px;
          font-weight: 700;
          color: #10b981;
          font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
        }
        
        .reward-items {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 12px;
          margin-bottom: 20px;
        }
        
        .reward-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px;
          background: white;
          border-radius: 8px;
          border: 1px solid #d1fae5;
        }
        
        .reward-token {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
        }
        
        .reward-amount {
          font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
          font-weight: 600;
          color: #059669;
        }
        
        .claim-button {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 600;
          text-decoration: none;
          display: inline-block;
          text-align: center;
          transition: transform 0.2s ease;
        }
        
        .claim-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }
        
        /* Vault section */
        .vault-section {
          background: #fefefe;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 32px;
        }
        
        .vault-title {
          font-size: 18px;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .vault-table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .vault-header {
          background: #f9fafb;
          font-size: 12px;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .vault-header th {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .vault-row {
          border-bottom: 1px solid #f3f4f6;
        }
        
        .vault-row:hover {
          background: #f9fafb;
        }
        
        .vault-row td {
          padding: 16px 12px;
          vertical-align: middle;
        }
        
        .vault-name {
          font-weight: 600;
          color: #1f2937;
          font-size: 14px;
        }
        
        .vault-balance {
          font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
          font-weight: 600;
          color: #374151;
        }
        
        .vault-yield {
          font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
          font-weight: 600;
        }
        
        .apy-badge {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          display: inline-block;
        }
        
        /* Motivational section */
        .motivation {
          text-align: center;
          padding: 24px;
          background: linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%);
          border-radius: 12px;
          margin-bottom: 32px;
        }
        
        .motivation-text {
          font-size: 16px;
          font-weight: 600;
          color: #92400e;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        
        /* Footer */
        .footer {
          background: #f8fafc;
          padding: 32px 24px;
          text-align: center;
          border-top: 1px solid #e2e8f0;
        }
        
        .footer-buttons {
          display: flex;
          gap: 12px;
          justify-content: center;
          margin-bottom: 24px;
        }
        
        .footer-button {
          padding: 12px 24px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 600;
          transition: transform 0.2s ease;
          display: inline-block;
        }
        
        .footer-button:hover {
          transform: translateY(-1px);
        }
        
        .footer-button.primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        
        .footer-button.secondary {
          background: #e5e7eb;
          color: #374151;
        }
        
        .footer-branding {
          font-size: 12px;
          color: #6b7280;
          margin-bottom: 16px;
        }
        
        .social-links {
          display: flex;
          justify-content: center;
          gap: 16px;
        }
        
        .social-link {
          color: #6b7280;
          font-size: 18px;
          text-decoration: none;
        }
        
        /* Mobile responsive */
        @media (max-width: 640px) {
          body {
            padding: 10px;
          }
          
          .container {
            border-radius: 12px;
          }
          
          .header {
            padding: 24px 16px;
          }
          
          .content {
            padding: 24px 16px;
          }
          
          .stats-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }
          
          .reward-items {
            grid-template-columns: 1fr;
          }
          
          .footer-buttons {
            flex-direction: column;
          }
          
          .vault-table {
            font-size: 12px;
          }
          
          .vault-table th,
          .vault-table td {
            padding: 8px 6px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <div class="logo">🏛️</div>
          <div class="header-title">Daily Yield Summary</div>
          <div class="header-subtitle">Your capital is working. Stay compounding 🚀</div>
        </div>

        <div class="content">
          <!-- Stats Grid -->
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-label">Total Balance</div>
              <div class="stat-value">${formatCurrency(totalBalance)}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Total Deposited</div>
              <div class="stat-value">${formatCurrency(totalDeposited)}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Total Earned</div>
              <div class="stat-value" style="color: ${getValueColor(totalEarnedNum)}">
                ${totalEarnedNum > 0 ? '+' : ''}${formatCurrency(totalEarned)}
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Yield %</div>
              <div class="stat-value" style="color: ${getValueColor(yieldPercentage)}">
                ${yieldPercentage > 0 ? '+' : ''}${yieldPercentage.toFixed(2)}%
              </div>
            </div>
          </div>

          <!-- 24h Change -->
          <div class="change-section">
            <div class="change-label">
              📊 24h Performance
            </div>
            <div class="change-value" style="color: ${getValueColor(yield24hNum)}">
              ${getTrendIcon(yield24hNum)} ${yield24hNum > 0 ? '+' : ''}${formatCurrency(yield24h)}
              (${yield24hPercentage > 0 ? '+' : ''}${yield24hPercentage.toFixed(2)}%)
            </div>
          </div>

          ${claimableRewards && claimableRewards.total > 0 ? `
          <!-- Claimable Rewards -->
          <div class="rewards-section">
            <div class="rewards-header">
              <div class="rewards-title">
                💰 Claimable Rewards
              </div>
              <div class="rewards-total">${formatCurrency(claimableRewards.total)}</div>
            </div>
            
            <div class="reward-items">
              ${claimableRewards.usdc > 0 ? `
                <div class="reward-item">
                  <div class="reward-token">
                    <span style="color: #3b82f6;">●</span> USDC
                  </div>
                  <div class="reward-amount">${claimableRewards.usdc.toFixed(2)}</div>
                </div>
              ` : ''}
              ${claimableRewards.morpho > 0 ? `
                <div class="reward-item">
                  <div class="reward-token">
                    <span style="color: #8b5cf6;">●</span> MORPHO
                  </div>
                  <div class="reward-amount">${claimableRewards.morpho.toFixed(2)}</div>
                </div>
              ` : ''}
              ${claimableRewards.fxn > 0 ? `
                <div class="reward-item">
                  <div class="reward-token">
                    <span style="color: #f59e0b;">●</span> FXN
                  </div>
                  <div class="reward-amount">${claimableRewards.fxn.toFixed(4)}</div>
                </div>
              ` : ''}
            </div>
            
            <a href="https://morpho-yield-portal.vercel.app" class="claim-button">
              Claim Rewards
            </a>
          </div>
          ` : ''}

          <!-- Vault Breakdown -->
          <div class="vault-section">
            <div class="vault-title">
              📊 Vault Breakdown
            </div>
            
            <table class="vault-table">
              <thead>
                <tr class="vault-header">
                  <th>Vault</th>
                  <th>Balance</th>
                  <th>Yield</th>
                  <th>APY</th>
                </tr>
              </thead>
              <tbody>
                ${vaultBreakdown.slice(0, 5).map(vault => `
                  <tr class="vault-row">
                    <td class="vault-name">${vault.name}</td>
                    <td class="vault-balance">${formatCurrency(vault.balance)}</td>
                    <td class="vault-yield" style="color: ${getValueColor(vault.yield)}">
                      ${parseFloat(vault.yield) > 0 ? '+' : ''}${formatCurrency(vault.yield)}
                    </td>
                    <td>
                      <span class="apy-badge">${vault.apy.toFixed(2)}%</span>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <!-- Motivation -->
          <div class="motivation">
            <div class="motivation-text">
              Your capital is working. Stay compounding 🚀
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="footer">
          <div class="footer-buttons">
            <a href="https://morpho-yield-portal.vercel.app" class="footer-button primary">
              View Full Dashboard
            </a>
            <a href="https://morpho-yield-portal.vercel.app/unsubscribe" class="footer-button secondary">
              Unsubscribe
            </a>
          </div>
          
          <div class="footer-branding">
            Powered by Morpho Protocol
          </div>
          
          <div class="social-links">
            <a href="https://twitter.com/morpho_xyz" class="social-link">𝕏</a>
            <a href="https://discord.gg/morpho" class="social-link">💬</a>
            <a href="https://github.com/morpho-org" class="social-link">⚡</a>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}
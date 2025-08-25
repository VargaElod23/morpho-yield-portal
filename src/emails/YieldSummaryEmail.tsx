import {
  Body,
  Container,
  Column,
  Head,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
  Hr,
} from '@react-email/components';
import * as React from 'react';

interface YieldSummaryEmailProps {
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
  claimableRewards?: {
    usdc: number;
    morpho: number;
    fxn: number;
    total: number;
  };
}

export const YieldSummaryEmail = ({
  totalBalance,
  totalDeposited,
  totalEarned,
  yieldPercentage,
  yield24h,
  yield24hPercentage,
  vaultBreakdown,
  claimableRewards,
}: YieldSummaryEmailProps) => {
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

  return (
    <Html>
      <Head />
      <Preview>Your Morpho Daily Yield Summary</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Img
              src="https://morpho-yield-portal.vercel.app/favicon.svg"
              width="32"
              height="32"
              alt="Morpho"
              style={logo}
            />
            <Text style={headerText}>Daily Yield Summary</Text>
          </Section>

          {/* Main Stats Grid */}
          <Section style={statsSection}>
            <Row>
              <Column style={statCard}>
                <Text style={statLabel}>TOTAL BALANCE</Text>
                <Text style={statValue}>{formatCurrency(totalBalance)} USDC</Text>
              </Column>
              <Column style={statCard}>
                <Text style={statLabel}>TOTAL DEPOSITED</Text>
                <Text style={statValue}>{formatCurrency(totalDeposited)} USDC</Text>
              </Column>
            </Row>
            
            <Row>
              <Column style={statCard}>
                <Text style={statLabel}>TOTAL EARNED</Text>
                <Text style={{...statValue, color: getValueColor(totalEarned)}}>
                  {parseFloat(totalEarned) > 0 ? '+' : ''}{formatCurrency(totalEarned)} USDC
                </Text>
              </Column>
              <Column style={statCard}>
                <Text style={statLabel}>YIELD %</Text>
                <Text style={{...statValue, color: getValueColor(yieldPercentage)}}>
                  {yieldPercentage > 0 ? '+' : ''}{yieldPercentage.toFixed(2)}%
                </Text>
              </Column>
            </Row>
          </Section>

          {/* 24h Change */}
          <Section style={changeSection}>
            <Text style={changeLabel}>24h Change</Text>
            <Text style={{...changeValue, color: getValueColor(yield24h)}}>
              {parseFloat(yield24h) > 0 ? '+' : ''}{formatCurrency(yield24h)} USDC
              ({yield24hPercentage > 0 ? '+' : ''}{yield24hPercentage.toFixed(2)}%)
            </Text>
          </Section>

          {/* Claimable Rewards */}
          {claimableRewards && claimableRewards.total > 0 && (
            <Section style={rewardsSection}>
              <Text style={sectionTitle}>💰 Claimable Rewards</Text>
              <Text style={rewardsTotal}>{formatCurrency(claimableRewards.total)}</Text>
              
              <Row style={rewardsBreakdown}>
                {claimableRewards.usdc > 0 && (
                  <Column>
                    <Text style={rewardItem}>
                      🔵 {claimableRewards.usdc.toFixed(2)} USDC
                    </Text>
                  </Column>
                )}
                {claimableRewards.morpho > 0 && (
                  <Column>
                    <Text style={rewardItem}>
                      🔴 {claimableRewards.morpho.toFixed(2)} MORPHO
                    </Text>
                  </Column>
                )}
                {claimableRewards.fxn > 0 && (
                  <Column>
                    <Text style={rewardItem}>
                      🟣 {claimableRewards.fxn.toFixed(4)} FXN
                    </Text>
                  </Column>
                )}
              </Row>
            </Section>
          )}

          {/* Vault Breakdown */}
          <Section style={vaultSection}>
            <Text style={sectionTitle}>📊 Vault Breakdown</Text>
            
            {vaultBreakdown.slice(0, 5).map((vault, index) => (
              <Row key={index} style={vaultRow}>
                <Column style={vaultName}>
                  <Text style={vaultNameText}>{vault.name}</Text>
                </Column>
                <Column style={vaultData}>
                  <Text style={vaultBalance}>{formatCurrency(vault.balance)}</Text>
                  <Text style={{...vaultYield, color: getValueColor(vault.yield)}}>
                    {parseFloat(vault.yield) > 0 ? '+' : ''}{formatCurrency(vault.yield)}
                  </Text>
                </Column>
                <Column style={vaultApy}>
                  <Text style={apyText}>{vault.apy.toFixed(2)}% APY</Text>
                </Column>
              </Row>
            ))}
          </Section>

          <Hr style={hr} />

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              <Link href="https://morpho-yield-portal.vercel.app" style={link}>
                View Full Dashboard
              </Link>
              {" | "}
              <Link href="https://morpho-yield-portal.vercel.app/unsubscribe" style={link}>
                Unsubscribe
              </Link>
            </Text>
            <Text style={disclaimerText}>
              This is an automated daily summary of your Morpho vault positions. 
              Data is fetched in real-time from Morpho&apos;s API.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

// Styles
const main = {
  backgroundColor: '#0f1419',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  width: '600px',
  maxWidth: '100%',
};

const header = {
  padding: '24px 0',
  textAlign: 'center' as const,
  borderBottom: '1px solid #262626',
  marginBottom: '32px',
};

const logo = {
  margin: '0 auto 16px',
};

const headerText = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#ffffff',
  margin: '0',
};

const statsSection = {
  marginBottom: '32px',
};

const statCard = {
  backgroundColor: '#1a1a1a',
  border: '1px solid #262626',
  borderRadius: '8px',
  padding: '20px',
  margin: '8px',
  textAlign: 'center' as const,
};

const statLabel = {
  fontSize: '12px',
  color: '#a1a1aa',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  margin: '0 0 8px 0',
};

const statValue = {
  fontSize: '20px',
  fontWeight: 'bold',
  color: '#ffffff',
  margin: '0',
};

const changeSection = {
  backgroundColor: '#1a1a1a',
  border: '1px solid #262626',
  borderRadius: '8px',
  padding: '20px',
  textAlign: 'center' as const,
  marginBottom: '32px',
};

const changeLabel = {
  fontSize: '14px',
  color: '#a1a1aa',
  margin: '0 0 8px 0',
};

const changeValue = {
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0',
};

const rewardsSection = {
  backgroundColor: '#1a1a1a',
  border: '1px solid #262626',
  borderRadius: '8px',
  padding: '20px',
  marginBottom: '32px',
};

const sectionTitle = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#ffffff',
  margin: '0 0 16px 0',
};

const rewardsTotal = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#10b981',
  textAlign: 'center' as const,
  margin: '0 0 16px 0',
};

const rewardsBreakdown = {
  textAlign: 'center' as const,
};

const rewardItem = {
  fontSize: '14px',
  color: '#ffffff',
  margin: '4px 8px',
};

const vaultSection = {
  marginBottom: '32px',
};

const vaultRow = {
  backgroundColor: '#1a1a1a',
  border: '1px solid #262626',
  borderRadius: '8px',
  padding: '16px 20px',
  marginBottom: '8px',
  alignItems: 'center',
};

const vaultName = {
  width: '40%',
};

const vaultNameText = {
  fontSize: '14px',
  color: '#ffffff',
  margin: '0',
  fontWeight: '500',
};

const vaultData = {
  width: '40%',
  textAlign: 'center' as const,
};

const vaultBalance = {
  fontSize: '14px',
  color: '#ffffff',
  margin: '0 0 4px 0',
};

const vaultYield = {
  fontSize: '12px',
  margin: '0',
  fontWeight: '500',
};

const vaultApy = {
  width: '20%',
  textAlign: 'right' as const,
};

const apyText = {
  fontSize: '12px',
  color: '#a1a1aa',
  margin: '0',
};

const hr = {
  borderColor: '#262626',
  margin: '32px 0',
};

const footer = {
  textAlign: 'center' as const,
};

const footerText = {
  fontSize: '14px',
  color: '#a1a1aa',
  margin: '0 0 16px 0',
};

const link = {
  color: '#3b82f6',
  textDecoration: 'underline',
};

const disclaimerText = {
  fontSize: '12px',
  color: '#6b7280',
  margin: '0',
  lineHeight: '1.5',
};

export default YieldSummaryEmail;
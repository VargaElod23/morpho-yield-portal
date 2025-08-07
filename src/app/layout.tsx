import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Morpho Yield Monitor',
  description: 'Track your Morpho vault yields across multiple chains',
  keywords: ['DeFi', 'Morpho', 'Yield', 'Ethereum', 'Multi-chain', 'Vault'],
  authors: [{ name: 'Morpho Yield Monitor' }],
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', type: 'image/x-icon' }
    ],
    shortcut: '/favicon.ico',
    apple: '/favicon.svg',
  },
  openGraph: {
    title: 'Morpho Yield Monitor',
    description: 'Track your Morpho vault yields across multiple chains',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Morpho Yield Monitor',
    description: 'Track your Morpho vault yields across multiple chains',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0ea5e9',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
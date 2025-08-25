'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { 
  EnvelopeIcon, 
  CheckCircleIcon, 
  XCircleIcon 
} from '@heroicons/react/24/outline';

interface EmailSubscriptionManagerProps {
  onOpenModal?: () => void;
}

export function EmailSubscriptionManager({ onOpenModal }: EmailSubscriptionManagerProps = {}) {
  const { address, isConnected } = useAccount();
  const [email, setEmail] = useState('');
  const [subscribedEmails, setSubscribedEmails] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Fetch subscribed emails on mount and address change
  useEffect(() => {
    if (isConnected && address) {
      fetchSubscribedEmails();
    } else {
      setSubscribedEmails([]);
    }
  }, [address, isConnected]);

  const fetchSubscribedEmails = async () => {
    if (!address) return;
    
    try {
      const response = await fetch(`/api/notifications/email/subscriptions?address=${address}`);
      if (response.ok) {
        const data = await response.json();
        setSubscribedEmails(data.emails || []);
      }
    } catch (error) {
      console.error('Failed to fetch subscribed emails:', error);
    }
  };

  const handleSubscribe = async () => {
    if (!isConnected || !address) {
      setMessage({ type: 'error', text: 'Please connect your wallet first' });
      return;
    }

    if (!email || !validateEmail(email)) {
      setMessage({ type: 'error', text: 'Please enter a valid email address' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/notifications/email/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, email })
      });

      const result = await response.json();

      if (response.ok) {
        setSubscribedEmails(prev => [...prev, email]);
        setEmail('');
        setMessage({ 
          type: 'success', 
          text: `Successfully subscribed! Welcome email sent to ${email}` 
        });
      } else {
        setMessage({ 
          type: 'error', 
          text: result.message || 'Failed to subscribe' 
        });
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: 'Network error. Please try again.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnsubscribe = async (emailToUnsubscribe: string) => {
    if (!isConnected || !address || !emailToUnsubscribe) return;

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/notifications/email/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, email: emailToUnsubscribe })
      });

      const result = await response.json();

      if (response.ok) {
        setSubscribedEmails(prev => prev.filter(e => e !== emailToUnsubscribe));
        setMessage({ 
          type: 'success', 
          text: `Successfully unsubscribed ${emailToUnsubscribe}` 
        });
      } else {
        setMessage({ 
          type: 'error', 
          text: result.message || 'Failed to unsubscribe' 
        });
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: 'Network error. Please try again.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestEmail = async () => {
    if (!email || !validateEmail(email)) {
      setMessage({ type: 'error', text: 'Please enter a valid email address' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/notifications/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const result = await response.json();

      if (response.ok) {
        setMessage({ 
          type: 'success', 
          text: `Test email sent to ${email}!` 
        });
      } else {
        setMessage({ 
          type: 'error', 
          text: result.message || 'Failed to send test email' 
        });
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: 'Network error. Please try again.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isConnected) {
    return null;
  }

  return (
    <div className="bg-morpho-surface border border-morpho-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <EnvelopeIcon className="w-5 h-5 text-morpho-accent" />
          <h3 className="text-lg font-semibold text-morpho-text">Email Notifications</h3>
        </div>
        {onOpenModal && (
          <button
            onClick={onOpenModal}
            className="px-3 py-1 text-xs bg-morpho-accent hover:bg-morpho-accent/80 text-white rounded font-medium transition-colors"
          >
            Quick Setup
          </button>
        )}
      </div>

      <p className="text-morpho-text-secondary text-sm mb-6">
        Get detailed daily yield summaries with beautiful dashboard visuals sent directly to your email.
      </p>

      {/* Subscribed emails list */}
      {subscribedEmails.length > 0 && (
        <div className="space-y-3 mb-6">
          <h4 className="text-sm font-medium text-morpho-text">Subscribed Email Addresses:</h4>
          {subscribedEmails.map((subscribedEmail) => (
            <div key={subscribedEmail} className="flex items-center justify-between p-3 bg-morpho-surface-hover rounded-md border border-morpho-border">
              <div className="flex items-center space-x-2">
                <CheckCircleIcon className="w-4 h-4 text-morpho-success" />
                <span className="text-sm text-morpho-text">{subscribedEmail}</span>
              </div>
              <button
                onClick={() => handleUnsubscribe(subscribedEmail)}
                disabled={isLoading}
                className="px-3 py-1 text-xs bg-morpho-error hover:bg-morpho-error/80 text-white rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add new email subscription */}
      <div className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-morpho-text mb-2">
            {subscribedEmails.length > 0 ? 'Add Another Email Address' : 'Email Address'}
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full px-3 py-2 bg-morpho-bg border border-morpho-border rounded-md text-morpho-text placeholder-morpho-text-secondary focus:outline-none focus:ring-2 focus:ring-morpho-accent focus:border-morpho-accent"
          />
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={handleSubscribe}
            disabled={isLoading || !email}
            className="flex-1 bg-morpho-accent hover:bg-morpho-accent/80 text-white px-4 py-2 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Subscribing...' : 'Subscribe to Emails'}
          </button>
          
          <button
            onClick={handleTestEmail}
            disabled={isLoading || !email}
            className="px-4 py-2 bg-morpho-surface-hover hover:bg-morpho-surface text-morpho-text border border-morpho-border rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Test Email
          </button>
        </div>
      </div>

      {message && (
        <div className={`mt-4 p-3 rounded-md flex items-center space-x-2 ${
          message.type === 'success' 
            ? 'bg-morpho-success/20 border border-morpho-success/30' 
            : 'bg-morpho-error/20 border border-morpho-error/30'
        }`}>
          {message.type === 'success' ? (
            <CheckCircleIcon className="w-5 h-5 text-morpho-success flex-shrink-0" />
          ) : (
            <XCircleIcon className="w-5 h-5 text-morpho-error flex-shrink-0" />
          )}
          <span className={`text-sm ${
            message.type === 'success' ? 'text-morpho-success' : 'text-morpho-error'
          }`}>
            {message.text}
          </span>
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-morpho-border">
        <h4 className="text-sm font-medium text-morpho-text mb-2">What you&apos;ll receive:</h4>
        <ul className="text-xs text-morpho-text-secondary space-y-1">
          <li>• Daily yield summary with total earnings and 24h changes</li>
          <li>• Beautiful dashboard-style layout matching your app experience</li>
          <li>• Vault breakdown showing individual position performance</li>
          <li>• Claimable rewards information when available</li>
          <li>• One-click links to view your full dashboard</li>
        </ul>
      </div>
    </div>
  );
}
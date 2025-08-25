'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { BellIcon, BellSlashIcon } from '@heroicons/react/24/outline';

export function NotificationManager() {
  const { address, isConnected } = useAccount();
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isBrave, setIsBrave] = useState(false);

  useEffect(() => {
    // Check if notifications are supported
    if ('Notification' in window && 'serviceWorker' in navigator) {
      setIsSupported(true);
      setPermission(Notification.permission);
      
      // Check if Brave browser
      setIsBrave((navigator as any).brave !== undefined);
      
      // Check if already subscribed
      checkSubscription();
    }
  }, []);

  const checkSubscription = async () => {
    if (!('serviceWorker' in navigator)) return;
    
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  const requestPermission = async () => {
    if (!isSupported || !isConnected) return;
    
    setIsLoading(true);
    
    try {
      // Request notification permission
      const permission = await Notification.requestPermission();
      setPermission(permission);
      
      if (permission === 'granted') {
        await subscribeToNotifications();
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const subscribeToNotifications = async () => {
    if (!('serviceWorker' in navigator) || !isConnected || !address) return;
    
    try {
      // Check for VAPID key
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        throw new Error('VAPID public key not configured. Please add NEXT_PUBLIC_VAPID_PUBLIC_KEY to your environment variables.');
      }

      // Register service worker
      await navigator.serviceWorker.register('/sw.js');
      const registration = await navigator.serviceWorker.ready;
      
      // Check push manager availability
      if (!registration.pushManager) {
        throw new Error('Push manager not available. This browser may not support push notifications.');
      }
      
      const applicationServerKey = urlBase64ToUint8Array(vapidKey);
      
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as BufferSource
      });
      
      console.log('Push subscription successful:', {
        endpoint: subscription.endpoint,
        keys: Object.keys(subscription.toJSON().keys || {})
      });
      
      // Save subscription to backend
      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          address, 
          subscription,
          chainIds: [1, 137, 42161, 8453] // Default chains
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to save subscription');
      }
      
      // Also save to localStorage for quick checks
      localStorage.setItem('notification-subscription', JSON.stringify({
        subscription,
        address,
        timestamp: Date.now()
      }));
      
      setIsSubscribed(true);
      
    } catch (error) {
      console.error('Error subscribing to notifications:', error);
      
      let errorMessage = 'Failed to subscribe to notifications';
      if (error instanceof Error) {
        if (error.message.includes('VAPID')) {
          errorMessage = 'Push notifications not configured. Please set up VAPID keys.';
        } else if (error.name === 'AbortError') {
          const isBrave = (navigator as any).brave !== undefined;
          if (isBrave) {
            errorMessage = 'Brave browser blocks push notifications by default. Please:\n1. Go to brave://settings/privacy\n2. Find "Use Google services for push messaging"\n3. Enable this setting\n4. Or use Chrome/Edge for notifications';
          } else {
            errorMessage = 'Push service error. This might be due to missing VAPID keys or network issues.';
          }
        } else if (error.name === 'NotSupportedError') {
          errorMessage = 'Push notifications not supported in this browser.';
        } else if (error.name === 'NotAllowedError') {
          errorMessage = 'Push notifications permission denied.';
        }
      }
      
      // You could show this error to the user in a toast/alert
      console.warn('Notification subscription failed:', errorMessage);
    }
  };

  const unsubscribe = async () => {
    if (!('serviceWorker' in navigator)) return;
    
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        
        // Remove from backend
        if (address) {
          await fetch('/api/notifications/unsubscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address })
          });
        }
        
        localStorage.removeItem('notification-subscription');
        setIsSubscribed(false);
      }
    } catch (error) {
      console.error('Error unsubscribing:', error);
    }
  };

  if (!isSupported || !isConnected) {
    return null;
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center">
        {permission === 'granted' && !isBrave ? (
        <button
          onClick={isSubscribed ? unsubscribe : subscribeToNotifications}
          disabled={isLoading}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            isSubscribed
              ? 'bg-green-900/20 text-green-400 hover:bg-green-900/30'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          } disabled:opacity-50`}
        >
          {isSubscribed ? (
            <>
              <BellIcon className="h-4 w-4" />
              Notifications On
            </>
          ) : (
            <>
              <BellSlashIcon className="h-4 w-4" />
              Subscribe
            </>
          )}
        </button>
      ) : (
        <button
          onClick={isBrave ? undefined : requestPermission}
          disabled={isLoading || isBrave}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            isBrave 
              ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
              : 'bg-blue-900/20 text-blue-400 hover:bg-blue-900/30'
          } disabled:opacity-50`}
        >
          <BellSlashIcon className="h-4 w-4" />
          {isBrave ? 'Not Available in Brave' : 'Enable Notifications'}
        </button>
      )}
      </div>
    </div>
  );
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = globalThis.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';

const MODAL_DELAY = 2000; // 2 seconds delay after connection

export function useEmailSubscriptionModal() {
  const { address, isConnected } = useAccount();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasShownModalThisSession, setHasShownModalThisSession] = useState(false);

  // Show modal when wallet is connected (once per session)
  useEffect(() => {
    if (isConnected && address && !hasShownModalThisSession) {
      // Show modal after a delay when wallet is connected
      const timer = setTimeout(async () => {
        try {
          // Check if user already has email subscriptions
          const response = await fetch(`/api/notifications/email/subscriptions?address=${address}`);
          
          if (response.ok) {
            const data = await response.json();
            const hasSubscriptions = data.emails && data.emails.length > 0;
            
            // Don't show modal if user already has subscriptions
            if (hasSubscriptions) {
              setHasShownModalThisSession(true);
              return;
            }
          }
        } catch (error) {
          console.error('Error checking existing subscriptions:', error);
          // Continue to show modal even if API call fails
        }

        // Show modal for users without subscriptions
        setIsModalOpen(true);
        setHasShownModalThisSession(true);
      }, MODAL_DELAY);

      return () => clearTimeout(timer);
    }
  }, [isConnected, address, hasShownModalThisSession]);

  // Reset state when wallet disconnects
  useEffect(() => {
    if (!isConnected) {
      setHasShownModalThisSession(false);
      setIsModalOpen(false);
    }
  }, [isConnected]);

  // Handle closing modal
  const closeModal = () => {
    setIsModalOpen(false);
  };

  // Force show modal (for testing or manual trigger)
  const openModal = () => {
    setIsModalOpen(true);
  };

  return {
    isModalOpen,
    openModal,
    closeModal,
  };
}
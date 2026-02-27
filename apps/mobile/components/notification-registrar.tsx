import { useEffect, useRef } from 'react';
import { useWallet } from '@/hooks/use-wallet';
import { useNotifications } from '@/hooks/use-notifications';

/**
 * Component that automatically registers wallet addresses for push notifications.
 * Place this inside both WalletProvider and NotificationProvider.
 *
 * It watches for:
 * - Wallet creation (registers all account addresses)
 * - Account additions (registers new account address)
 * - Notification enable/disable (registers/unregisters all addresses)
 */
export function NotificationRegistrar() {
  const { accounts, hasWallet } = useWallet();
  const { isEnabled, registerAddresses, addNewAddress, isLoading } = useNotifications();

  // Track previous state to detect changes
  const prevAccountCountRef = useRef<number>(0);
  const hasRegisteredRef = useRef<boolean>(false);

  // Register all addresses when notifications are enabled and wallet exists
  useEffect(() => {
    if (isLoading) return;

    // Only register once per enable cycle
    if (isEnabled && hasWallet && accounts.length > 0 && !hasRegisteredRef.current) {
      const addresses = accounts.map((account) => account.address);
      console.log('Registering addresses for notifications:', addresses.length);
      registerAddresses(addresses);
      hasRegisteredRef.current = true;
      prevAccountCountRef.current = accounts.length;
    }

    // Reset registration flag when disabled
    if (!isEnabled) {
      hasRegisteredRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEnabled, hasWallet, accounts.length, isLoading, registerAddresses]);

  // Register new accounts when they're added
  useEffect(() => {
    if (isLoading || !isEnabled || !hasWallet) return;

    const currentCount = accounts.length;
    const prevCount = prevAccountCountRef.current;

    // If account count increased, register the new account(s)
    if (currentCount > prevCount && prevCount > 0) {
      const newAccounts = accounts.slice(prevCount);
      for (const account of newAccounts) {
        console.log('Registering new account for notifications:', account.address);
        addNewAddress(account.address);
      }
    }

    prevAccountCountRef.current = currentCount;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accounts.length, isEnabled, hasWallet, isLoading, addNewAddress]);

  // This component doesn't render anything
  return null;
}

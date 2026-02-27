import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { deriveWalletFromMnemonic } from '@/services/blockchain';
import { Account } from '@/types/blockchain';
import {
  encryptMnemonic,
  decryptMnemonic,
  encryptPrivateKey,
  decryptPrivateKey,
  deleteEncryptionSalt,
  getEncryptionSalt,
  setEncryptionSalt,
  generateSalt,
  deriveKeyFromPin,
  encryptData,
  decryptData,
} from '@/services/crypto/wallet-encryption';

const WALLET_KEY = '@pouch/has_wallet';
const ACCOUNTS_KEY = '@pouch/accounts';
const SELECTED_ACCOUNT_KEY = '@pouch/selected_account';

// Encrypted storage keys
const ENCRYPTED_MNEMONIC_KEY = 'pouch_wallet_mnemonic_enc';
const ENCRYPTED_PK_PREFIX = 'pouch_pk_enc_';

interface WalletContextType {
  hasWallet: boolean | null;
  isLoading: boolean;
  accounts: Account[];
  selectedAccount: Account | null;
  walletAddress: string | null;
  createWallet: (mnemonic: string[], pin: string) => Promise<void>;
  importWallet: (mnemonic: string[], pin: string) => Promise<void>;
  resetWallet: () => Promise<void>;
  getPrivateKey: (pin: string) => Promise<string | null>;
  getMnemonic: (pin: string) => Promise<string | null>;
  addAccount: (pin: string) => Promise<Account>;
  selectAccount: (index: number) => Promise<void>;
  renameAccount: (index: number, name: string) => Promise<void>;
  reEncryptAllWalletData: (oldPin: string, newPin: string) => Promise<boolean>;
}

const WalletContext = createContext<WalletContextType | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [hasWallet, setHasWallet] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountIndex, setSelectedAccountIndex] = useState(0);

  const selectedAccount = accounts[selectedAccountIndex] ?? null;
  const walletAddress = selectedAccount?.address ?? null;

  useEffect(() => {
    checkWalletStatus();
  }, []);

  const checkWalletStatus = async () => {
    try {
      const value = await AsyncStorage.getItem(WALLET_KEY);
      const hasExistingWallet = value === 'true';
      setHasWallet(hasExistingWallet);

      if (hasExistingWallet) {
        // Load accounts
        const accountsJson = await AsyncStorage.getItem(ACCOUNTS_KEY);
        if (accountsJson) {
          const loadedAccounts = JSON.parse(accountsJson) as Account[];
          setAccounts(loadedAccounts);
        }

        // Load selected account index
        const selectedIndex = await AsyncStorage.getItem(SELECTED_ACCOUNT_KEY);
        if (selectedIndex) {
          setSelectedAccountIndex(parseInt(selectedIndex, 10));
        }
      }
    } catch (error) {
      console.warn('Error reading wallet status:', error);
      setHasWallet(false);
    } finally {
      setIsLoading(false);
    }
  };

  const saveAccounts = async (newAccounts: Account[]) => {
    await AsyncStorage.setItem(ACCOUNTS_KEY, JSON.stringify(newAccounts));
    setAccounts(newAccounts);
  };

  const createWallet = useCallback(async (mnemonic: string[], pin: string) => {
    try {
      const phrase = mnemonic.join(' ');
      const derivedWallet = deriveWalletFromMnemonic(phrase, 0);

      // Encrypt and store mnemonic
      const encryptedMnemonic = await encryptMnemonic(phrase, pin);
      await SecureStore.setItemAsync(ENCRYPTED_MNEMONIC_KEY, encryptedMnemonic);

      // Encrypt and store private key for account 0
      const encryptedPk = await encryptPrivateKey(derivedWallet.privateKey, pin);
      await SecureStore.setItemAsync(`${ENCRYPTED_PK_PREFIX}0`, encryptedPk);

      // Create first account
      const firstAccount: Account = {
        index: 0,
        name: 'Account 1',
        address: derivedWallet.address,
        path: derivedWallet.path,
      };

      await saveAccounts([firstAccount]);
      await AsyncStorage.setItem(SELECTED_ACCOUNT_KEY, '0');
      await AsyncStorage.setItem(WALLET_KEY, 'true');

      setSelectedAccountIndex(0);
      setHasWallet(true);
    } catch (error) {
      console.warn('Error creating wallet:', error);
      throw error;
    }
  }, []);

  const importWallet = useCallback(async (mnemonic: string[], pin: string) => {
    await createWallet(mnemonic, pin);
  }, [createWallet]);

  const resetWallet = useCallback(async () => {
    try {
      // Delete all encrypted private keys
      for (const account of accounts) {
        await SecureStore.deleteItemAsync(`${ENCRYPTED_PK_PREFIX}${account.index}`);
      }

      // Delete encrypted mnemonic
      await SecureStore.deleteItemAsync(ENCRYPTED_MNEMONIC_KEY);

      // Delete encryption salt
      await deleteEncryptionSalt();

      // Clear AsyncStorage
      await AsyncStorage.removeItem(WALLET_KEY);
      await AsyncStorage.removeItem(ACCOUNTS_KEY);
      await AsyncStorage.removeItem(SELECTED_ACCOUNT_KEY);

      setHasWallet(false);
      setAccounts([]);
      setSelectedAccountIndex(0);
    } catch (error) {
      console.warn('Error resetting wallet:', error);
    }
  }, [accounts]);

  const getPrivateKey = useCallback(async (pin: string): Promise<string | null> => {
    try {
      const encryptedPk = await SecureStore.getItemAsync(`${ENCRYPTED_PK_PREFIX}${selectedAccountIndex}`);
      if (!encryptedPk) return null;

      return await decryptPrivateKey(encryptedPk, pin);
    } catch (error) {
      console.warn('Error getting private key:', error);
      return null;
    }
  }, [selectedAccountIndex]);

  const getMnemonic = useCallback(async (pin: string): Promise<string | null> => {
    try {
      const encryptedMnemonic = await SecureStore.getItemAsync(ENCRYPTED_MNEMONIC_KEY);
      if (!encryptedMnemonic) return null;

      return await decryptMnemonic(encryptedMnemonic, pin);
    } catch (error) {
      console.warn('Error getting mnemonic:', error);
      return null;
    }
  }, []);

  const addAccount = useCallback(async (pin: string): Promise<Account> => {
    try {
      const mnemonic = await getMnemonic(pin);
      if (!mnemonic) {
        throw new Error('Invalid PIN or mnemonic not found');
      }

      const newIndex = accounts.length;
      const derivedWallet = deriveWalletFromMnemonic(mnemonic, newIndex);

      // Encrypt and store private key for new account
      const encryptedPk = await encryptPrivateKey(derivedWallet.privateKey, pin);
      await SecureStore.setItemAsync(`${ENCRYPTED_PK_PREFIX}${newIndex}`, encryptedPk);

      const newAccount: Account = {
        index: newIndex,
        name: `Account ${newIndex + 1}`,
        address: derivedWallet.address,
        path: derivedWallet.path,
      };

      const newAccounts = [...accounts, newAccount];
      await saveAccounts(newAccounts);

      return newAccount;
    } catch (error) {
      console.warn('Error adding account:', error);
      throw error;
    }
  }, [accounts, getMnemonic]);

  const selectAccount = useCallback(async (index: number) => {
    if (index >= 0 && index < accounts.length) {
      await AsyncStorage.setItem(SELECTED_ACCOUNT_KEY, index.toString());
      setSelectedAccountIndex(index);
    }
  }, [accounts.length]);

  const renameAccount = useCallback(async (index: number, name: string) => {
    const newAccounts = accounts.map((acc) =>
      acc.index === index ? { ...acc, name } : acc
    );
    await saveAccounts(newAccounts);
  }, [accounts]);

  /**
   * Re-encrypt all wallet data (mnemonic + all private keys) with a new PIN
   * This is called when the user changes their PIN
   * Returns true if successful, false if old PIN is wrong or re-encryption fails
   */
  const reEncryptAllWalletData = useCallback(async (oldPin: string, newPin: string): Promise<boolean> => {
    try {
      // Get current encryption salt before any changes
      const oldSalt = await getEncryptionSalt();
      if (!oldSalt) {
        console.error('No encryption salt found');
        return false;
      }

      // Generate new salt for the new PIN
      const newSalt = await generateSalt();

      // Step 1: Get and verify we can decrypt the mnemonic with old PIN
      const encryptedMnemonic = await SecureStore.getItemAsync(ENCRYPTED_MNEMONIC_KEY);
      if (!encryptedMnemonic) {
        console.error('No encrypted mnemonic found');
        return false;
      }

      const oldKey = await deriveKeyFromPin(oldPin, oldSalt);
      const mnemonic = decryptData(encryptedMnemonic, oldKey);
      if (!mnemonic) {
        console.error('Failed to decrypt mnemonic - wrong PIN');
        return false;
      }

      // Step 2: Re-encrypt mnemonic with new PIN and new salt
      const newKey = await deriveKeyFromPin(newPin, newSalt);
      const newEncryptedMnemonic = encryptData(mnemonic, newKey);

      // Step 3: Re-encrypt all private keys
      const reEncryptedKeys: { index: number; encrypted: string }[] = [];

      for (const account of accounts) {
        const encryptedPk = await SecureStore.getItemAsync(`${ENCRYPTED_PK_PREFIX}${account.index}`);
        if (!encryptedPk) {
          console.error(`No encrypted private key for account ${account.index}`);
          return false;
        }

        const privateKey = decryptData(encryptedPk, oldKey);
        if (!privateKey) {
          console.error(`Failed to decrypt private key for account ${account.index}`);
          return false;
        }

        const newEncryptedPk = encryptData(privateKey, newKey);
        reEncryptedKeys.push({ index: account.index, encrypted: newEncryptedPk });
      }

      // Step 4: Commit all changes atomically
      // First update the salt
      await setEncryptionSalt(newSalt);

      // Then store the new encrypted mnemonic
      await SecureStore.setItemAsync(ENCRYPTED_MNEMONIC_KEY, newEncryptedMnemonic);

      // Finally store all new encrypted private keys
      for (const { index, encrypted } of reEncryptedKeys) {
        await SecureStore.setItemAsync(`${ENCRYPTED_PK_PREFIX}${index}`, encrypted);
      }

      return true;
    } catch (error) {
      console.error('Re-encryption failed:', error);
      return false;
    }
  }, [accounts]);

  return (
    <WalletContext.Provider
      value={{
        hasWallet,
        isLoading,
        accounts,
        selectedAccount,
        walletAddress,
        createWallet,
        importWallet,
        resetWallet,
        getPrivateKey,
        getMnemonic,
        addAccount,
        selectAccount,
        renameAccount,
        reEncryptAllWalletData,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}

import { HDNodeWallet, Mnemonic } from 'ethers';
import { DerivedWallet } from '@/types/blockchain';

// BIP44 derivation path for Ethereum
// m / purpose' / coin_type' / account' / change / address_index
// m / 44' / 60' / 0' / 0 / {index}
const ETH_DERIVATION_PATH = "m/44'/60'/0'/0";

/**
 * Derive a wallet from a mnemonic phrase using BIP44 standard
 * @param phrase - 12 or 24 word mnemonic phrase (space-separated string)
 * @param accountIndex - Account index (default 0)
 * @returns DerivedWallet with address, private key, public key, mnemonic, and path
 */
export function deriveWalletFromMnemonic(
  phrase: string,
  accountIndex: number = 0
): DerivedWallet {
  // Normalize the phrase (trim, lowercase, single spaces)
  const normalizedPhrase = phrase.trim().toLowerCase().replace(/\s+/g, ' ');

  // Create mnemonic object
  const mnemonic = Mnemonic.fromPhrase(normalizedPhrase);

  // Derive the HD wallet at the specified path
  const derivationPath = `${ETH_DERIVATION_PATH}/${accountIndex}`;
  const hdWallet = HDNodeWallet.fromMnemonic(mnemonic, derivationPath);

  return {
    address: hdWallet.address,
    privateKey: hdWallet.privateKey,
    publicKey: hdWallet.publicKey,
    mnemonic: normalizedPhrase,
    path: derivationPath,
  };
}

/**
 * Validate a mnemonic phrase
 * @param phrase - Mnemonic phrase to validate
 * @returns boolean indicating if the phrase is valid
 */
export function validateMnemonic(phrase: string): boolean {
  try {
    const normalizedPhrase = phrase.trim().toLowerCase().replace(/\s+/g, ' ');
    Mnemonic.fromPhrase(normalizedPhrase);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get the address from a private key
 * @param privateKey - Private key hex string (with 0x prefix)
 * @returns Ethereum address
 */
export function getAddressFromPrivateKey(privateKey: string): string {
  const { Wallet } = require('ethers');
  const wallet = new Wallet(privateKey);
  return wallet.address;
}

/**
 * Check if an address is valid
 * @param address - Ethereum address to validate
 * @returns boolean indicating if the address is valid
 */
export function isValidAddress(address: string): boolean {
  const { isAddress } = require('ethers');
  return isAddress(address);
}

/**
 * Format an address for display (truncated)
 * @param address - Full Ethereum address
 * @param startChars - Number of characters to show at start (default 6)
 * @param endChars - Number of characters to show at end (default 4)
 * @returns Truncated address like "0x1234...5678"
 */
export function formatAddress(
  address: string,
  startChars: number = 6,
  endChars: number = 4
): string {
  if (!address || address.length < startChars + endChars) {
    return address;
  }
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

// WalletConnect / Reown configuration
// Get your Project ID from https://cloud.reown.com

// Replace with your Project ID from https://cloud.reown.com
export const WALLETCONNECT_PROJECT_ID = 'YOUR_WALLETCONNECT_PROJECT_ID';

// Wallet metadata shown to dApps when connecting
export const WALLET_METADATA = {
  name: 'Pouch Wallet',
  description: 'A secure mobile crypto wallet',
  url: 'https://pouch.wallet', // Your wallet's website
  icons: ['https://pouch.wallet/icon.png'], // Your wallet's icon
};

// Supported EVM methods that dApps can request
export const SUPPORTED_METHODS = [
  'eth_sendTransaction',
  'eth_signTransaction',
  'personal_sign',
  'eth_sign',
  'eth_signTypedData',
  'eth_signTypedData_v4',
  'wallet_switchEthereumChain',
  'wallet_addEthereumChain',
] as const;

// Supported events that the wallet can emit
export const SUPPORTED_EVENTS = [
  'chainChanged',
  'accountsChanged',
] as const;

// EIP-155 namespace for EVM chains
export const EIP155_NAMESPACE = 'eip155';

// Session expiry (7 days in seconds)
export const SESSION_EXPIRY = 7 * 24 * 60 * 60;

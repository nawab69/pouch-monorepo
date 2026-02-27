import { NetworkId } from '@/types/blockchain';

// Slippage presets (in percentage)
export const SLIPPAGE_PRESETS = [0.5, 1, 3] as const;
export const DEFAULT_SLIPPAGE = 1;
export const MAX_SLIPPAGE = 50; // 50% max
export const MIN_SLIPPAGE = 0.1; // 0.1% min

// Gas buffer for swap transactions (20% extra)
export const SWAP_GAS_BUFFER = 1.2;

// Quote refresh interval (15 seconds)
export const QUOTE_REFRESH_INTERVAL = 15000;

// Quote validity duration (30 seconds)
export const QUOTE_VALIDITY_DURATION = 30000;

// Debounce delay for quote fetching (500ms)
export const QUOTE_DEBOUNCE_DELAY = 500;

// Price impact warning thresholds
export const PRICE_IMPACT_WARNING_THRESHOLD = 1; // Yellow warning above 1%
export const PRICE_IMPACT_DANGER_THRESHOLD = 5; // Red warning above 5%

// Common wrapped native token addresses
export const WRAPPED_NATIVE_ADDRESSES: Record<NetworkId, Record<'mainnet' | 'testnet', string>> = {
  ethereum: {
    mainnet: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
    testnet: '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14', // WETH Sepolia (Uniswap canonical)
  },
  polygon: {
    mainnet: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', // WMATIC
    testnet: '0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889', // WMATIC Amoy
  },
  arbitrum: {
    mainnet: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', // WETH
    testnet: '0x980B62Da83eFf3D4576C647993b0c1D7faf17c73', // WETH Arbitrum Sepolia
  },
  optimism: {
    mainnet: '0x4200000000000000000000000000000000000006', // WETH
    testnet: '0x4200000000000000000000000000000000000006', // WETH Optimism Sepolia
  },
  base: {
    mainnet: '0x4200000000000000000000000000000000000006', // WETH
    testnet: '0x4200000000000000000000000000000000000006', // WETH Base Sepolia
  },
};

// ERC20 ABI for allowance and approval
export const ERC20_ABI = [
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function balanceOf(address account) view returns (uint256)',
];

// Maximum approval amount (uint256 max)
export const MAX_APPROVAL_AMOUNT = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';

// Uniswap V3 SwapRouter02 addresses
export const UNISWAP_SWAP_ROUTER: Record<NetworkId, Record<'mainnet' | 'testnet', string>> = {
  ethereum: {
    mainnet: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45', // SwapRouter02
    testnet: '0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E', // SwapRouter02 Sepolia
  },
  polygon: {
    mainnet: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',
    testnet: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45', // May not be fully deployed on Amoy
  },
  arbitrum: {
    mainnet: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',
    testnet: '0x101F443B4d1b059569D643917553c771E1b9663E', // Arbitrum Sepolia
  },
  optimism: {
    mainnet: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',
    testnet: '0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4', // Optimism Sepolia
  },
  base: {
    mainnet: '0x2626664c2603336E57B271c5C0b26F421741e481',
    testnet: '0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4', // Base Sepolia
  },
};

// Uniswap V3 Quoter V2 addresses
export const UNISWAP_QUOTER: Record<NetworkId, Record<'mainnet' | 'testnet', string>> = {
  ethereum: {
    mainnet: '0x61fFE014bA17989E743c5F6cB21bF9697530B21e',
    testnet: '0xEd1f6473345F45b75F8179591dd5bA1888cf2FB3', // Sepolia
  },
  polygon: {
    mainnet: '0x61fFE014bA17989E743c5F6cB21bF9697530B21e',
    testnet: '0x61fFE014bA17989E743c5F6cB21bF9697530B21e',
  },
  arbitrum: {
    mainnet: '0x61fFE014bA17989E743c5F6cB21bF9697530B21e',
    testnet: '0x2779a0CC1c3e0E44D2542EC3e79e3864Ae93Ef0B', // Arbitrum Sepolia
  },
  optimism: {
    mainnet: '0x61fFE014bA17989E743c5F6cB21bF9697530B21e',
    testnet: '0xC5290058841028F1614F3A6F0F5816cAd0df5E27', // Optimism Sepolia
  },
  base: {
    mainnet: '0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a',
    testnet: '0xC5290058841028F1614F3A6F0F5816cAd0df5E27', // Base Sepolia
  },
};

// Uniswap V3 pool fee tiers (in hundredths of a bip, i.e. 1e-6)
export const UNISWAP_FEE_TIERS = {
  LOWEST: 100,   // 0.01%
  LOW: 500,      // 0.05%
  MEDIUM: 3000,  // 0.3%
  HIGH: 10000,   // 1%
} as const;

// Default fee tier to try first
export const DEFAULT_FEE_TIER = UNISWAP_FEE_TIERS.MEDIUM;

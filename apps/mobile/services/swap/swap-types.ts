import { NetworkId, NetworkType, Token } from '@/types/blockchain';

// Internal swap quote
export interface SwapQuote {
  // Amounts
  sellAmount: string;
  sellAmountFormatted: string;
  buyAmount: string;
  buyAmountFormatted: string;

  // Price info
  price: string;
  priceImpact: string;
  guaranteedPrice: string;
  minBuyAmount: string;

  // Tokens
  sellToken: Token;
  buyToken: Token;

  // Gas
  gasEstimate: string;
  gasPrice: string;
  estimatedGasUsd: number | null;

  // Transaction data (for execution)
  to: string;
  data: string;
  value: string;

  // Sources (DEXes used)
  sources: Array<{
    name: string;
    proportion: string;
  }>;

  // Fees
  fees: {
    protocolFee: string | null;
    protocolFeeUsd: number | null;
  };

  // Raw response data (includes fee tier for Uniswap)
  raw: unknown;

  // Timing
  timestamp: number;
  expiresAt: number;
}

// Swap execution result
export interface SwapResult {
  hash: string;
  explorerUrl: string;
  sellAmount: string;
  sellToken: Token;
  buyAmount: string;
  buyToken: Token;
}

// Allowance status
export interface AllowanceStatus {
  hasAllowance: boolean;
  currentAllowance: string;
  requiredAllowance: string;
  spender: string;
  token: string;
}

// Approval result
export interface ApprovalResult {
  hash: string;
  explorerUrl: string;
}

// Swap parameters
export interface SwapParams {
  sellToken: Token;
  buyToken: Token;
  sellAmount: string;
  slippagePercentage: number;
  takerAddress: string;
  networkId: NetworkId;
  networkType: NetworkType;
}

// Swap execution parameters
export interface ExecuteSwapParams {
  quote: SwapQuote;
  privateKey: string;
  networkId: NetworkId;
  networkType: NetworkType;
}

// Slippage presets
export type SlippagePreset = 0.5 | 1 | 3;
export type SlippageValue = SlippagePreset | number;

// Swap state
export interface SwapState {
  sellToken: Token | null;
  buyToken: Token | null;
  sellAmount: string;
  buyAmount: string;
  slippage: SlippageValue;
  quote: SwapQuote | null;
  isQuoteLoading: boolean;
  isApproving: boolean;
  isSwapping: boolean;
  needsApproval: boolean;
  error: string | null;
}

// Price impact levels
export type PriceImpactLevel = 'low' | 'medium' | 'high';

export function getPriceImpactLevel(impact: number): PriceImpactLevel {
  if (impact < 1) return 'low';
  if (impact < 5) return 'medium';
  return 'high';
}

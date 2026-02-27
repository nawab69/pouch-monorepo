import { Wallet, JsonRpcProvider, Contract, formatUnits, parseUnits } from 'ethers';
import { Token, NetworkId, NetworkType } from '@/types/blockchain';
import {
  SwapQuote,
  SwapResult,
  AllowanceStatus,
  ApprovalResult,
  SwapParams,
  ExecuteSwapParams,
} from './swap-types';
import { getUniswapQuote, executeUniswapSwap, isUniswapAvailable } from './uniswap-client';
import {
  ERC20_ABI,
  MAX_APPROVAL_AMOUNT,
  UNISWAP_SWAP_ROUTER,
  SWAP_GAS_BUFFER,
  QUOTE_VALIDITY_DURATION,
} from '@/constants/swap';
import { NETWORKS, getExplorerTxUrl, ALCHEMY_API_KEY } from '@/constants/networks';

/**
 * Get RPC URL for a network
 */
function getRpcUrl(networkId: NetworkId, networkType: NetworkType): string {
  const network = NETWORKS[networkId];
  const chainId = network.chainId[networkType];

  const alchemyNetworkNames: Record<number, string> = {
    1: 'eth-mainnet',
    11155111: 'eth-sepolia',
    137: 'polygon-mainnet',
    80002: 'polygon-amoy',
    42161: 'arb-mainnet',
    421614: 'arb-sepolia',
    10: 'opt-mainnet',
    11155420: 'opt-sepolia',
    8453: 'base-mainnet',
    84532: 'base-sepolia',
  };

  const networkName = alchemyNetworkNames[chainId];
  return `https://${networkName}.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;
}

/**
 * Check if swaps are supported on this network
 */
export function isSwapSupported(networkId: NetworkId, networkType: NetworkType): boolean {
  return isUniswapAvailable(networkId, networkType);
}

/**
 * Get a swap quote using Uniswap V3
 */
export async function getSwapQuote(params: SwapParams): Promise<SwapQuote> {
  const { sellToken, buyToken, sellAmount, slippagePercentage, networkId, networkType } = params;

  // Check if swaps are supported on this network
  if (!isSwapSupported(networkId, networkType)) {
    throw new Error(`Swaps are not available on this network.`);
  }

  console.log('Getting swap quote:', {
    sellToken: sellToken.symbol,
    buyToken: buyToken.symbol,
    sellAmount,
    networkId,
    networkType,
  });

  const uniQuote = await getUniswapQuote(
    sellToken,
    buyToken,
    sellAmount,
    networkId,
    networkType
  );

  // Calculate price
  const sellAmountNum = parseFloat(sellAmount);
  const buyAmountNum = parseFloat(uniQuote.amountOutFormatted);
  const price = sellAmountNum > 0 ? buyAmountNum / sellAmountNum : 0;

  // Calculate min buy amount based on slippage
  const slippageMultiplier = 1 - slippagePercentage / 100;
  const minBuyAmount = (BigInt(uniQuote.amountOut) * BigInt(Math.floor(slippageMultiplier * 10000))) / 10000n;

  const swapQuote: SwapQuote = {
    sellAmount: parseUnits(sellAmount, sellToken.decimals).toString(),
    sellAmountFormatted: sellAmount,
    buyAmount: uniQuote.amountOut,
    buyAmountFormatted: uniQuote.amountOutFormatted,

    price: price.toString(),
    priceImpact: uniQuote.priceImpact,
    guaranteedPrice: (price * slippageMultiplier).toString(),
    minBuyAmount: formatUnits(minBuyAmount, buyToken.decimals),

    sellToken,
    buyToken,

    gasEstimate: uniQuote.gasEstimate || '150000', // Default gas estimate if not provided
    gasPrice: '0',
    estimatedGasUsd: null,

    to: UNISWAP_SWAP_ROUTER[networkId][networkType],
    data: '',
    value: sellToken.isNative ? parseUnits(sellAmount, sellToken.decimals).toString() : '0',

    sources: [{ name: 'Uniswap V3', proportion: '1' }],

    fees: {
      protocolFee: null,
      protocolFeeUsd: null,
    },

    // Store fee tier for execution
    raw: { fee: uniQuote.fee } as any,

    timestamp: Date.now(),
    expiresAt: Date.now() + QUOTE_VALIDITY_DURATION,
  };

  console.log('Swap quote generated:', {
    buyAmount: swapQuote.buyAmountFormatted,
    price: swapQuote.price,
    minBuyAmount: swapQuote.minBuyAmount,
  });

  return swapQuote;
}

/**
 * Check if a token has sufficient allowance for the swap
 */
export async function checkAllowance(
  token: Token,
  ownerAddress: string,
  spenderAddress: string,
  amount: string,
  networkId: NetworkId,
  networkType: NetworkType
): Promise<AllowanceStatus> {
  // Native tokens don't need approval
  if (token.isNative || !token.contractAddress) {
    return {
      hasAllowance: true,
      currentAllowance: MAX_APPROVAL_AMOUNT,
      requiredAllowance: amount,
      spender: spenderAddress,
      token: 'native',
    };
  }

  const rpcUrl = getRpcUrl(networkId, networkType);
  const provider = new JsonRpcProvider(rpcUrl);

  const contract = new Contract(token.contractAddress, ERC20_ABI, provider);

  try {
    const allowance = await contract.allowance(ownerAddress, spenderAddress);
    const requiredAmount = parseUnits(amount, token.decimals);

    return {
      hasAllowance: allowance >= requiredAmount,
      currentAllowance: allowance.toString(),
      requiredAllowance: requiredAmount.toString(),
      spender: spenderAddress,
      token: token.contractAddress,
    };
  } catch (error) {
    console.error('Error checking allowance:', error);
    throw new Error('Failed to check token allowance');
  }
}

/**
 * Get the spender address for approval (Uniswap SwapRouter)
 */
export function getApprovalSpender(networkId: NetworkId, networkType: NetworkType): string {
  return UNISWAP_SWAP_ROUTER[networkId][networkType];
}

/**
 * Check if approval is needed for a swap
 */
export async function needsApproval(
  quote: SwapQuote,
  ownerAddress: string,
  networkId: NetworkId,
  networkType: NetworkType
): Promise<boolean> {
  // Native tokens don't need approval
  if (quote.sellToken.isNative) {
    return false;
  }

  const spender = getApprovalSpender(networkId, networkType);

  const allowanceStatus = await checkAllowance(
    quote.sellToken,
    ownerAddress,
    spender,
    quote.sellAmountFormatted,
    networkId,
    networkType
  );

  return !allowanceStatus.hasAllowance;
}

/**
 * Approve a token for swapping
 */
export async function approveToken(
  privateKey: string,
  token: Token,
  spenderAddress: string,
  networkId: NetworkId,
  networkType: NetworkType,
  amount: string = MAX_APPROVAL_AMOUNT
): Promise<ApprovalResult> {
  if (token.isNative || !token.contractAddress) {
    throw new Error('Cannot approve native token');
  }

  const rpcUrl = getRpcUrl(networkId, networkType);
  const provider = new JsonRpcProvider(rpcUrl);
  const wallet = new Wallet(privateKey, provider);

  const contract = new Contract(token.contractAddress, ERC20_ABI, wallet);

  try {
    // Get gas estimate
    const gasEstimate = await contract.approve.estimateGas(spenderAddress, amount);
    const gasLimit = (gasEstimate * BigInt(Math.floor(SWAP_GAS_BUFFER * 100))) / 100n;

    // Send approval transaction
    const tx = await contract.approve(spenderAddress, amount, {
      gasLimit,
    });

    // Wait for confirmation
    await tx.wait();

    const explorerUrl = getExplorerTxUrl(networkId, networkType, tx.hash);

    return {
      hash: tx.hash,
      explorerUrl,
    };
  } catch (error) {
    console.error('Error approving token:', error);
    throw new Error('Failed to approve token. Please try again.');
  }
}

/**
 * Execute a swap using Uniswap V3
 */
export async function executeSwap(params: ExecuteSwapParams): Promise<SwapResult> {
  const { quote, privateKey, networkId, networkType } = params;

  // Check if quote is still valid
  if (Date.now() > quote.expiresAt) {
    throw new Error('Quote has expired. Please get a new quote.');
  }

  try {
    // Get fee from stored quote data
    const fee = (quote.raw as any)?.fee || 3000; // Default to 0.3%

    const result = await executeUniswapSwap(
      privateKey,
      quote.sellToken,
      quote.buyToken,
      quote.sellAmountFormatted,
      quote.minBuyAmount,
      fee,
      networkId,
      networkType
    );

    return {
      hash: result.hash,
      explorerUrl: result.explorerUrl,
      sellAmount: quote.sellAmountFormatted,
      sellToken: quote.sellToken,
      buyAmount: quote.buyAmountFormatted,
      buyToken: quote.buyToken,
    };
  } catch (error) {
    console.error('Error executing swap:', error);

    if (error instanceof Error) {
      if (error.message.includes('insufficient funds')) {
        throw new Error('Insufficient funds for gas fees');
      }
      if (error.message.includes('No liquidity')) {
        throw new Error('No liquidity pool found for this token pair');
      }
      // Pass through the original error message
      throw error;
    }

    throw new Error('Failed to execute swap. Please try again.');
  }
}

/**
 * Get the major DEX source from a quote
 */
export function getMajorSource(quote: SwapQuote): string {
  if (!quote.sources || quote.sources.length === 0) {
    return 'Uniswap V3';
  }

  return quote.sources[0].name.replace(/_/g, ' ');
}

/**
 * Format price for display (e.g., "1 ETH = 2,500 USDC")
 */
export function formatSwapPrice(quote: SwapQuote): string {
  const price = parseFloat(quote.price);

  if (isNaN(price) || price === 0) {
    return `1 ${quote.sellToken.symbol} = ? ${quote.buyToken.symbol}`;
  }

  if (price >= 1000) {
    return `1 ${quote.sellToken.symbol} = ${price.toLocaleString(undefined, {
      maximumFractionDigits: 2,
    })} ${quote.buyToken.symbol}`;
  } else if (price >= 1) {
    return `1 ${quote.sellToken.symbol} = ${price.toFixed(4)} ${quote.buyToken.symbol}`;
  } else {
    // Invert for small prices
    const inverted = 1 / price;
    return `1 ${quote.buyToken.symbol} = ${inverted.toFixed(4)} ${quote.sellToken.symbol}`;
  }
}

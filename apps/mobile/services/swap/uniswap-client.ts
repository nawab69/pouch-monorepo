import { Contract, JsonRpcProvider, Wallet, parseUnits, formatUnits, AbiCoder } from 'ethers';
import { Token, NetworkId, NetworkType } from '@/types/blockchain';
import {
  UNISWAP_QUOTER,
  UNISWAP_SWAP_ROUTER,
  UNISWAP_FEE_TIERS,
  WRAPPED_NATIVE_ADDRESSES,
  SWAP_GAS_BUFFER,
} from '@/constants/swap';
import { NETWORKS, getExplorerTxUrl, ALCHEMY_API_KEY } from '@/constants/networks';

export interface UniswapQuote {
  amountOut: string;
  amountOutFormatted: string;
  fee: number;
  gasEstimate: string;
  priceImpact: string;
}

export interface UniswapSwapResult {
  hash: string;
  explorerUrl: string;
  amountOut: string;
}

// Proper ABI for Uniswap V3 Quoter V2
const QUOTER_V2_ABI = [
  'function quoteExactInputSingle(tuple(address tokenIn, address tokenOut, uint256 amountIn, uint24 fee, uint160 sqrtPriceLimitX96) params) external returns (uint256 amountOut, uint160 sqrtPriceX96After, uint32 initializedTicksCrossed, uint256 gasEstimate)',
];

// Proper ABI for Uniswap V3 SwapRouter02
const SWAP_ROUTER_ABI = [
  'function exactInputSingle(tuple(address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96) params) external payable returns (uint256 amountOut)',
];

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
 * Get the token address for Uniswap (wrapped for native tokens)
 */
function getTokenAddress(
  token: Token,
  networkId: NetworkId,
  networkType: NetworkType
): string {
  if (token.isNative) {
    return WRAPPED_NATIVE_ADDRESSES[networkId][networkType];
  }
  return token.contractAddress!;
}

/**
 * Try to get a quote with different fee tiers
 */
async function tryQuoteWithFeeTiers(
  quoterContract: Contract,
  tokenIn: string,
  tokenOut: string,
  amountIn: bigint
): Promise<{ amountOut: bigint; fee: number; gasEstimate: bigint } | null> {
  const feeTiers = [
    UNISWAP_FEE_TIERS.MEDIUM,  // 0.3% - most common
    UNISWAP_FEE_TIERS.LOW,     // 0.05% - stablecoins
    UNISWAP_FEE_TIERS.HIGH,    // 1% - exotic pairs
    UNISWAP_FEE_TIERS.LOWEST,  // 0.01% - very stable
  ];

  for (const fee of feeTiers) {
    try {
      // Call the quoter with tuple parameter - must be passed as a single struct argument
      const params = {
        tokenIn,
        tokenOut,
        amountIn,
        fee,
        sqrtPriceLimitX96: 0n,
      };

      console.log(`Trying fee tier ${fee / 10000}% for ${tokenIn} -> ${tokenOut}`);

      const result = await quoterContract.quoteExactInputSingle.staticCall(params);

      console.log('Quote result:', {
        amountOut: result[0].toString(),
        gasEstimate: result[3].toString(),
      });

      return {
        amountOut: result[0], // amountOut
        fee,
        gasEstimate: result[3], // gasEstimate
      };
    } catch (err) {
      console.log(`Fee tier ${fee / 10000}% failed:`, err instanceof Error ? err.message : 'Unknown error');
      continue;
    }
  }

  return null;
}

/**
 * Get a swap quote from Uniswap V3
 */
export async function getUniswapQuote(
  sellToken: Token,
  buyToken: Token,
  sellAmount: string,
  networkId: NetworkId,
  networkType: NetworkType
): Promise<UniswapQuote> {
  const rpcUrl = getRpcUrl(networkId, networkType);
  const provider = new JsonRpcProvider(rpcUrl);

  const quoterAddress = UNISWAP_QUOTER[networkId][networkType];

  console.log('Uniswap Quote Request:', {
    quoterAddress,
    networkId,
    networkType,
    sellToken: sellToken.symbol,
    buyToken: buyToken.symbol,
    sellAmount,
  });

  const quoter = new Contract(quoterAddress, QUOTER_V2_ABI, provider);

  const tokenIn = getTokenAddress(sellToken, networkId, networkType);
  const tokenOut = getTokenAddress(buyToken, networkId, networkType);
  const amountIn = parseUnits(sellAmount, sellToken.decimals);

  console.log('Token addresses:', { tokenIn, tokenOut, amountIn: amountIn.toString() });

  const result = await tryQuoteWithFeeTiers(quoter, tokenIn, tokenOut, amountIn);

  if (!result) {
    throw new Error('No liquidity pool found for this token pair. Try different tokens.');
  }

  const amountOutFormatted = formatUnits(result.amountOut, buyToken.decimals);

  // Estimate price impact (simplified - would need pool reserves for accurate calculation)
  const priceImpact = '0.5';

  return {
    amountOut: result.amountOut.toString(),
    amountOutFormatted,
    fee: result.fee,
    gasEstimate: result.gasEstimate.toString(),
    priceImpact,
  };
}

/**
 * Execute a swap on Uniswap V3
 */
export async function executeUniswapSwap(
  privateKey: string,
  sellToken: Token,
  buyToken: Token,
  sellAmount: string,
  minBuyAmount: string,
  fee: number,
  networkId: NetworkId,
  networkType: NetworkType
): Promise<UniswapSwapResult> {
  const rpcUrl = getRpcUrl(networkId, networkType);
  const provider = new JsonRpcProvider(rpcUrl);
  const wallet = new Wallet(privateKey, provider);

  const routerAddress = UNISWAP_SWAP_ROUTER[networkId][networkType];
  const router = new Contract(routerAddress, SWAP_ROUTER_ABI, wallet);

  const tokenIn = getTokenAddress(sellToken, networkId, networkType);
  const tokenOut = getTokenAddress(buyToken, networkId, networkType);
  const amountIn = parseUnits(sellAmount, sellToken.decimals);
  const amountOutMinimum = parseUnits(minBuyAmount, buyToken.decimals);

  console.log('Executing swap:', {
    routerAddress,
    tokenIn,
    tokenOut,
    amountIn: amountIn.toString(),
    amountOutMinimum: amountOutMinimum.toString(),
    fee,
  });

  // Build swap params as tuple struct
  const swapParams = {
    tokenIn,
    tokenOut,
    fee,
    recipient: wallet.address,
    amountIn,
    amountOutMinimum,
    sqrtPriceLimitX96: 0n,
  };

  let tx;

  if (sellToken.isNative) {
    // Selling native token (ETH) - send ETH value with transaction
    const gasEstimate = await router.exactInputSingle.estimateGas(swapParams, { value: amountIn });
    const gasLimit = (gasEstimate * BigInt(Math.floor(SWAP_GAS_BUFFER * 100))) / 100n;

    tx = await router.exactInputSingle(swapParams, {
      value: amountIn,
      gasLimit,
    });
  } else {
    // Token swap - no ETH value needed
    const gasEstimate = await router.exactInputSingle.estimateGas(swapParams);
    const gasLimit = (gasEstimate * BigInt(Math.floor(SWAP_GAS_BUFFER * 100))) / 100n;

    tx = await router.exactInputSingle(swapParams, { gasLimit });
  }

  console.log('Swap transaction sent:', tx.hash);

  // Wait for transaction
  await tx.wait();

  const explorerUrl = getExplorerTxUrl(networkId, networkType, tx.hash);

  return {
    hash: tx.hash,
    explorerUrl,
    amountOut: amountOutMinimum.toString(),
  };
}

/**
 * Check if Uniswap is available on this network
 */
export function isUniswapAvailable(networkId: NetworkId, networkType: NetworkType): boolean {
  const quoterAddress = UNISWAP_QUOTER[networkId]?.[networkType];
  const routerAddress = UNISWAP_SWAP_ROUTER[networkId]?.[networkType];

  return !!quoterAddress && !!routerAddress;
}

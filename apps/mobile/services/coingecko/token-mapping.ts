// Token mapping from contract addresses to CoinGecko IDs
import { NetworkId } from '@/types/blockchain';

// Native token CoinGecko IDs by network
export const NATIVE_TOKEN_IDS: Record<NetworkId, string> = {
  ethereum: 'ethereum',
  polygon: 'polygon-ecosystem-token',
  arbitrum: 'ethereum', // ARB uses ETH as native
  optimism: 'ethereum', // OP uses ETH as native
  base: 'ethereum', // Base uses ETH as native
};

// Popular ERC20 token CoinGecko IDs by symbol (network-agnostic for common tokens)
export const TOKEN_IDS_BY_SYMBOL: Record<string, string> = {
  USDC: 'usd-coin',
  USDT: 'tether',
  DAI: 'dai',
  WETH: 'weth',
  WBTC: 'wrapped-bitcoin',
  LINK: 'chainlink',
  UNI: 'uniswap',
  AAVE: 'aave',
  ARB: 'arbitrum',
  OP: 'optimism',
  MATIC: 'polygon-ecosystem-token',
  POL: 'polygon-ecosystem-token',
  SHIB: 'shiba-inu',
  PEPE: 'pepe',
  APE: 'apecoin',
  LDO: 'lido-dao',
  MKR: 'maker',
  CRV: 'curve-dao-token',
  SNX: 'havven',
  COMP: 'compound-governance-token',
  GRT: 'the-graph',
};

// Contract address to CoinGecko ID mapping for specific networks
// Lowercase addresses for case-insensitive lookup
const CONTRACT_TO_ID: Record<NetworkId, Record<string, string>> = {
  ethereum: {
    '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': 'usd-coin', // USDC
    '0xdac17f958d2ee523a2206206994597c13d831ec7': 'tether', // USDT
    '0x6b175474e89094c44da98b954eedeac495271d0f': 'dai', // DAI
    '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2': 'weth', // WETH
    '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599': 'wrapped-bitcoin', // WBTC
    '0x514910771af9ca656af840dff83e8264ecf986ca': 'chainlink', // LINK
    '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984': 'uniswap', // UNI
    '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9': 'aave', // AAVE
  },
  polygon: {
    '0x2791bca1f2de4661ed88a30c99a7a9449aa84174': 'usd-coin', // USDC.e (bridged)
    '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359': 'usd-coin', // USDC (native)
    '0xc2132d05d31c914a87c6611c10748aeb04b58e8f': 'tether', // USDT
    '0x8f3cf7ad23cd3cadbd9735aff958023239c6a063': 'dai', // DAI
    '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619': 'weth', // WETH
    '0x53e0bca35ec356bd5dddfebbd1fc0fd03fabad39': 'chainlink', // LINK
  },
  arbitrum: {
    '0xaf88d065e77c8cc2239327c5edb3a432268e5831': 'usd-coin', // USDC
    '0xff970a61a04b1ca14834a43f5de4533ebddb5cc8': 'usd-coin', // USDC.e (bridged)
    '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9': 'tether', // USDT
    '0xda10009cbd5d07dd0cecc66161fc93d7c9000da1': 'dai', // DAI
    '0x82af49447d8a07e3bd95bd0d56f35241523fbab1': 'weth', // WETH
    '0x912ce59144191c1204e64559fe8253a0e49e6548': 'arbitrum', // ARB
  },
  optimism: {
    '0x0b2c639c533813f4aa9d7837caf62653d097ff85': 'usd-coin', // USDC
    '0x7f5c764cbc14f9669b88837ca1490cca17c31607': 'usd-coin', // USDC.e (bridged)
    '0x94b008aa00579c1307b0ef2c499ad98a8ce58e58': 'tether', // USDT
    '0xda10009cbd5d07dd0cecc66161fc93d7c9000da1': 'dai', // DAI
    '0x4200000000000000000000000000000000000006': 'weth', // WETH
    '0x4200000000000000000000000000000000000042': 'optimism', // OP
  },
  base: {
    '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913': 'usd-coin', // USDC
    '0x50c5725949a6f0c72e6c4a641f24049a917db0cb': 'dai', // DAI
    '0x4200000000000000000000000000000000000006': 'weth', // WETH
  },
};

/**
 * Get CoinGecko ID for a native token
 */
export function getNativeTokenId(networkId: NetworkId): string {
  return NATIVE_TOKEN_IDS[networkId];
}

/**
 * Get CoinGecko ID for a token by contract address
 */
export function getTokenIdByContract(
  contractAddress: string,
  networkId: NetworkId
): string | null {
  const networkContracts = CONTRACT_TO_ID[networkId];
  if (!networkContracts) return null;

  const normalized = contractAddress.toLowerCase();
  return networkContracts[normalized] ?? null;
}

/**
 * Get CoinGecko ID for a token by symbol (fallback when contract not mapped)
 */
export function getTokenIdBySymbol(symbol: string): string | null {
  const upperSymbol = symbol.toUpperCase();
  return TOKEN_IDS_BY_SYMBOL[upperSymbol] ?? null;
}

/**
 * Get CoinGecko ID for a token (tries contract first, then symbol fallback)
 */
export function getCoinGeckoId(
  contractAddress: string | null,
  symbol: string,
  networkId: NetworkId
): string | null {
  // Native token
  if (contractAddress === null) {
    return getNativeTokenId(networkId);
  }

  // Try contract address lookup first
  const byContract = getTokenIdByContract(contractAddress, networkId);
  if (byContract) return byContract;

  // Fall back to symbol lookup
  return getTokenIdBySymbol(symbol);
}

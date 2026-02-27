import { formatUnits } from 'ethers';
import { getAlchemyClient } from './alchemy-client';
import { Token, NetworkId, NetworkType } from '@/types/blockchain';
import { NETWORKS } from '@/constants/networks';

/**
 * Get all token balances for an address
 * Returns native token + ERC20 tokens with non-zero balances
 */
export async function getTokenBalances(
  address: string,
  networkId: NetworkId,
  networkType: NetworkType
): Promise<Token[]> {
  const alchemy = getAlchemyClient(networkId, networkType);
  const network = NETWORKS[networkId];
  const tokens: Token[] = [];

  try {
    // Get native token balance
    const nativeBalance = await alchemy.core.getBalance(address);
    const nativeBalanceStr = nativeBalance.toString();
    const nativeBalanceFormatted = formatUnits(nativeBalanceStr, 18);

    tokens.push({
      contractAddress: null,
      symbol: network.symbol,
      name: network.name,
      decimals: 18,
      balance: nativeBalanceStr,
      balanceFormatted: formatBalance(nativeBalanceFormatted),
      balanceUsd: null, // Could add price fetching later
      isNative: true,
    });

    // Get ERC20 token balances
    const tokenBalances = await alchemy.core.getTokenBalances(address);

    // Filter for non-zero balances and get metadata
    const nonZeroBalances = tokenBalances.tokenBalances.filter(
      (token) => token.tokenBalance && BigInt(token.tokenBalance) > 0n
    );

    // Get metadata for each token
    const metadataPromises = nonZeroBalances.map((token) =>
      alchemy.core.getTokenMetadata(token.contractAddress)
    );

    const metadataResults = await Promise.allSettled(metadataPromises);

    for (let i = 0; i < nonZeroBalances.length; i++) {
      const tokenData = nonZeroBalances[i];
      const metadataResult = metadataResults[i];

      if (metadataResult.status === 'fulfilled' && metadataResult.value) {
        const metadata = metadataResult.value;
        const decimals = metadata.decimals ?? 18;
        const balanceFormatted = formatUnits(
          tokenData.tokenBalance ?? '0',
          decimals
        );

        tokens.push({
          contractAddress: tokenData.contractAddress,
          symbol: metadata.symbol ?? 'UNKNOWN',
          name: metadata.name ?? 'Unknown Token',
          decimals,
          balance: tokenData.tokenBalance ?? '0',
          balanceFormatted: formatBalance(balanceFormatted),
          balanceUsd: null,
          isNative: false,
          logoUrl: metadata.logo ?? undefined,
        });
      }
    }

    return tokens;
  } catch (error) {
    console.error('Error fetching token balances:', error);
    // Return at least the native token with 0 balance on error
    return [
      {
        contractAddress: null,
        symbol: network.symbol,
        name: network.name,
        decimals: 18,
        balance: '0',
        balanceFormatted: '0',
        balanceUsd: null,
        isNative: true,
      },
    ];
  }
}

/**
 * Get balance for a specific token
 */
export async function getTokenBalance(
  address: string,
  tokenAddress: string | null,
  networkId: NetworkId,
  networkType: NetworkType
): Promise<Token | null> {
  const alchemy = getAlchemyClient(networkId, networkType);
  const network = NETWORKS[networkId];

  try {
    if (tokenAddress === null) {
      // Native token
      const balance = await alchemy.core.getBalance(address);
      const balanceStr = balance.toString();
      const balanceFormatted = formatUnits(balanceStr, 18);

      return {
        contractAddress: null,
        symbol: network.symbol,
        name: network.name,
        decimals: 18,
        balance: balanceStr,
        balanceFormatted: formatBalance(balanceFormatted),
        balanceUsd: null,
        isNative: true,
      };
    } else {
      // ERC20 token
      const [balanceResult, metadata] = await Promise.all([
        alchemy.core.getTokenBalances(address, [tokenAddress]),
        alchemy.core.getTokenMetadata(tokenAddress),
      ]);

      const tokenBalance = balanceResult.tokenBalances[0];
      const decimals = metadata.decimals ?? 18;
      const balanceFormatted = formatUnits(
        tokenBalance?.tokenBalance ?? '0',
        decimals
      );

      return {
        contractAddress: tokenAddress,
        symbol: metadata.symbol ?? 'UNKNOWN',
        name: metadata.name ?? 'Unknown Token',
        decimals,
        balance: tokenBalance?.tokenBalance ?? '0',
        balanceFormatted: formatBalance(balanceFormatted),
        balanceUsd: null,
        isNative: false,
        logoUrl: metadata.logo ?? undefined,
      };
    }
  } catch (error) {
    console.error('Error fetching token balance:', error);
    return null;
  }
}

/**
 * Format a balance string for display
 * Limits decimal places and removes trailing zeros
 */
function formatBalance(balance: string, maxDecimals: number = 6): string {
  const num = parseFloat(balance);
  if (isNaN(num)) return '0';
  if (num === 0) return '0';
  if (num < 0.000001) return '<0.000001';

  // Round to max decimals
  const rounded = parseFloat(num.toFixed(maxDecimals));
  return rounded.toString();
}

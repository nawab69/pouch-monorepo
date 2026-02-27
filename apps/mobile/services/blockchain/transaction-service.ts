import { Wallet, parseUnits, formatUnits, parseEther, formatEther, JsonRpcProvider } from 'ethers';
import { AssetTransfersCategory, SortingOrder } from 'alchemy-sdk';
import { getAlchemyClient } from './alchemy-client';
import {
  Token,
  NetworkId,
  NetworkType,
  GasEstimate,
  GasOption,
  SendTransactionParams,
  SendTransactionResult,
  Transaction,
  TransactionType,
} from '@/types/blockchain';
import { NETWORKS, getExplorerTxUrl, getChainId } from '@/constants/networks';
import { ALCHEMY_API_KEY } from '@/constants/networks';

// ERC20 transfer function signature
const ERC20_TRANSFER_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
];

// Get RPC URL for a network
function getRpcUrl(networkId: NetworkId, networkType: NetworkType): string {
  const network = NETWORKS[networkId];
  const chainId = network.chainId[networkType];

  // Alchemy network names
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
 * Estimate gas for a transaction
 */
export async function estimateGas(
  from: string,
  to: string,
  token: Token,
  amount: string,
  networkId: NetworkId,
  networkType: NetworkType
): Promise<GasEstimate> {
  const alchemy = getAlchemyClient(networkId, networkType);

  try {
    let gasLimitBigInt: bigint;

    if (token.isNative) {
      // Native token transfer
      const amountWei = parseEther(amount);
      const gasLimit = await alchemy.core.estimateGas({
        from,
        to,
        value: amountWei,
      });
      gasLimitBigInt = BigInt(gasLimit.toString());
    } else {
      // ERC20 transfer - estimate for contract call
      const amountUnits = parseUnits(amount, token.decimals);
      const { Interface } = await import('ethers');
      const iface = new Interface(ERC20_TRANSFER_ABI);
      const data = iface.encodeFunctionData('transfer', [to, amountUnits]);

      const gasLimit = await alchemy.core.estimateGas({
        from,
        to: token.contractAddress!,
        data,
      });
      gasLimitBigInt = BigInt(gasLimit.toString());
    }

    // Add 20% buffer to gas limit
    gasLimitBigInt = (gasLimitBigInt * 120n) / 100n;

    // Get current gas prices
    const feeData = await alchemy.core.getFeeData();
    const maxFeePerGas = BigInt(feeData.maxFeePerGas?.toString() ?? '0');
    const maxPriorityFeePerGas = BigInt(feeData.maxPriorityFeePerGas?.toString() ?? '0');

    // Calculate estimated cost
    const estimatedCostWei = gasLimitBigInt * maxFeePerGas;
    const estimatedCostFormatted = formatEther(estimatedCostWei);

    return {
      gasLimit: gasLimitBigInt,
      maxFeePerGas,
      maxPriorityFeePerGas,
      estimatedCostWei,
      estimatedCostFormatted,
      estimatedCostUsd: null, // Could add price conversion later
    };
  } catch (error) {
    console.error('Error estimating gas:', error);
    throw new Error('Failed to estimate gas. Please check your inputs.');
  }
}

/**
 * Get gas options (slow, standard, fast)
 */
export async function getGasOptions(
  networkId: NetworkId,
  networkType: NetworkType
): Promise<GasOption[]> {
  const alchemy = getAlchemyClient(networkId, networkType);

  try {
    const feeData = await alchemy.core.getFeeData();
    const baseFee = BigInt(feeData.maxFeePerGas?.toString() ?? '0');
    const priorityFee = BigInt(feeData.maxPriorityFeePerGas?.toString() ?? '0');

    return [
      {
        label: 'slow',
        maxFeePerGas: (baseFee * 90n) / 100n,
        maxPriorityFeePerGas: (priorityFee * 80n) / 100n,
        estimatedTime: '~5 min',
      },
      {
        label: 'standard',
        maxFeePerGas: baseFee,
        maxPriorityFeePerGas: priorityFee,
        estimatedTime: '~30 sec',
      },
      {
        label: 'fast',
        maxFeePerGas: (baseFee * 120n) / 100n,
        maxPriorityFeePerGas: (priorityFee * 150n) / 100n,
        estimatedTime: '~15 sec',
      },
    ];
  } catch (error) {
    console.error('Error getting gas options:', error);
    // Return default values
    const defaultFee = parseUnits('20', 'gwei');
    const defaultPriority = parseUnits('1', 'gwei');

    return [
      {
        label: 'slow',
        maxFeePerGas: defaultFee,
        maxPriorityFeePerGas: defaultPriority,
        estimatedTime: '~5 min',
      },
      {
        label: 'standard',
        maxFeePerGas: defaultFee * 2n,
        maxPriorityFeePerGas: defaultPriority * 2n,
        estimatedTime: '~30 sec',
      },
      {
        label: 'fast',
        maxFeePerGas: defaultFee * 3n,
        maxPriorityFeePerGas: defaultPriority * 3n,
        estimatedTime: '~15 sec',
      },
    ];
  }
}

/**
 * Send a transaction
 */
export async function sendTransaction(
  privateKey: string,
  params: SendTransactionParams,
  networkId: NetworkId,
  networkType: NetworkType
): Promise<SendTransactionResult> {
  try {
    // Create provider and wallet
    const rpcUrl = getRpcUrl(networkId, networkType);
    const provider = new JsonRpcProvider(rpcUrl);
    const wallet = new Wallet(privateKey, provider);

    let txResponse;

    if (params.token.isNative) {
      // Native token transfer
      const amountWei = parseEther(params.amount);
      txResponse = await wallet.sendTransaction({
        to: params.to,
        value: amountWei,
        maxFeePerGas: params.gasEstimate.maxFeePerGas,
        maxPriorityFeePerGas: params.gasEstimate.maxPriorityFeePerGas,
        gasLimit: params.gasEstimate.gasLimit,
      });
    } else {
      // ERC20 transfer
      const amountUnits = parseUnits(params.amount, params.token.decimals);
      const { Interface } = await import('ethers');
      const iface = new Interface(ERC20_TRANSFER_ABI);
      const data = iface.encodeFunctionData('transfer', [params.to, amountUnits]);

      txResponse = await wallet.sendTransaction({
        to: params.token.contractAddress!,
        data,
        maxFeePerGas: params.gasEstimate.maxFeePerGas,
        maxPriorityFeePerGas: params.gasEstimate.maxPriorityFeePerGas,
        gasLimit: params.gasEstimate.gasLimit,
      });
    }

    const explorerUrl = getExplorerTxUrl(networkId, networkType, txResponse.hash);

    return {
      hash: txResponse.hash,
      explorerUrl,
    };
  } catch (error) {
    console.error('Error sending transaction:', error);
    throw new Error('Failed to send transaction. Please try again.');
  }
}

/**
 * Get transaction history for an address
 */
export async function getTransactionHistory(
  address: string,
  networkId: NetworkId,
  networkType: NetworkType,
  limit: number = 50
): Promise<Transaction[]> {
  const alchemy = getAlchemyClient(networkId, networkType);

  try {
    // Get transfers (both sent and received)
    const [sentTransfers, receivedTransfers] = await Promise.all([
      alchemy.core.getAssetTransfers({
        fromAddress: address,
        category: [AssetTransfersCategory.EXTERNAL, AssetTransfersCategory.ERC20],
        maxCount: limit,
        order: SortingOrder.DESCENDING,
        withMetadata: true,
      }),
      alchemy.core.getAssetTransfers({
        toAddress: address,
        category: [AssetTransfersCategory.EXTERNAL, AssetTransfersCategory.ERC20],
        maxCount: limit,
        order: SortingOrder.DESCENDING,
        withMetadata: true,
      }),
    ]);

    // Combine and deduplicate by hash
    const allTransfers = [...sentTransfers.transfers, ...receivedTransfers.transfers];
    const uniqueTransfers = Array.from(
      new Map(allTransfers.map((tx) => [tx.hash, tx])).values()
    );

    // Sort by block number descending
    uniqueTransfers.sort((a, b) => {
      const blockA = parseInt(a.blockNum, 16);
      const blockB = parseInt(b.blockNum, 16);
      return blockB - blockA;
    });

    // Convert to our Transaction type
    const transactions: Transaction[] = uniqueTransfers.slice(0, limit).map((tx) => {
      const isSend = tx.from.toLowerCase() === address.toLowerCase();
      const type: TransactionType = isSend ? 'send' : 'receive';
      const txWithMetadata = tx as typeof tx & { metadata?: { blockTimestamp?: string } };
      const timestamp = txWithMetadata.metadata?.blockTimestamp
        ? new Date(txWithMetadata.metadata.blockTimestamp).getTime()
        : Date.now();

      return {
        hash: tx.hash,
        from: tx.from,
        to: tx.to ?? '',
        value: tx.value?.toString() ?? '0',
        valueFormatted: tx.value?.toFixed(6) ?? '0',
        valueUsd: null,
        gasUsed: '0', // Not available in asset transfers
        gasPrice: '0',
        timestamp,
        status: 'confirmed',
        type,
        token: tx.asset
          ? {
              contractAddress: tx.rawContract?.address ?? null,
              symbol: tx.asset,
              name: tx.asset,
              decimals: tx.rawContract?.decimal ? parseInt(tx.rawContract.decimal) : 18,
              balance: '0',
              balanceFormatted: '0',
              balanceUsd: null,
              isNative: tx.category === AssetTransfersCategory.EXTERNAL,
            }
          : undefined,
        networkId,
        networkType,
        blockNumber: parseInt(tx.blockNum, 16),
      };
    });

    return transactions;
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    return [];
  }
}

/**
 * Wait for a transaction to be confirmed
 */
export async function waitForTransaction(
  txHash: string,
  networkId: NetworkId,
  networkType: NetworkType,
  confirmations: number = 1
): Promise<boolean> {
  const alchemy = getAlchemyClient(networkId, networkType);

  try {
    const receipt = await alchemy.core.waitForTransaction(txHash, confirmations);
    return receipt?.status === 1;
  } catch (error) {
    console.error('Error waiting for transaction:', error);
    return false;
  }
}

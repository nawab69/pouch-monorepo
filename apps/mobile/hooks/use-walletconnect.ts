import { useCallback, useMemo } from 'react';
import { JsonRpcProvider } from 'ethers';
import { useWalletConnectContext } from '@/contexts/walletconnect-context';
import { useWallet } from '@/contexts/wallet-context';
import { useNetwork } from '@/contexts/network-context';
import {
  parseSessionRequest,
  signMessage,
  signMessageHex,
  signTypedData,
  sendTransaction,
  signTransaction,
} from '@/services/walletconnect/request-handler';
import {
  getSupportedChainIds,
  getNetworkNameForChainId,
  fromWCChainId,
} from '@/services/walletconnect/chain-utils';
import { NETWORKS, ALCHEMY_API_KEY } from '@/constants/networks';
import type { WCParsedRequest } from '@/types/walletconnect';

/**
 * Main hook for WalletConnect functionality
 * Combines context with wallet and network for signing operations
 */
export function useWalletConnect() {
  const wc = useWalletConnectContext();
  const { walletAddress, getPrivateKey } = useWallet();
  const { networkType } = useNetwork();

  // Get supported chain IDs for current network type
  const supportedChainIds = useMemo(
    () => getSupportedChainIds(networkType),
    [networkType]
  );

  // Parse pending request for UI
  const parsedRequest = useMemo((): WCParsedRequest | null => {
    if (!wc.pendingRequest) return null;

    return parseSessionRequest(
      {
        id: wc.pendingRequest.id,
        topic: wc.pendingRequest.topic,
        params: wc.pendingRequest.params,
      },
      wc.pendingRequest.peerMeta
    );
  }, [wc.pendingRequest]);

  // Connect to dApp with URI
  const connect = useCallback(async (uri: string) => {
    await wc.connect(uri);
  }, [wc]);

  // Approve session proposal with current wallet
  const approveProposal = useCallback(async (selectedChainIds?: number[]) => {
    if (!walletAddress) {
      throw new Error('No wallet address');
    }

    const chainIds = selectedChainIds || supportedChainIds;
    await wc.approveProposal(walletAddress, chainIds);
  }, [wc, walletAddress, supportedChainIds]);

  // Handle and sign a request with PIN
  const signAndApproveRequest = useCallback(async (pin: string) => {
    if (!wc.pendingRequest || !parsedRequest) {
      throw new Error('No pending request');
    }

    // Get private key with PIN
    const privateKey = await getPrivateKey(pin);
    if (!privateKey) {
      throw new Error('Invalid PIN');
    }

    let result: string;
    const { method } = wc.pendingRequest.params.request;

    switch (parsedRequest.type) {
      case 'message': {
        if (method === 'personal_sign') {
          // personal_sign expects UTF-8 message
          result = await signMessage(parsedRequest.message || '', privateKey);
        } else {
          // eth_sign uses hex message
          result = await signMessageHex(parsedRequest.messageHex || '', privateKey);
        }
        break;
      }

      case 'typedData': {
        if (!parsedRequest.typedData) {
          throw new Error('Invalid typed data');
        }
        result = await signTypedData(parsedRequest.typedData, privateKey);
        break;
      }

      case 'transaction': {
        if (!parsedRequest.transaction) {
          throw new Error('Invalid transaction');
        }

        // Get provider for the request's chain
        const chainId = parsedRequest.chainId;
        const provider = await getProviderForChainId(chainId);

        if (method === 'eth_sendTransaction') {
          result = await sendTransaction(parsedRequest.transaction, privateKey, provider);
        } else {
          // eth_signTransaction
          result = await signTransaction(parsedRequest.transaction, privateKey, provider);
        }
        break;
      }

      default:
        throw new Error(`Unsupported request type: ${parsedRequest.type}`);
    }

    await wc.approveRequest(result);
  }, [wc, parsedRequest, getPrivateKey]);

  return {
    // State
    isInitialized: wc.isInitialized,
    isInitializing: wc.isInitializing,
    sessions: wc.sessions,
    pendingProposal: wc.pendingProposal,
    pendingRequest: wc.pendingRequest,
    parsedRequest,
    supportedChainIds,

    // Actions
    initialize: wc.initialize,
    connect,
    approveProposal,
    rejectProposal: wc.rejectProposal,
    signAndApproveRequest,
    rejectRequest: wc.rejectRequest,
    disconnect: wc.disconnect,
    disconnectAll: wc.disconnectAll,

    // Helpers
    getNetworkNameForChainId,
  };
}

// Alchemy network names for RPC URLs
const ALCHEMY_NETWORK_NAMES: Record<number, string> = {
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

/**
 * Get provider for a specific chain ID
 */
function getProviderForChainId(chainId: number): JsonRpcProvider {
  const networkName = ALCHEMY_NETWORK_NAMES[chainId];
  if (!networkName) {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }

  const rpcUrl = `https://${networkName}.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;
  return new JsonRpcProvider(rpcUrl);
}

/**
 * Hook for displaying proposal information
 */
export function useProposalInfo() {
  const { pendingProposal, supportedChainIds } = useWalletConnect();

  return useMemo(() => {
    if (!pendingProposal) return null;

    const { proposer, requiredNamespaces, optionalNamespaces } = pendingProposal.params;

    // Get requested chains
    const requiredChains = requiredNamespaces?.eip155?.chains || [];
    const optionalChains = optionalNamespaces?.eip155?.chains || [];

    const requestedChainIds = [...requiredChains, ...optionalChains].map(wcChain => {
      try {
        return fromWCChainId(wcChain);
      } catch {
        return null;
      }
    }).filter((id): id is number => id !== null);

    // Filter to only supported chains
    const supportedRequestedChainIds = requestedChainIds.filter(id =>
      supportedChainIds.includes(id)
    );

    // Get requested methods
    const requestedMethods = [
      ...(requiredNamespaces?.eip155?.methods || []),
      ...(optionalNamespaces?.eip155?.methods || []),
    ];

    return {
      dAppName: proposer.metadata.name,
      dAppUrl: proposer.metadata.url,
      dAppDescription: proposer.metadata.description,
      dAppIcon: proposer.metadata.icons[0],
      requestedChainIds: supportedRequestedChainIds.length > 0
        ? supportedRequestedChainIds
        : supportedChainIds,
      requestedMethods: [...new Set(requestedMethods)],
    };
  }, [pendingProposal, supportedChainIds]);
}

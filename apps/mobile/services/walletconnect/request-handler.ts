import { Wallet, JsonRpcProvider } from 'ethers';
import { getSdkError } from '@walletconnect/utils';
import { getSignClient } from './sign-client';
import { fromWCChainId } from './chain-utils';
import type {
  WCSessionRequest,
  WCParsedRequest,
  WCTransactionRequest,
  WCTypedDataRequest,
  WCRequestType,
} from '@/types/walletconnect';

// Simplified event type for parsing
interface SessionRequestEvent {
  id: number;
  topic: string;
  params: {
    request: {
      method: string;
      params: unknown;
    };
    chainId: string;
  };
}

/**
 * Parse a session request into a more usable format
 */
export function parseSessionRequest(
  event: SessionRequestEvent,
  peerMeta: WCSessionRequest['peerMeta']
): WCParsedRequest {
  const { method, params } = event.params.request;
  const chainId = fromWCChainId(event.params.chainId);

  const result: WCParsedRequest = {
    type: 'unknown',
    method,
    chainId,
  };

  switch (method) {
    case 'eth_sendTransaction':
    case 'eth_signTransaction': {
      const txParams = (params as WCTransactionRequest[])[0];
      result.type = 'transaction';
      result.transaction = txParams;
      break;
    }

    case 'personal_sign': {
      // personal_sign params: [message, address]
      const [messageHex, _address] = params as [string, string];
      result.type = 'message';
      result.messageHex = messageHex;
      result.message = hexToUtf8(messageHex);
      break;
    }

    case 'eth_sign': {
      // eth_sign params: [address, message]
      const [_addr, msgHex] = params as [string, string];
      result.type = 'message';
      result.messageHex = msgHex;
      result.message = hexToUtf8(msgHex);
      break;
    }

    case 'eth_signTypedData':
    case 'eth_signTypedData_v4': {
      // params: [address, typedDataJSON]
      const [_address, typedDataJson] = params as [string, string];
      try {
        const typedData = JSON.parse(typedDataJson) as WCTypedDataRequest;
        result.type = 'typedData';
        result.typedData = typedData;
      } catch {
        console.error('[WalletConnect] Failed to parse typed data');
      }
      break;
    }

    default:
      result.type = 'unknown';
  }

  return result;
}

/**
 * Convert hex string to UTF-8
 */
function hexToUtf8(hex: string): string {
  try {
    // Remove 0x prefix if present
    const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
    // Convert hex to bytes
    const bytes = new Uint8Array(
      cleanHex.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []
    );
    // Decode as UTF-8
    return new TextDecoder().decode(bytes);
  } catch {
    return hex; // Return original if decoding fails
  }
}

/**
 * Sign a message (personal_sign)
 */
export async function signMessage(message: string, privateKey: string): Promise<string> {
  const wallet = new Wallet(privateKey);
  // personal_sign expects the raw message, ethers will prefix it
  return wallet.signMessage(message);
}

/**
 * Sign a message from hex (eth_sign style)
 */
export async function signMessageHex(messageHex: string, privateKey: string): Promise<string> {
  const wallet = new Wallet(privateKey);
  const message = hexToUtf8(messageHex);
  return wallet.signMessage(message);
}

/**
 * Sign typed data (EIP-712)
 */
export async function signTypedData(
  typedData: WCTypedDataRequest,
  privateKey: string
): Promise<string> {
  const wallet = new Wallet(privateKey);

  // Remove EIP712Domain from types if present (ethers handles it automatically)
  const types = { ...typedData.types };
  delete types.EIP712Domain;

  return wallet.signTypedData(typedData.domain, types, typedData.message);
}

/**
 * Send a transaction
 */
export async function sendTransaction(
  txParams: WCTransactionRequest,
  privateKey: string,
  provider: JsonRpcProvider
): Promise<string> {
  const wallet = new Wallet(privateKey, provider);

  // Build transaction object
  const tx: {
    to: string;
    data?: string;
    value?: bigint;
    gasLimit?: bigint;
    gasPrice?: bigint;
    maxFeePerGas?: bigint;
    maxPriorityFeePerGas?: bigint;
    nonce?: number;
  } = {
    to: txParams.to,
  };

  if (txParams.data) {
    tx.data = txParams.data;
  }

  if (txParams.value) {
    tx.value = BigInt(txParams.value);
  }

  if (txParams.gas) {
    tx.gasLimit = BigInt(txParams.gas);
  }

  if (txParams.gasPrice) {
    tx.gasPrice = BigInt(txParams.gasPrice);
  }

  if (txParams.maxFeePerGas) {
    tx.maxFeePerGas = BigInt(txParams.maxFeePerGas);
  }

  if (txParams.maxPriorityFeePerGas) {
    tx.maxPriorityFeePerGas = BigInt(txParams.maxPriorityFeePerGas);
  }

  if (txParams.nonce) {
    tx.nonce = parseInt(txParams.nonce, 16);
  }

  // Send transaction
  const response = await wallet.sendTransaction(tx);
  return response.hash;
}

/**
 * Sign a transaction without sending
 */
export async function signTransaction(
  txParams: WCTransactionRequest,
  privateKey: string,
  provider: JsonRpcProvider
): Promise<string> {
  const wallet = new Wallet(privateKey, provider);

  // Build transaction object
  const tx: {
    to: string;
    data?: string;
    value?: bigint;
    gasLimit?: bigint;
    gasPrice?: bigint;
    maxFeePerGas?: bigint;
    maxPriorityFeePerGas?: bigint;
    nonce?: number;
    chainId?: number;
  } = {
    to: txParams.to,
  };

  if (txParams.data) {
    tx.data = txParams.data;
  }

  if (txParams.value) {
    tx.value = BigInt(txParams.value);
  }

  if (txParams.gas) {
    tx.gasLimit = BigInt(txParams.gas);
  }

  if (txParams.gasPrice) {
    tx.gasPrice = BigInt(txParams.gasPrice);
  }

  if (txParams.maxFeePerGas) {
    tx.maxFeePerGas = BigInt(txParams.maxFeePerGas);
  }

  if (txParams.maxPriorityFeePerGas) {
    tx.maxPriorityFeePerGas = BigInt(txParams.maxPriorityFeePerGas);
  }

  if (txParams.nonce) {
    tx.nonce = parseInt(txParams.nonce, 16);
  }

  // Get chain ID from provider
  const network = await provider.getNetwork();
  tx.chainId = Number(network.chainId);

  // Sign without sending
  return wallet.signTransaction(tx);
}

/**
 * Respond to a session request with a result
 */
export async function respondToRequest(
  topic: string,
  requestId: number,
  result: string
): Promise<void> {
  const signClient = getSignClient();

  await signClient.respond({
    topic,
    response: {
      id: requestId,
      jsonrpc: '2.0',
      result,
    },
  });

  console.log('[WalletConnect] Responded to request:', requestId);
}

/**
 * Reject a session request with an error
 */
export async function rejectRequest(
  topic: string,
  requestId: number,
  message?: string
): Promise<void> {
  const signClient = getSignClient();

  const error = message
    ? { code: 4001, message }
    : getSdkError('USER_REJECTED_METHODS');

  await signClient.respond({
    topic,
    response: {
      id: requestId,
      jsonrpc: '2.0',
      error,
    },
  });

  console.log('[WalletConnect] Rejected request:', requestId);
}

/**
 * Get the request type for display
 */
export function getRequestTypeLabel(type: WCRequestType): string {
  switch (type) {
    case 'transaction':
      return 'Transaction';
    case 'message':
      return 'Sign Message';
    case 'typedData':
      return 'Sign Typed Data';
    default:
      return 'Request';
  }
}

/**
 * Format transaction value for display
 */
export function formatTransactionValue(value?: string): string {
  if (!value || value === '0x0' || value === '0') {
    return '0';
  }

  try {
    const wei = BigInt(value);
    const eth = Number(wei) / 1e18;
    return eth.toFixed(6);
  } catch {
    return value;
  }
}

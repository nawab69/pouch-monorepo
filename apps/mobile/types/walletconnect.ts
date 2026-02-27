import type { SessionTypes, SignClientTypes, ProposalTypes } from '@walletconnect/types';

// Session representation for UI
export interface WCSession {
  topic: string;
  peerMeta: {
    name: string;
    description: string;
    url: string;
    icons: string[];
  };
  namespaces: SessionTypes.Namespaces;
  expiry: number;
  acknowledged: boolean;
}

// Session proposal from dApp
export interface WCSessionProposal {
  id: number;
  params: SignClientTypes.EventArguments['session_proposal']['params'];
}

// Request from dApp (sign tx, sign message, etc.)
export interface WCSessionRequest {
  id: number;
  topic: string;
  params: {
    request: {
      method: string;
      params: unknown;
    };
    chainId: string;
  };
  peerMeta: WCSession['peerMeta'];
}

// Transaction request parameters
export interface WCTransactionRequest {
  from: string;
  to: string;
  data?: string;
  value?: string;
  gas?: string;
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  nonce?: string;
}

// Typed data domain
export interface WCTypedDataDomain {
  name?: string;
  version?: string;
  chainId?: number;
  verifyingContract?: string;
  salt?: string;
}

// Typed data request (EIP-712)
export interface WCTypedDataRequest {
  domain: WCTypedDataDomain;
  types: Record<string, Array<{ name: string; type: string }>>;
  primaryType: string;
  message: Record<string, unknown>;
}

// Supported RPC methods
export type WCSupportedMethod =
  | 'eth_sendTransaction'
  | 'eth_signTransaction'
  | 'personal_sign'
  | 'eth_sign'
  | 'eth_signTypedData'
  | 'eth_signTypedData_v4'
  | 'wallet_switchEthereumChain'
  | 'wallet_addEthereumChain';

// Request types for UI
export type WCRequestType = 'transaction' | 'message' | 'typedData' | 'unknown';

// Parsed request for UI display
export interface WCParsedRequest {
  type: WCRequestType;
  method: string;
  chainId: number;
  // Transaction-specific
  transaction?: WCTransactionRequest;
  // Message-specific
  message?: string;
  messageHex?: string;
  // Typed data specific
  typedData?: WCTypedDataRequest;
}

// Context state
export interface WalletConnectState {
  isInitialized: boolean;
  isInitializing: boolean;
  sessions: WCSession[];
  pendingProposal: WCSessionProposal | null;
  pendingRequest: WCSessionRequest | null;
}

// Context actions
export interface WalletConnectActions {
  initialize: () => Promise<void>;
  connect: (uri: string) => Promise<void>;
  approveProposal: (address: string, chainIds: number[]) => Promise<void>;
  rejectProposal: () => Promise<void>;
  approveRequest: (result: string) => Promise<void>;
  rejectRequest: (message?: string) => Promise<void>;
  disconnect: (topic: string) => Promise<void>;
  disconnectAll: () => Promise<void>;
}

// Full context type
export interface WalletConnectContextType extends WalletConnectState, WalletConnectActions {}

// Namespace builder helper
export interface NamespaceConfig {
  chains: string[];
  accounts: string[];
  methods: string[];
  events: string[];
}

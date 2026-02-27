import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import type { SignClientTypes } from '@walletconnect/types';
import {
  initializeSignClient,
  getSignClient,
  isSignClientInitialized,
} from '@/services/walletconnect/sign-client';
import {
  pairWithUri,
  approveSession,
  rejectSession,
  disconnectSession,
  getAllWCSessions,
  toWCSession,
  getSession,
} from '@/services/walletconnect/session-service';
import {
  respondToRequest,
  rejectRequest,
} from '@/services/walletconnect/request-handler';
import type {
  WalletConnectContextType,
  WCSession,
  WCSessionProposal,
  WCSessionRequest,
} from '@/types/walletconnect';

const WalletConnectContext = createContext<WalletConnectContextType | null>(null);

interface WalletConnectProviderProps {
  children: ReactNode;
}

export function WalletConnectProvider({ children }: WalletConnectProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [sessions, setSessions] = useState<WCSession[]>([]);
  const [pendingProposal, setPendingProposal] = useState<WCSessionProposal | null>(null);
  const [pendingRequest, setPendingRequest] = useState<WCSessionRequest | null>(null);

  // Track if event listeners are set up
  const listenersSetUp = useRef(false);

  // Refresh sessions from SignClient
  const refreshSessions = useCallback(() => {
    if (isSignClientInitialized()) {
      const currentSessions = getAllWCSessions();
      setSessions(currentSessions);
    }
  }, []);

  // Set up event listeners
  const setupEventListeners = useCallback(() => {
    if (listenersSetUp.current) return;

    const signClient = getSignClient();
    listenersSetUp.current = true;

    // Session proposal from dApp
    signClient.on('session_proposal', (event) => {
      console.log('[WalletConnect] Session proposal received:', event.id);
      setPendingProposal({
        id: event.id,
        params: event.params,
      });
    });

    // Session request from dApp (sign tx, sign message, etc.)
    signClient.on('session_request', (event) => {
      console.log('[WalletConnect] Session request received:', event.id, event.params.request.method);

      // Get session info for peer metadata
      const session = getSession(event.topic);
      if (!session) {
        console.error('[WalletConnect] Session not found for request:', event.topic);
        return;
      }

      setPendingRequest({
        id: event.id,
        topic: event.topic,
        params: event.params,
        peerMeta: {
          name: session.peer.metadata.name,
          description: session.peer.metadata.description,
          url: session.peer.metadata.url,
          icons: session.peer.metadata.icons,
        },
      });
    });

    // Session deleted by dApp
    signClient.on('session_delete', (event) => {
      console.log('[WalletConnect] Session deleted:', event.topic);
      refreshSessions();
    });

    // Session event (chainChanged, accountsChanged)
    signClient.on('session_event', (event) => {
      console.log('[WalletConnect] Session event:', event);
    });

    // Session update
    signClient.on('session_update', (event) => {
      console.log('[WalletConnect] Session updated:', event.topic);
      refreshSessions();
    });

    // Session expiry
    signClient.on('session_expire', (event) => {
      console.log('[WalletConnect] Session expired:', event.topic);
      refreshSessions();
    });

    console.log('[WalletConnect] Event listeners set up');
  }, [refreshSessions]);

  // Store initialization promise for awaiting
  const initPromiseRef = useRef<Promise<void> | null>(null);

  // Initialize SignClient
  const initialize = useCallback(async () => {
    // Return existing promise if initialization is in progress
    if (initPromiseRef.current) {
      return initPromiseRef.current;
    }

    // Already initialized
    if (isSignClientInitialized()) {
      setIsInitialized(true);
      return;
    }

    setIsInitializing(true);

    initPromiseRef.current = (async () => {
      try {
        await initializeSignClient();
        setupEventListeners();
        refreshSessions();
        setIsInitialized(true);
        console.log('[WalletConnect] Initialized successfully');
      } catch (error) {
        console.error('[WalletConnect] Initialization failed:', error);
        initPromiseRef.current = null;
        throw error;
      } finally {
        setIsInitializing(false);
      }
    })();

    return initPromiseRef.current;
  }, [setupEventListeners, refreshSessions]);

  // Connect to dApp using WC URI
  const connect = useCallback(async (uri: string) => {
    // Ensure initialization is complete before connecting
    if (!isSignClientInitialized()) {
      console.log('[WalletConnect] Waiting for initialization before connect...');
      await initialize();
    }
    await pairWithUri(uri);
  }, [initialize]);

  // Approve a session proposal
  const handleApproveProposal = useCallback(async (address: string, chainIds: number[]) => {
    if (!pendingProposal) {
      throw new Error('No pending proposal');
    }

    const { requiredNamespaces, optionalNamespaces } = pendingProposal.params;

    await approveSession(
      pendingProposal.id,
      address,
      chainIds,
      requiredNamespaces,
      optionalNamespaces
    );

    setPendingProposal(null);
    refreshSessions();
  }, [pendingProposal, refreshSessions]);

  // Reject a session proposal (or just clear if already handled)
  const handleRejectProposal = useCallback(async () => {
    if (!pendingProposal) {
      // Already handled, just return silently
      return;
    }

    try {
      await rejectSession(pendingProposal.id);
    } catch (error) {
      // Ignore "record deleted" errors - proposal was already handled
      const message = error instanceof Error ? error.message : '';
      if (!message.includes('deleted')) {
        console.error('[WalletConnect] Failed to reject proposal:', error);
      }
    }
    setPendingProposal(null);
  }, [pendingProposal]);

  // Approve a request
  const handleApproveRequest = useCallback(async (result: string) => {
    if (!pendingRequest) {
      throw new Error('No pending request');
    }

    await respondToRequest(pendingRequest.topic, pendingRequest.id, result);
    setPendingRequest(null);
  }, [pendingRequest]);

  // Reject a request (or just clear if already handled)
  const handleRejectRequest = useCallback(async (message?: string) => {
    if (!pendingRequest) {
      // Already handled, just return silently
      return;
    }

    try {
      await rejectRequest(pendingRequest.topic, pendingRequest.id, message);
    } catch (error) {
      // Ignore "record deleted" errors - request was already handled
      const errorMessage = error instanceof Error ? error.message : '';
      if (!errorMessage.includes('deleted')) {
        console.error('[WalletConnect] Failed to reject request:', error);
      }
    }
    setPendingRequest(null);
  }, [pendingRequest]);

  // Disconnect a session
  const disconnect = useCallback(async (topic: string) => {
    await disconnectSession(topic);
    refreshSessions();
  }, [refreshSessions]);

  // Disconnect all sessions
  const disconnectAll = useCallback(async () => {
    for (const session of sessions) {
      try {
        await disconnectSession(session.topic);
      } catch (error) {
        console.error('[WalletConnect] Failed to disconnect session:', session.topic, error);
      }
    }
    refreshSessions();
  }, [sessions, refreshSessions]);

  // Initialize on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  const value: WalletConnectContextType = {
    isInitialized,
    isInitializing,
    sessions,
    pendingProposal,
    pendingRequest,
    initialize,
    connect,
    approveProposal: handleApproveProposal,
    rejectProposal: handleRejectProposal,
    approveRequest: handleApproveRequest,
    rejectRequest: handleRejectRequest,
    disconnect,
    disconnectAll,
  };

  return (
    <WalletConnectContext.Provider value={value}>
      {children}
    </WalletConnectContext.Provider>
  );
}

export function useWalletConnectContext(): WalletConnectContextType {
  const context = useContext(WalletConnectContext);
  if (!context) {
    throw new Error('useWalletConnectContext must be used within a WalletConnectProvider');
  }
  return context;
}

import { useCallback } from 'react';
import { useWalletConnect } from '@/hooks/use-walletconnect';
import { ProposalModal } from './proposal-modal';
import { RequestModal } from './request-modal';

/**
 * Global WalletConnect modals that render throughout the app.
 * This component should be rendered inside the WalletConnectProvider.
 */
export function WalletConnectGlobalModals() {
  const {
    pendingProposal,
    pendingRequest,
    rejectProposal,
    rejectRequest,
  } = useWalletConnect();

  const handleProposalClose = useCallback(async () => {
    try {
      await rejectProposal();
    } catch (_error) {
      // Silently ignore - proposal may have been approved already
    }
  }, [rejectProposal]);

  const handleRequestClose = useCallback(async () => {
    try {
      await rejectRequest('User cancelled');
    } catch (_error) {
      // Silently ignore - request may have been handled already
    }
  }, [rejectRequest]);

  return (
    <>
      <ProposalModal
        visible={!!pendingProposal}
        onClose={handleProposalClose}
      />
      <RequestModal
        visible={!!pendingRequest}
        onClose={handleRequestClose}
      />
    </>
  );
}

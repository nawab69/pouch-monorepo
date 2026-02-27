import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Token, NetworkId, NetworkType } from '@/types/blockchain';
import {
  SwapQuote,
  SwapResult,
  ApprovalResult,
  SlippageValue,
} from '@/services/swap/swap-types';
import {
  getSwapQuote,
  needsApproval,
  approveToken,
  executeSwap,
  isSwapSupported,
  getApprovalSpender,
} from '@/services/swap';
import {
  DEFAULT_SLIPPAGE,
  QUOTE_DEBOUNCE_DELAY,
} from '@/constants/swap';

interface UseSwapOptions {
  address: string | null;
  networkId: NetworkId;
  networkType: NetworkType;
  getPrivateKey: () => Promise<string | null>;
}

interface UseSwapReturn {
  // Token state
  sellToken: Token | null;
  buyToken: Token | null;
  setSellToken: (token: Token | null) => void;
  setBuyToken: (token: Token | null) => void;
  swapTokens: () => void;

  // Amount state
  sellAmount: string;
  setSellAmount: (amount: string) => void;
  buyAmount: string;

  // Slippage
  slippage: SlippageValue;
  setSlippage: (slippage: SlippageValue) => void;

  // Quote
  quote: SwapQuote | null;
  isQuoteLoading: boolean;
  isQuoteStale: boolean;
  refreshQuote: () => Promise<void>;

  // Approval
  needsTokenApproval: boolean;
  isApproving: boolean;
  approve: () => Promise<ApprovalResult | null>;

  // Swap execution
  isSwapping: boolean;
  swap: () => Promise<SwapResult | null>;

  // Error state
  error: string | null;
  clearError: () => void;

  // Validation
  isValid: boolean;
  validationError: string | null;

  // Network support
  isSupported: boolean;
}

export function useSwap({
  address,
  networkId,
  networkType,
  getPrivateKey,
}: UseSwapOptions): UseSwapReturn {
  console.log('[useSwap] Hook initialized with:', { address: address?.slice(0, 10), networkId, networkType });

  // Token state
  const [sellToken, setSellToken] = useState<Token | null>(null);
  const [buyToken, setBuyToken] = useState<Token | null>(null);

  // Amount state
  const [sellAmount, setSellAmountState] = useState('');
  const [buyAmount, setBuyAmount] = useState('');

  // Slippage state
  const [slippage, setSlippage] = useState<SlippageValue>(DEFAULT_SLIPPAGE);

  // Quote state
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [isQuoteLoading, setIsQuoteLoading] = useState(false);
  const [isQuoteStale, setIsQuoteStale] = useState(false);

  // Approval state
  const [needsTokenApproval, setNeedsTokenApproval] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  // Swap state
  const [isSwapping, setIsSwapping] = useState(false);

  // Error state
  const [error, setError] = useState<string | null>(null);

  // Debounce timer ref
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const quoteAbortControllerRef = useRef<AbortController | null>(null);
  const fetchQuoteRef = useRef<() => Promise<void>>(() => Promise.resolve());

  // Check if swaps are supported on this network
  const isSupported = useMemo(
    () => isSwapSupported(networkId, networkType),
    [networkId, networkType]
  );

  // Validate inputs
  const validation = useMemo(() => {
    console.log('[useSwap] Validation check:', {
      sellToken: sellToken?.symbol,
      buyToken: buyToken?.symbol,
      sellAmount,
      address: address?.slice(0, 10),
      isSupported,
    });

    if (!sellToken) {
      return { isValid: false, error: 'Select a token to sell' };
    }
    if (!buyToken) {
      return { isValid: false, error: 'Select a token to buy' };
    }
    if (sellToken.contractAddress === buyToken.contractAddress && sellToken.isNative === buyToken.isNative) {
      return { isValid: false, error: 'Cannot swap same token' };
    }
    if (!sellAmount || parseFloat(sellAmount) <= 0) {
      return { isValid: false, error: 'Enter an amount' };
    }

    const sellBalance = parseFloat(sellToken.balanceFormatted) || 0;
    const sellAmountNum = parseFloat(sellAmount) || 0;

    if (sellAmountNum > sellBalance) {
      return { isValid: false, error: 'Insufficient balance' };
    }
    if (!isSupported) {
      return { isValid: false, error: 'Swaps not available on this network' };
    }
    if (!address) {
      return { isValid: false, error: 'Wallet not connected' };
    }

    console.log('[useSwap] Validation passed!');
    return { isValid: true, error: null };
  }, [sellToken, buyToken, sellAmount, address, isSupported]);

  // Fetch quote
  const fetchQuote = useCallback(async () => {
    console.log('[useSwap] fetchQuote called:', {
      validationIsValid: validation.isValid,
      validationError: validation.error,
      sellToken: sellToken?.symbol,
      buyToken: buyToken?.symbol,
      sellAmount,
      address: address?.slice(0, 10),
    });

    if (!validation.isValid || !sellToken || !buyToken || !address) {
      console.log('[useSwap] fetchQuote: validation failed, returning early');
      setQuote(null);
      setBuyAmount('');
      return;
    }

    // Cancel previous request
    if (quoteAbortControllerRef.current) {
      quoteAbortControllerRef.current.abort();
    }
    quoteAbortControllerRef.current = new AbortController();

    setIsQuoteLoading(true);
    setError(null);
    setIsQuoteStale(false);

    try {
      console.log('[useSwap] Calling getSwapQuote...');
      const newQuote = await getSwapQuote({
        sellToken,
        buyToken,
        sellAmount,
        slippagePercentage: slippage,
        takerAddress: address,
        networkId,
        networkType,
      });

      console.log('[useSwap] Quote received:', newQuote.buyAmountFormatted);
      setQuote(newQuote);
      setBuyAmount(newQuote.buyAmountFormatted);

      // Check if approval is needed
      const requiresApproval = await needsApproval(newQuote, address, networkId, networkType);
      setNeedsTokenApproval(requiresApproval);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return; // Ignore aborted requests
      }

      console.error('[useSwap] Error fetching quote:', err);
      setError(err instanceof Error ? err.message : 'Failed to get quote');
      setQuote(null);
      setBuyAmount('');
    } finally {
      setIsQuoteLoading(false);
    }
  }, [validation.isValid, sellToken, buyToken, sellAmount, slippage, address, networkId, networkType]);

  // Keep fetchQuote ref updated with latest function
  useEffect(() => {
    fetchQuoteRef.current = fetchQuote;
  }, [fetchQuote]);

  // Fetch quote when tokens change (if amount is already entered)
  useEffect(() => {
    if (sellToken && buyToken && sellAmount && parseFloat(sellAmount) > 0) {
      console.log('[useSwap] Token changed, triggering quote fetch');
      // Clear existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      // Debounce the fetch
      debounceTimerRef.current = setTimeout(() => {
        console.log('[useSwap] Token change debounce fired');
        fetchQuoteRef.current();
      }, QUOTE_DEBOUNCE_DELAY);
    }
  }, [sellToken, buyToken]); // Only trigger on token changes

  // Debounced quote fetch when sell amount changes
  const setSellAmount = useCallback((amount: string) => {
    console.log('[useSwap] setSellAmount:', amount);
    setSellAmountState(amount);
    setIsQuoteStale(true);

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Don't fetch for empty or invalid amounts
    if (!amount || parseFloat(amount) <= 0) {
      console.log('[useSwap] setSellAmount: empty/invalid amount, skipping fetch');
      setQuote(null);
      setBuyAmount('');
      setIsQuoteStale(false);
      return;
    }

    // Set new debounce timer - use ref to get latest fetchQuote
    console.log('[useSwap] setSellAmount: setting debounce timer for fetchQuote');
    debounceTimerRef.current = setTimeout(() => {
      console.log('[useSwap] Debounce timer fired, calling fetchQuote');
      fetchQuoteRef.current();
    }, QUOTE_DEBOUNCE_DELAY);
  }, []); // No dependencies - uses ref for latest fetchQuote

  // Refresh quote immediately
  const refreshQuote = useCallback(async () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    await fetchQuote();
  }, [fetchQuote]);

  // Swap sell and buy tokens
  const swapTokens = useCallback(() => {
    const prevSellToken = sellToken;
    const prevBuyToken = buyToken;
    const prevBuyAmount = buyAmount;

    setSellToken(prevBuyToken);
    setBuyToken(prevSellToken);
    setSellAmountState(prevBuyAmount);
    setQuote(null);
    setBuyAmount('');
    setIsQuoteStale(true);

    // Fetch new quote after swap
    if (prevBuyToken && prevSellToken && prevBuyAmount && parseFloat(prevBuyAmount) > 0) {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        fetchQuote();
      }, QUOTE_DEBOUNCE_DELAY);
    }
  }, [sellToken, buyToken, buyAmount, fetchQuote]);

  // Approve token for swap
  const approve = useCallback(async (): Promise<ApprovalResult | null> => {
    if (!sellToken || sellToken.isNative) {
      setError('Cannot approve native token');
      return null;
    }

    setIsApproving(true);
    setError(null);

    try {
      const privateKey = await getPrivateKey();
      if (!privateKey) {
        throw new Error('Unable to access wallet');
      }

      // Get the correct spender based on network type (Permit2 for mainnet, Uniswap Router for testnet)
      const spender = getApprovalSpender(networkId, networkType);

      const result = await approveToken(
        privateKey,
        sellToken,
        spender,
        networkId,
        networkType
      );

      // Approval successful, no longer needs approval
      setNeedsTokenApproval(false);

      return result;
    } catch (err) {
      console.error('Error approving token:', err);
      setError(err instanceof Error ? err.message : 'Failed to approve token');
      return null;
    } finally {
      setIsApproving(false);
    }
  }, [sellToken, networkId, networkType, getPrivateKey]);

  // Execute swap
  const swap = useCallback(async (): Promise<SwapResult | null> => {
    if (!quote) {
      setError('No quote available');
      return null;
    }

    if (needsTokenApproval) {
      setError('Token approval required');
      return null;
    }

    setIsSwapping(true);
    setError(null);

    try {
      const privateKey = await getPrivateKey();
      if (!privateKey) {
        throw new Error('Unable to access wallet');
      }

      const result = await executeSwap({
        quote,
        privateKey,
        networkId,
        networkType,
      });

      // Reset state after successful swap
      setSellAmountState('');
      setBuyAmount('');
      setQuote(null);

      return result;
    } catch (err) {
      console.error('Error executing swap:', err);
      setError(err instanceof Error ? err.message : 'Failed to execute swap');
      return null;
    } finally {
      setIsSwapping(false);
    }
  }, [quote, needsTokenApproval, networkId, networkType, getPrivateKey]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Mark quote as stale after expiry
  useEffect(() => {
    if (!quote) return;

    const timeUntilExpiry = quote.expiresAt - Date.now();
    if (timeUntilExpiry <= 0) {
      setIsQuoteStale(true);
      return;
    }

    const timer = setTimeout(() => {
      setIsQuoteStale(true);
    }, timeUntilExpiry);

    return () => clearTimeout(timer);
  }, [quote]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (quoteAbortControllerRef.current) {
        quoteAbortControllerRef.current.abort();
      }
    };
  }, []);

  // Reset when network changes
  useEffect(() => {
    setSellToken(null);
    setBuyToken(null);
    setSellAmountState('');
    setBuyAmount('');
    setQuote(null);
    setError(null);
  }, [networkId, networkType]);

  return {
    // Token state
    sellToken,
    buyToken,
    setSellToken,
    setBuyToken,
    swapTokens,

    // Amount state
    sellAmount,
    setSellAmount,
    buyAmount,

    // Slippage
    slippage,
    setSlippage,

    // Quote
    quote,
    isQuoteLoading,
    isQuoteStale,
    refreshQuote,

    // Approval
    needsTokenApproval,
    isApproving,
    approve,

    // Swap execution
    isSwapping,
    swap,

    // Error state
    error,
    clearError,

    // Validation
    isValid: validation.isValid,
    validationError: validation.error,

    // Network support
    isSupported,
  };
}

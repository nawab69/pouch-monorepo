import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NetworkId, NetworkType, Network } from '@/types/blockchain';
import { NETWORKS, DEFAULT_NETWORK_ID, DEFAULT_NETWORK_TYPE, getChainId } from '@/constants/networks';

const NETWORK_ID_KEY = '@pouch/network_id';
const NETWORK_TYPE_KEY = '@pouch/network_type';

interface NetworkContextType {
  selectedNetworkId: NetworkId;
  selectedNetwork: Network;
  networkType: NetworkType;
  chainId: number;
  isTestnet: boolean;
  isLoading: boolean;
  changeNetwork: (networkId: NetworkId) => Promise<void>;
  toggleNetworkType: () => Promise<void>;
  setNetworkType: (type: NetworkType) => Promise<void>;
}

const NetworkContext = createContext<NetworkContextType | null>(null);

export function NetworkProvider({ children }: { children: ReactNode }) {
  const [selectedNetworkId, setSelectedNetworkId] = useState<NetworkId>(DEFAULT_NETWORK_ID);
  const [networkType, setNetworkTypeState] = useState<NetworkType>(DEFAULT_NETWORK_TYPE);
  const [isLoading, setIsLoading] = useState(true);

  // Derived values
  const selectedNetwork: Network = NETWORKS[selectedNetworkId];
  const chainId = getChainId(selectedNetworkId, networkType);
  const isTestnet = networkType === 'testnet';

  useEffect(() => {
    loadNetworkSettings();
  }, []);

  const loadNetworkSettings = async () => {
    try {
      const [savedNetworkId, savedNetworkType] = await Promise.all([
        AsyncStorage.getItem(NETWORK_ID_KEY),
        AsyncStorage.getItem(NETWORK_TYPE_KEY),
      ]);

      if (savedNetworkId && savedNetworkId in NETWORKS) {
        setSelectedNetworkId(savedNetworkId as NetworkId);
      }

      if (savedNetworkType === 'mainnet' || savedNetworkType === 'testnet') {
        setNetworkTypeState(savedNetworkType);
      }
    } catch (error) {
      console.warn('Error loading network settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const changeNetwork = useCallback(async (networkId: NetworkId) => {
    try {
      await AsyncStorage.setItem(NETWORK_ID_KEY, networkId);
      setSelectedNetworkId(networkId);
    } catch (error) {
      console.warn('Error saving network:', error);
    }
  }, []);

  const toggleNetworkType = useCallback(async () => {
    try {
      const newType: NetworkType = networkType === 'mainnet' ? 'testnet' : 'mainnet';
      await AsyncStorage.setItem(NETWORK_TYPE_KEY, newType);
      setNetworkTypeState(newType);
    } catch (error) {
      console.warn('Error saving network type:', error);
    }
  }, [networkType]);

  const setNetworkType = useCallback(async (type: NetworkType) => {
    try {
      await AsyncStorage.setItem(NETWORK_TYPE_KEY, type);
      setNetworkTypeState(type);
    } catch (error) {
      console.warn('Error saving network type:', error);
    }
  }, []);

  return (
    <NetworkContext.Provider
      value={{
        selectedNetworkId,
        selectedNetwork,
        networkType,
        chainId,
        isTestnet,
        isLoading,
        changeNetwork,
        toggleNetworkType,
        setNetworkType,
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
}

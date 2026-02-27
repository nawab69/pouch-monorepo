import { useState } from 'react';
import { View, Text, Pressable, Modal } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { Network, NetworkId } from '@/types/blockchain';
import { NETWORK_LIST } from '@/constants/networks';

interface NetworkSelectorProps {
  selectedNetworkId: NetworkId;
  onSelect: (networkId: NetworkId) => void;
}

export function NetworkSelector({
  selectedNetworkId,
  onSelect,
}: NetworkSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedNetwork = NETWORK_LIST.find((n) => n.id === selectedNetworkId)!;

  const handleSelect = (networkId: NetworkId) => {
    onSelect(networkId);
    setIsOpen(false);
  };

  return (
    <>
      <Pressable
        onPress={() => setIsOpen(true)}
        className="flex-row items-center justify-between bg-wallet-card-light rounded-xl px-4 py-3.5 active:opacity-70"
      >
        <View className="flex-row items-center gap-3">
          <View
            className="w-8 h-8 rounded-full items-center justify-center"
            style={{ backgroundColor: `${selectedNetwork.color}20` }}
          >
            <View
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: selectedNetwork.color }}
            />
          </View>
          <Text className="text-wallet-text font-medium text-base">
            {selectedNetwork.name}
          </Text>
        </View>
        <Feather name="chevron-down" size={20} color="#8E8E93" />
      </Pressable>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable
          className="flex-1 bg-black/60 justify-end"
          onPress={() => setIsOpen(false)}
        >
          <Pressable
            className="bg-wallet-card rounded-t-3xl"
            onPress={(e) => e.stopPropagation()}
          >
            <View className="p-5">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-xl font-bold text-wallet-text">
                  Select Network
                </Text>
                <Pressable
                  onPress={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-full bg-wallet-card-light items-center justify-center"
                >
                  <Feather name="x" size={18} color="#8E8E93" />
                </Pressable>
              </View>

              <View className="gap-2">
                {NETWORK_LIST.map((network) => (
                  <NetworkOption
                    key={network.id}
                    network={network}
                    isSelected={network.id === selectedNetworkId}
                    onPress={() => handleSelect(network.id)}
                  />
                ))}
              </View>

              <View className="h-8" />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

interface NetworkOptionProps {
  network: Network;
  isSelected: boolean;
  onPress: () => void;
}

function NetworkOption({ network, isSelected, onPress }: NetworkOptionProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center justify-between p-4 rounded-xl active:opacity-70 ${
        isSelected ? 'bg-wallet-accent/10' : 'bg-wallet-card-light'
      }`}
    >
      <View className="flex-row items-center gap-3">
        <View
          className="w-10 h-10 rounded-full items-center justify-center"
          style={{ backgroundColor: `${network.color}20` }}
        >
          <View
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: network.color }}
          />
        </View>
        <View>
          <Text className="text-wallet-text font-medium text-base">
            {network.name}
          </Text>
          <Text className="text-wallet-text-secondary text-sm">
            {network.symbol}
          </Text>
        </View>
      </View>

      {isSelected && (
        <View className="w-6 h-6 rounded-full bg-wallet-accent items-center justify-center">
          <Feather name="check" size={14} color="#0A0A0A" />
        </View>
      )}
    </Pressable>
  );
}

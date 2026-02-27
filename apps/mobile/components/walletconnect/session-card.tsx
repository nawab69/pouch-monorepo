import { View, Text, Pressable } from 'react-native';
import { Image } from 'expo-image';
import Feather from '@expo/vector-icons/Feather';
import type { WCSession } from '@/types/walletconnect';
import { getNetworkNameForChainId, fromWCChainId } from '@/services/walletconnect/chain-utils';

interface SessionCardProps {
  session: WCSession;
  onDisconnect: () => void;
}

export function SessionCard({ session, onDisconnect }: SessionCardProps) {
  const { peerMeta, namespaces, expiry } = session;

  // Get connected chains
  const chains = namespaces?.eip155?.chains || [];
  const chainNames = chains.map(wcChain => {
    try {
      const chainId = fromWCChainId(wcChain);
      return getNetworkNameForChainId(chainId);
    } catch {
      return wcChain;
    }
  });

  // Format expiry
  const expiryDate = new Date(expiry * 1000);
  const isExpired = expiryDate < new Date();

  // Get domain from URL
  const domain = peerMeta.url ? new URL(peerMeta.url).hostname : 'Unknown';

  return (
    <View className="bg-wallet-card rounded-2xl p-4">
      {/* Header */}
      <View className="flex-row items-center gap-3 mb-4">
        {/* dApp Icon */}
        {peerMeta.icons[0] ? (
          <Image
            source={{ uri: peerMeta.icons[0] }}
            style={{ width: 48, height: 48, borderRadius: 12 }}
            contentFit="cover"
          />
        ) : (
          <View className="w-12 h-12 rounded-xl bg-wallet-card-light items-center justify-center">
            <Feather name="globe" size={24} color="#8B9A92" />
          </View>
        )}

        {/* dApp Info */}
        <View className="flex-1">
          <Text className="text-wallet-text font-semibold text-base" numberOfLines={1}>
            {peerMeta.name}
          </Text>
          <Text className="text-wallet-text-secondary text-sm" numberOfLines={1}>
            {domain}
          </Text>
        </View>

        {/* Disconnect Button */}
        <Pressable
          onPress={onDisconnect}
          className="w-10 h-10 rounded-full bg-wallet-negative/20 items-center justify-center active:opacity-70"
          hitSlop={8}
        >
          <Feather name="x" size={18} color="#FF6B6B" />
        </Pressable>
      </View>

      {/* Connected Chains */}
      <View className="flex-row flex-wrap gap-2 mb-3">
        {chainNames.slice(0, 4).map((name, index) => (
          <View key={index} className="bg-wallet-card-light px-3 py-1.5 rounded-lg">
            <Text className="text-wallet-text-secondary text-xs">{name}</Text>
          </View>
        ))}
        {chainNames.length > 4 && (
          <View className="bg-wallet-card-light px-3 py-1.5 rounded-lg">
            <Text className="text-wallet-text-secondary text-xs">
              +{chainNames.length - 4} more
            </Text>
          </View>
        )}
      </View>

      {/* Status */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <View
            className={`w-2 h-2 rounded-full ${
              isExpired ? 'bg-wallet-negative' : 'bg-wallet-positive'
            }`}
          />
          <Text className="text-wallet-text-muted text-xs">
            {isExpired ? 'Expired' : 'Connected'}
          </Text>
        </View>
        {!isExpired && (
          <Text className="text-wallet-text-muted text-xs">
            Expires {expiryDate.toLocaleDateString()}
          </Text>
        )}
      </View>
    </View>
  );
}

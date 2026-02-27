import { View, Text, FlatList } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { SessionCard } from './session-card';
import type { WCSession } from '@/types/walletconnect';

interface SessionListProps {
  sessions: WCSession[];
  onDisconnect: (topic: string) => void;
}

export function SessionList({ sessions, onDisconnect }: SessionListProps) {
  if (sessions.length === 0) {
    return (
      <View className="flex-1 items-center justify-center px-6 py-16">
        <View className="w-20 h-20 rounded-full bg-wallet-card items-center justify-center mb-6">
          <Feather name="link" size={36} color="#5C6660" />
        </View>
        <Text className="text-wallet-text text-xl font-semibold mb-2 text-center">
          No Connected dApps
        </Text>
        <Text className="text-wallet-text-secondary text-center">
          Scan a QR code or paste a WalletConnect URI to connect to a dApp.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={sessions}
      renderItem={({ item }) => (
        <SessionCard
          session={item}
          onDisconnect={() => onDisconnect(item.topic)}
        />
      )}
      keyExtractor={(item) => item.topic}
      contentContainerStyle={{ padding: 20, gap: 16 }}
      showsVerticalScrollIndicator={false}
    />
  );
}

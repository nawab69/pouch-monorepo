import { useState, useCallback } from 'react';
import { View, Text, Pressable, Alert, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import Feather from '@expo/vector-icons/Feather';
import { useWalletConnect } from '@/hooks/use-walletconnect';
import { SessionList } from '@/components/walletconnect/session-list';

export default function WalletConnectScreen() {
  const router = useRouter();
  const {
    isInitialized,
    isInitializing,
    sessions,
    connect,
    disconnect,
  } = useWalletConnect();

  const [uriInput, setUriInput] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [showUriInput, setShowUriInput] = useState(false);

  const handleConnect = useCallback(async (uri: string) => {
    if (!uri.trim()) return;

    // Validate WC URI format
    if (!uri.startsWith('wc:')) {
      Alert.alert('Invalid URI', 'Please enter a valid WalletConnect URI starting with "wc:"');
      return;
    }

    setIsConnecting(true);
    try {
      await connect(uri.trim());
      setUriInput('');
      setShowUriInput(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('[WalletConnect] Failed to connect:', error);
      Alert.alert(
        'Connection Failed',
        error instanceof Error ? error.message : 'Failed to connect to dApp'
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsConnecting(false);
    }
  }, [connect]);

  const handlePasteUri = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (text) {
        setUriInput(text.trim());
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (err) {
      console.error('Failed to paste:', err);
    }
  };

  const handleDisconnect = useCallback(async (topic: string) => {
    Alert.alert(
      'Disconnect',
      'Are you sure you want to disconnect from this dApp?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            try {
              await disconnect(topic);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (error) {
              console.error('[WalletConnect] Failed to disconnect:', error);
              Alert.alert('Error', 'Failed to disconnect');
            }
          },
        },
      ]
    );
  }, [disconnect]);

  return (
    <SafeAreaView className="flex-1 bg-wallet-bg" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 py-4">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-wallet-card items-center justify-center"
        >
          <Feather name="arrow-left" size={20} color="#FFFFFF" />
        </Pressable>

        <Text className="text-xl font-bold text-wallet-text">
          WalletConnect
        </Text>

        <View className="w-10" />
      </View>

      {/* Loading State */}
      {isInitializing && (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#B8F25B" />
          <Text className="text-wallet-text-secondary mt-4">Initializing...</Text>
        </View>
      )}

      {/* Content */}
      {isInitialized && (
        <>
          {/* Connect Options */}
          <View className="px-5 py-4 gap-3">
            {/* Scan QR Button */}
            <Pressable
              onPress={() => router.push('/walletconnect/scan')}
              className="flex-row items-center justify-center gap-3 bg-wallet-accent py-4 rounded-xl active:opacity-80"
            >
              <Feather name="maximize" size={20} color="#0A0A0A" />
              <Text className="text-wallet-bg font-semibold text-base">
                Scan QR Code
              </Text>
            </Pressable>

            {/* Paste URI Toggle */}
            <Pressable
              onPress={() => setShowUriInput(!showUriInput)}
              className="flex-row items-center justify-center gap-3 bg-wallet-card py-4 rounded-xl active:opacity-80"
            >
              <Feather name="link" size={18} color="#FFFFFF" />
              <Text className="text-wallet-text font-semibold">
                {showUriInput ? 'Hide' : 'Paste'} URI
              </Text>
            </Pressable>

            {/* URI Input */}
            {showUriInput && (
              <View className="bg-wallet-card rounded-xl p-4 gap-3">
                <View className="flex-row items-center gap-2">
                  <TextInput
                    value={uriInput}
                    onChangeText={setUriInput}
                    placeholder="wc:..."
                    placeholderTextColor="#5C6660"
                    className="flex-1 text-wallet-text font-mono text-sm py-2"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <Pressable
                    onPress={handlePasteUri}
                    className="px-3 py-2 bg-wallet-card-light rounded-lg"
                  >
                    <Feather name="clipboard" size={16} color="#8B9A92" />
                  </Pressable>
                </View>
                <Pressable
                  onPress={() => handleConnect(uriInput)}
                  disabled={!uriInput.trim() || isConnecting}
                  className={`py-3 rounded-xl items-center ${
                    uriInput.trim() && !isConnecting
                      ? 'bg-wallet-accent'
                      : 'bg-wallet-card-light'
                  }`}
                >
                  {isConnecting ? (
                    <ActivityIndicator color="#0A0A0A" />
                  ) : (
                    <Text
                      className={`font-semibold ${
                        uriInput.trim() ? 'text-wallet-bg' : 'text-wallet-text-secondary'
                      }`}
                    >
                      Connect
                    </Text>
                  )}
                </Pressable>
              </View>
            )}
          </View>

          {/* Sessions Header */}
          {sessions.length > 0 && (
            <View className="flex-row items-center justify-between px-5 py-2">
              <Text className="text-wallet-text font-semibold">
                Connected dApps
              </Text>
              <View className="bg-wallet-accent/20 px-3 py-1 rounded-full">
                <Text className="text-wallet-accent text-sm font-medium">
                  {sessions.length}
                </Text>
              </View>
            </View>
          )}

          {/* Sessions List */}
          <SessionList
            sessions={sessions}
            onDisconnect={handleDisconnect}
          />
        </>
      )}
    </SafeAreaView>
  );
}

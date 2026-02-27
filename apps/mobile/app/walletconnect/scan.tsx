import { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useNavigation } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import Feather from '@expo/vector-icons/Feather';
import { useWalletConnect } from '@/hooks/use-walletconnect';

export default function WalletConnectScanScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { connect } = useWalletConnect();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Safe dismiss function for modal
  const dismissModal = useCallback(() => {
    try {
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        // Fallback: navigate to walletconnect index
        router.replace('/walletconnect');
      }
    } catch (error) {
      console.warn('[WalletConnect] Navigation error:', error);
      // Last resort fallback
      router.replace('/walletconnect');
    }
  }, [navigation, router]);

  // Request permission on mount
  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned || isConnecting) return;

    // Check if it's a valid WC URI
    if (!data.startsWith('wc:')) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Invalid QR Code',
        'This QR code is not a valid WalletConnect URI.',
        [{ text: 'OK', onPress: () => setScanned(false) }]
      );
      return;
    }

    setScanned(true);
    setIsConnecting(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      // Start pairing (this just initiates the connection, doesn't wait for approval)
      await connect(data);
      // Dismiss modal after pairing is initiated
      // The session_proposal event will be handled by the context
      dismissModal();
    } catch (error) {
      console.error('[WalletConnect] Scan failed:', error);
      setIsConnecting(false);
      Alert.alert(
        'Connection Failed',
        error instanceof Error ? error.message : 'Failed to connect to dApp',
        [{ text: 'OK', onPress: () => setScanned(false) }]
      );
    }
  };

  // Permission denied
  if (permission && !permission.granted) {
    return (
      <SafeAreaView className="flex-1 bg-wallet-bg" edges={['top', 'bottom']}>
        <View className="flex-row items-center px-5 py-4">
          <Pressable
            onPress={dismissModal}
            className="w-10 h-10 rounded-full bg-wallet-card items-center justify-center"
          >
            <Feather name="x" size={20} color="#FFFFFF" />
          </Pressable>
        </View>

        <View className="flex-1 items-center justify-center px-8">
          <View className="w-20 h-20 rounded-full bg-wallet-card items-center justify-center mb-6">
            <Feather name="camera-off" size={36} color="#5C6660" />
          </View>
          <Text className="text-wallet-text text-xl font-semibold mb-2 text-center">
            Camera Permission Required
          </Text>
          <Text className="text-wallet-text-secondary text-center mb-6">
            Please allow camera access to scan WalletConnect QR codes.
          </Text>
          <Pressable
            onPress={requestPermission}
            className="bg-wallet-accent px-8 py-4 rounded-xl"
          >
            <Text className="text-wallet-bg font-semibold">Grant Permission</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera */}
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />

      {/* Overlay */}
      <View style={styles.overlay}>
        {/* Header */}
        <SafeAreaView edges={['top']}>
          <View className="flex-row items-center justify-between px-5 py-4">
            <Pressable
              onPress={dismissModal}
              disabled={isConnecting}
              className="w-10 h-10 rounded-full bg-black/50 items-center justify-center"
            >
              <Feather name="x" size={20} color="#FFFFFF" />
            </Pressable>
            <Text className="text-white text-lg font-semibold">
              {isConnecting ? 'Connecting...' : 'Scan QR Code'}
            </Text>
            <View className="w-10" />
          </View>
        </SafeAreaView>

        {/* Scanner Frame */}
        <View className="flex-1 items-center justify-center">
          <View style={styles.scannerFrame}>
            {/* Corner markers */}
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
        </View>

        {/* Instructions */}
        <SafeAreaView edges={['bottom']}>
          <View className="items-center px-8 pb-8">
            <View className="bg-black/50 px-6 py-4 rounded-2xl">
              <Text className="text-white text-center">
                {isConnecting
                  ? 'Establishing connection...'
                  : 'Point your camera at a WalletConnect QR code'}
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  scannerFrame: {
    width: 280,
    height: 280,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#B8F25B',
    borderWidth: 4,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 12,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 12,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 12,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 12,
  },
});

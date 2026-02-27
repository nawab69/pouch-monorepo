import { View, Text, Pressable } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import Feather from '@expo/vector-icons/Feather';
import { formatAddress } from '@/services/blockchain';

interface QRCodeDisplayProps {
  address: string;
  size?: number;
  showCopyButton?: boolean;
  onCopy?: () => void;
}

export function QRCodeDisplay({
  address,
  size = 200,
  showCopyButton = true,
  onCopy,
}: QRCodeDisplayProps) {
  const handleCopy = async () => {
    await Clipboard.setStringAsync(address);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onCopy?.();
  };

  return (
    <View className="items-center">
      {/* QR Code Container */}
      <View className="bg-white p-4 rounded-2xl">
        <QRCode
          value={address}
          size={size}
          backgroundColor="white"
          color="#0A0A0A"
        />
      </View>

      {/* Address Display */}
      <View className="mt-6 items-center">
        <Text className="text-wallet-text-secondary text-sm mb-2">
          Wallet Address
        </Text>
        <Text className="text-wallet-text font-mono text-base">
          {formatAddress(address, 10, 8)}
        </Text>
      </View>

      {/* Copy Button */}
      {showCopyButton && (
        <Pressable
          onPress={handleCopy}
          className="mt-4 flex-row items-center gap-2 bg-wallet-card-light px-5 py-3 rounded-full active:opacity-70"
        >
          <Feather name="copy" size={16} color="#B8F25B" />
          <Text className="text-wallet-accent font-medium">Copy Address</Text>
        </Pressable>
      )}
    </View>
  );
}

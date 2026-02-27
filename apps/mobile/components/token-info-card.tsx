import { View, Text, Pressable, Linking } from 'react-native';
import { Image } from 'expo-image';
import * as Clipboard from 'expo-clipboard';
import { Token, NetworkId, NetworkType } from '@/types/blockchain';
import { NETWORKS } from '@/constants/networks';
import { formatAddress } from '@/services/blockchain';

interface TokenInfoCardProps {
  token: Token;
  networkId: NetworkId;
  networkType: NetworkType;
}

export function TokenInfoCard({
  token,
  networkId,
  networkType,
}: TokenInfoCardProps) {
  const network = NETWORKS[networkId];
  const explorerBaseUrl = network?.explorerUrl[networkType];

  const handleCopyAddress = async () => {
    if (token.contractAddress) {
      await Clipboard.setStringAsync(token.contractAddress);
    }
  };

  const handleOpenExplorer = () => {
    if (!explorerBaseUrl || !token.contractAddress) return;
    const url = `${explorerBaseUrl}/token/${token.contractAddress}`;
    Linking.openURL(url);
  };

  return (
    <View className="bg-wallet-card-light rounded-2xl p-4 mx-5">
      <Text className="text-wallet-text-secondary text-sm font-medium mb-3">
        Token Info
      </Text>

      {/* Token Icon and Name */}
      <View className="flex-row items-center gap-3 mb-4">
        <View
          className="w-10 h-10 rounded-full items-center justify-center overflow-hidden"
          style={{ backgroundColor: token.logoUrl ? '#1C1C1E' : '#627EEA' }}
        >
          {token.logoUrl ? (
            <Image
              source={{ uri: token.logoUrl }}
              style={{ width: 28, height: 28 }}
              contentFit="contain"
            />
          ) : (
            <Text className="text-white font-bold text-sm">
              {token.symbol.charAt(0)}
            </Text>
          )}
        </View>
        <View>
          <Text className="text-wallet-text font-semibold text-base">
            {token.name}
          </Text>
          <Text className="text-wallet-text-secondary text-sm">
            {token.symbol}
          </Text>
        </View>
      </View>

      {/* Info Rows */}
      <View className="gap-3">
        {/* Network */}
        <View className="flex-row justify-between items-center">
          <Text className="text-wallet-text-secondary text-sm">Network</Text>
          <View className="flex-row items-center gap-2">
            <View
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: network?.color ?? '#8E8E93' }}
            />
            <Text className="text-wallet-text text-sm">
              {network?.name ?? networkId}
              {networkType === 'testnet' && (
                <Text className="text-wallet-text-secondary"> (Testnet)</Text>
              )}
            </Text>
          </View>
        </View>

        {/* Contract Address */}
        <View className="flex-row justify-between items-center">
          <Text className="text-wallet-text-secondary text-sm">Contract</Text>
          {token.isNative ? (
            <Text className="text-wallet-text text-sm">Native</Text>
          ) : (
            <Pressable
              onPress={handleCopyAddress}
              className="flex-row items-center gap-2"
            >
              <Text className="text-wallet-accent text-sm">
                {formatAddress(token.contractAddress ?? '', 6, 4)}
              </Text>
              <Text className="text-wallet-text-secondary text-xs">Copy</Text>
            </Pressable>
          )}
        </View>

        {/* Decimals */}
        <View className="flex-row justify-between items-center">
          <Text className="text-wallet-text-secondary text-sm">Decimals</Text>
          <Text className="text-wallet-text text-sm">{token.decimals}</Text>
        </View>

        {/* Explorer Link */}
        {!token.isNative && explorerBaseUrl && (
          <Pressable
            onPress={handleOpenExplorer}
            className="flex-row justify-between items-center"
          >
            <Text className="text-wallet-text-secondary text-sm">
              View on Explorer
            </Text>
            <Text className="text-wallet-accent text-sm">→</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

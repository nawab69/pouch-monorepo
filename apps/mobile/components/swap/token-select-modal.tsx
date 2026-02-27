import { useState, useMemo } from 'react';
import { View, Text, Pressable, TextInput, FlatList, Modal } from 'react-native';
import { Image } from 'expo-image';
import Feather from '@expo/vector-icons/Feather';
import { Token } from '@/types/blockchain';

interface TokenSelectModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (token: Token) => void;
  tokens: Token[];
  selectedToken?: Token | null;
  excludeToken?: Token | null;
  title?: string;
}

export function TokenSelectModal({
  visible,
  onClose,
  onSelect,
  tokens,
  selectedToken,
  excludeToken,
  title = 'Select Token',
}: TokenSelectModalProps) {
  const [search, setSearch] = useState('');

  // Filter tokens based on search and exclude the other selected token
  const filteredTokens = useMemo(() => {
    let filtered = tokens;

    // Exclude the token that's already selected in the other input
    if (excludeToken) {
      filtered = filtered.filter(
        (t) =>
          t.contractAddress !== excludeToken.contractAddress ||
          t.isNative !== excludeToken.isNative
      );
    }

    // Apply search filter
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.symbol.toLowerCase().includes(searchLower) ||
          t.name.toLowerCase().includes(searchLower) ||
          t.contractAddress?.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [tokens, excludeToken, search]);

  const handleSelect = (token: Token) => {
    onSelect(token);
    setSearch('');
    onClose();
  };

  const renderToken = ({ item: token }: { item: Token }) => {
    const isSelected =
      selectedToken &&
      token.contractAddress === selectedToken.contractAddress &&
      token.isNative === selectedToken.isNative;

    const balance = parseFloat(token.balanceFormatted) || 0;
    const balanceUsd = token.balanceUsd || 0;

    return (
      <Pressable
        onPress={() => handleSelect(token)}
        className={`flex-row items-center justify-between py-4 px-4 ${
          isSelected ? 'bg-wallet-card-light' : ''
        }`}
      >
        <View className="flex-row items-center gap-3">
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
            <View className="flex-row items-center gap-2">
              <Text className="text-wallet-text font-semibold">
                {token.symbol}
              </Text>
              {isSelected && (
                <View className="w-4 h-4 rounded-full bg-wallet-accent items-center justify-center">
                  <Feather name="check" size={10} color="#0A0A0A" />
                </View>
              )}
            </View>
            <Text className="text-wallet-text-muted text-sm">{token.name}</Text>
          </View>
        </View>

        <View className="items-end">
          <Text className="text-wallet-text font-medium">
            {balance > 0 ? balance.toFixed(4) : '0'}
          </Text>
          {balanceUsd > 0 && (
            <Text className="text-wallet-text-muted text-sm">
              ${balanceUsd.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Text>
          )}
        </View>
      </Pressable>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/60">
        <View className="flex-1 mt-20 bg-wallet-bg rounded-t-3xl overflow-hidden">
          {/* Header */}
          <View className="flex-row items-center justify-between px-5 py-4 border-b border-wallet-card">
            <Text className="text-wallet-text text-lg font-semibold">
              {title}
            </Text>
            <Pressable
              onPress={onClose}
              className="w-8 h-8 rounded-full bg-wallet-card items-center justify-center"
            >
              <Feather name="x" size={18} color="#8B9A92" />
            </Pressable>
          </View>

          {/* Search */}
          <View className="px-5 py-3">
            <View className="flex-row items-center bg-wallet-card rounded-xl px-4">
              <Feather name="search" size={18} color="#8B9A92" />
              <TextInput
                className="flex-1 text-wallet-text py-3 ml-3"
                value={search}
                onChangeText={setSearch}
                placeholder="Search by name or address"
                placeholderTextColor="#5C6660"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {search.length > 0 && (
                <Pressable onPress={() => setSearch('')}>
                  <Feather name="x-circle" size={16} color="#8B9A92" />
                </Pressable>
              )}
            </View>
          </View>

          {/* Token list */}
          <FlatList
            data={filteredTokens}
            renderItem={renderToken}
            keyExtractor={(token) =>
              token.contractAddress ?? `native-${token.symbol}`
            }
            className="flex-1"
            contentContainerStyle={{ paddingBottom: 40 }}
            ListEmptyComponent={
              <View className="items-center py-10">
                <Text className="text-wallet-text-secondary">
                  {search ? 'No tokens found' : 'No tokens available'}
                </Text>
              </View>
            }
            ItemSeparatorComponent={() => (
              <View className="h-px bg-wallet-card mx-4" />
            )}
          />
        </View>
      </View>
    </Modal>
  );
}

import { useState } from 'react';
import { View, Text, Pressable, TextInput, Modal } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { SlippageValue, SlippagePreset } from '@/services/swap/swap-types';
import {
  SLIPPAGE_PRESETS,
  MIN_SLIPPAGE,
  MAX_SLIPPAGE,
} from '@/constants/swap';

interface SlippageSelectorProps {
  value: SlippageValue;
  onChange: (value: SlippageValue) => void;
}

export function SlippageSelector({ value, onChange }: SlippageSelectorProps) {
  const [showModal, setShowModal] = useState(false);
  const [customValue, setCustomValue] = useState('');

  const isPreset = SLIPPAGE_PRESETS.includes(value as SlippagePreset);
  const isCustom = !isPreset;

  const handlePresetSelect = (preset: number) => {
    onChange(preset as SlippageValue);
    setCustomValue('');
  };

  const handleCustomSubmit = () => {
    const parsed = parseFloat(customValue);
    if (!isNaN(parsed) && parsed >= MIN_SLIPPAGE && parsed <= MAX_SLIPPAGE) {
      onChange(parsed);
      setShowModal(false);
    }
  };

  return (
    <>
      <Pressable
        onPress={() => setShowModal(true)}
        className="flex-row items-center gap-2 bg-wallet-card-light px-3 py-2 rounded-xl"
      >
        <Feather name="settings" size={14} color="#8B9A92" />
        <Text className="text-wallet-text text-sm">{value}%</Text>
        <Feather name="chevron-down" size={14} color="#8B9A92" />
      </Pressable>

      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <Pressable
          className="flex-1 bg-black/60 justify-end"
          onPress={() => setShowModal(false)}
        >
          <Pressable
            className="bg-wallet-bg rounded-t-3xl p-5"
            onPress={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-wallet-text text-lg font-semibold">
                Slippage Tolerance
              </Text>
              <Pressable
                onPress={() => setShowModal(false)}
                className="w-8 h-8 rounded-full bg-wallet-card items-center justify-center"
              >
                <Feather name="x" size={18} color="#8B9A92" />
              </Pressable>
            </View>

            {/* Description */}
            <Text className="text-wallet-text-secondary text-sm mb-4">
              Your transaction will revert if the price changes more than this percentage.
            </Text>

            {/* Presets */}
            <View className="flex-row gap-3 mb-4">
              {SLIPPAGE_PRESETS.map((preset) => (
                <Pressable
                  key={preset}
                  onPress={() => handlePresetSelect(preset)}
                  className={`flex-1 py-3 rounded-xl items-center ${
                    value === preset
                      ? 'bg-wallet-accent'
                      : 'bg-wallet-card'
                  }`}
                >
                  <Text
                    className={`font-semibold ${
                      value === preset
                        ? 'text-wallet-bg'
                        : 'text-wallet-text'
                    }`}
                  >
                    {preset}%
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Custom input */}
            <View className="mb-6">
              <Text className="text-wallet-text-secondary text-sm mb-2">
                Custom
              </Text>
              <View className="flex-row items-center bg-wallet-card rounded-xl px-4">
                <TextInput
                  className="flex-1 text-wallet-text py-3"
                  value={isCustom ? value.toString() : customValue}
                  onChangeText={setCustomValue}
                  keyboardType="decimal-pad"
                  placeholder="Enter custom slippage"
                  placeholderTextColor="#5C6660"
                  returnKeyType="done"
                  onSubmitEditing={handleCustomSubmit}
                />
                <Text className="text-wallet-text-secondary">%</Text>
              </View>

              {/* Warning for high slippage */}
              {((isCustom && value > 5) || parseFloat(customValue) > 5) && (
                <View className="flex-row items-center gap-2 mt-2">
                  <Feather name="alert-triangle" size={12} color="#F7931A" />
                  <Text className="text-[#F7931A] text-xs">
                    High slippage may result in unfavorable trades
                  </Text>
                </View>
              )}
            </View>

            {/* Apply button for custom */}
            {customValue && (
              <Pressable
                onPress={handleCustomSubmit}
                className="bg-wallet-accent py-4 rounded-xl items-center"
              >
                <Text className="text-wallet-bg font-semibold">
                  Apply Custom Slippage
                </Text>
              </Pressable>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

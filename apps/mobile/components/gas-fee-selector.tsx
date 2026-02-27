import { View, Text, Pressable } from 'react-native';
import { formatEther } from 'ethers';
import Feather from '@expo/vector-icons/Feather';
import { GasOption } from '@/types/blockchain';

interface GasFeeSelectorProps {
  options: GasOption[];
  selectedLabel: 'slow' | 'standard' | 'fast';
  gasLimit: bigint;
  nativeSymbol: string;
  onSelect: (option: GasOption) => void;
}

export function GasFeeSelector({
  options,
  selectedLabel,
  gasLimit,
  nativeSymbol,
  onSelect,
}: GasFeeSelectorProps) {
  const getEstimatedCost = (option: GasOption): string => {
    const cost = gasLimit * option.maxFeePerGas;
    const formatted = parseFloat(formatEther(cost));
    // Format with appropriate precision
    if (formatted < 0.0001) {
      return `<0.0001`;
    }
    return `~${formatted.toFixed(4)}`;
  };

  const getLabelColor = (label: string, isSelected: boolean) => {
    if (isSelected) return '#B8F25B';
    switch (label) {
      case 'slow':
        return '#8E8E93';
      case 'standard':
        return '#B8F25B';
      case 'fast':
        return '#FF9500';
      default:
        return '#8E8E93';
    }
  };

  const getLabelIcon = (label: string): keyof typeof Feather.glyphMap => {
    switch (label) {
      case 'slow':
        return 'clock';
      case 'standard':
        return 'zap';
      case 'fast':
        return 'chevrons-right';
      default:
        return 'zap';
    }
  };

  return (
    <View className="gap-2">
      <Text className="text-wallet-text-secondary text-sm mb-1">
        Transaction Speed
      </Text>

      <View className="flex-row gap-2">
        {options.map((option) => {
          const isSelected = option.label === selectedLabel;
          const color = getLabelColor(option.label, isSelected);

          return (
            <Pressable
              key={option.label}
              onPress={() => onSelect(option)}
              className={`flex-1 p-2 rounded-xl border ${
                isSelected
                  ? 'border-wallet-accent bg-wallet-accent/10'
                  : 'border-wallet-card-light bg-wallet-card-light'
              }`}
            >
              <View className="items-center gap-0.5">
                <View
                  className="w-8 h-8 rounded-full items-center justify-center mb-1"
                  style={{ backgroundColor: `${color}20` }}
                >
                  <Feather
                    name={getLabelIcon(option.label)}
                    size={16}
                    color={color}
                  />
                </View>
                <Text
                  className="font-medium capitalize text-sm"
                  style={{ color }}
                >
                  {option.label}
                </Text>
                <Text className="text-wallet-text-secondary text-[10px]">
                  {option.estimatedTime}
                </Text>
                <Text
                  className="text-wallet-text text-[10px] font-mono mt-0.5"
                  numberOfLines={1}
                >
                  {getEstimatedCost(option)}
                </Text>
                <Text className="text-wallet-text-secondary text-[10px]">
                  {nativeSymbol}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

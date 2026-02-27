import { View, Text, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import Feather from '@expo/vector-icons/Feather';

interface PinKeypadProps {
  onPress: (digit: string) => void;
  onDelete: () => void;
  disabled?: boolean;
}

const KEYS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['', '0', 'delete'],
];

export function PinKeypad({ onPress, onDelete, disabled = false }: PinKeypadProps) {
  const handlePress = async (key: string) => {
    if (disabled) return;

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (key === 'delete') {
      onDelete();
    } else if (key !== '') {
      onPress(key);
    }
  };

  return (
    <View className="gap-3">
      {KEYS.map((row, rowIndex) => (
        <View key={rowIndex} className="flex-row justify-center gap-6">
          {row.map((key, keyIndex) => (
            <KeypadButton
              key={`${rowIndex}-${keyIndex}`}
              value={key}
              onPress={() => handlePress(key)}
              disabled={disabled}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

interface KeypadButtonProps {
  value: string;
  onPress: () => void;
  disabled: boolean;
}

function KeypadButton({ value, onPress, disabled }: KeypadButtonProps) {
  if (value === '') {
    return <View className="w-20 h-20" />;
  }

  const isDelete = value === 'delete';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`w-20 h-20 rounded-full items-center justify-center ${
        isDelete ? '' : 'bg-wallet-card'
      } ${disabled ? 'opacity-50' : 'active:opacity-70'}`}
    >
      {isDelete ? (
        <Feather name="delete" size={24} color="#8E8E93" />
      ) : (
        <Text className="text-3xl font-semibold text-wallet-text">{value}</Text>
      )}
    </Pressable>
  );
}

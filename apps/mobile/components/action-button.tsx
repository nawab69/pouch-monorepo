import { View, Text, Pressable } from 'react-native';
import Feather from '@expo/vector-icons/Feather';

type ActionType = 'receive' | 'send' | 'swap';

interface ActionButtonProps {
  type: ActionType;
  onPress?: () => void;
}

const actionConfig: Record<ActionType, { icon: keyof typeof Feather.glyphMap; label: string }> = {
  receive: { icon: 'arrow-down-left', label: 'Receive' },
  send: { icon: 'arrow-up-right', label: 'Send' },
  swap: { icon: 'repeat', label: 'Swap' },
};

export function ActionButton({ type, onPress }: ActionButtonProps) {
  const config = actionConfig[type];

  return (
    <Pressable onPress={onPress} className="items-center gap-3">
      <View className="w-14 h-14 rounded-2xl bg-wallet-card items-center justify-center">
        <Feather name={config.icon} size={24} color="#FFFFFF" />
      </View>
      <Text className="text-sm font-normal text-wallet-text-secondary">{config.label}</Text>
    </Pressable>
  );
}

import { Pressable, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import Feather from '@expo/vector-icons/Feather';
import { BiometricType } from '@/types/auth';
import { getBiometricTypeName } from '@/services/auth/biometric-service';

interface BiometricButtonProps {
  type: BiometricType;
  onPress: () => void;
  disabled?: boolean;
}

export function BiometricButton({
  type,
  onPress,
  disabled = false,
}: BiometricButtonProps) {
  if (!type) return null;

  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const label = `Use ${getBiometricTypeName(type)}`;

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      className={`flex-row items-center gap-2 px-4 py-3 ${
        disabled ? 'opacity-50' : 'active:opacity-70'
      }`}
    >
      <View className="w-10 h-10 rounded-full bg-wallet-card items-center justify-center">
        {type === 'faceid' ? (
          <FaceIdIcon />
        ) : (
          <Feather name="smartphone" size={20} color="#B8F25B" />
        )}
      </View>
      <Text className="text-wallet-accent font-medium">{label}</Text>
    </Pressable>
  );
}

function FaceIdIcon() {
  return (
    <View className="w-5 h-5 items-center justify-center">
      {/* Simple Face ID representation using borders */}
      <View className="w-5 h-5 relative">
        {/* Top-left corner */}
        <View className="absolute top-0 left-0 w-1.5 h-1.5 border-l-2 border-t-2 border-wallet-accent rounded-tl" />
        {/* Top-right corner */}
        <View className="absolute top-0 right-0 w-1.5 h-1.5 border-r-2 border-t-2 border-wallet-accent rounded-tr" />
        {/* Bottom-left corner */}
        <View className="absolute bottom-0 left-0 w-1.5 h-1.5 border-l-2 border-b-2 border-wallet-accent rounded-bl" />
        {/* Bottom-right corner */}
        <View className="absolute bottom-0 right-0 w-1.5 h-1.5 border-r-2 border-b-2 border-wallet-accent rounded-br" />
        {/* Eyes */}
        <View className="absolute top-1.5 left-1 w-0.5 h-1 bg-wallet-accent rounded-full" />
        <View className="absolute top-1.5 right-1 w-0.5 h-1 bg-wallet-accent rounded-full" />
        {/* Mouth */}
        <View className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-2 h-0.5 bg-wallet-accent rounded-full" />
      </View>
    </View>
  );
}

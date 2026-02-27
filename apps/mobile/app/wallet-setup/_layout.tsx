import { Stack } from 'expo-router';
import { WalletSetupProvider } from '@/contexts/wallet-setup-context';

export default function WalletSetupLayout() {
  return (
    <WalletSetupProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          contentStyle: { backgroundColor: '#0D1411' },
        }}
      >
        <Stack.Screen name="index" options={{ animation: 'fade' }} />
        <Stack.Screen name="create/generate" />
        <Stack.Screen name="create/backup" />
        <Stack.Screen name="create/confirm" />
        <Stack.Screen name="create/pin" options={{ gestureEnabled: false }} />
        <Stack.Screen name="import" />
        <Stack.Screen name="success" options={{ animation: 'fade', gestureEnabled: false }} />
      </Stack>
    </WalletSetupProvider>
  );
}

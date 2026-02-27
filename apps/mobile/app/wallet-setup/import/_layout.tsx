import { Stack } from 'expo-router';

export default function ImportLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: true,
        gestureDirection: 'horizontal',
        contentStyle: { backgroundColor: '#0D1411' },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="pin" options={{ gestureEnabled: false }} />
    </Stack>
  );
}

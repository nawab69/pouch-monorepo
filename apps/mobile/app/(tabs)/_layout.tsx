import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { CustomTabBar } from '@/components/custom-tab-bar';

export default function TabLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: '#0A0A0A' }}>
      <Tabs
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          animation: 'none',
          lazy: false,
        }}
      >
        <Tabs.Screen name="index" />
        <Tabs.Screen name="portfolio" />
        <Tabs.Screen name="swap" />
        <Tabs.Screen name="settings" />
      </Tabs>
    </View>
  );
}

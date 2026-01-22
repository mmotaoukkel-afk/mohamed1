/**
 * Tabs Layout - Kataraa
 * Premium floating tab bar with glassmorphism
 */

import { Tabs } from 'expo-router';
import CustomTabBar from '../../src/components/CustomTabBar';

export default function TabsLayout() {
  return (
    <Tabs
      sceneContainerStyle={{ backgroundColor: 'transparent' }}
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="products" />
      <Tabs.Screen name="cart" />
      <Tabs.Screen name="favorites" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

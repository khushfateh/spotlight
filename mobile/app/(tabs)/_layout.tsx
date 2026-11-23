import { Tabs } from 'expo-router'
import TabBar from '@/components/navigation/TabBar'

export default function TabLayout() {
  return (
    <Tabs
      tabBar={props => <TabBar {...props as any} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index"    options={{ title: 'Home' }} />
      <Tabs.Screen name="discover" options={{ title: 'Discover' }} />
      <Tabs.Screen name="vault"    options={{ title: 'Vault' }} />
      <Tabs.Screen name="profile"  options={{ title: 'Profile' }} />
    </Tabs>
  )
}

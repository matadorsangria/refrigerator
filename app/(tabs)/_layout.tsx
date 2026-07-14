import { Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../store/AppContext';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

function tabIcon(active: IconName, inactive: IconName) {
  return ({ focused, color, size }: { focused: boolean; color: string; size: number }) => (
    <Ionicons name={focused ? active : inactive} size={size} color={color} />
  );
}

export default function TabLayout() {
  const { householdId } = useApp();
  const restricted = Platform.OS === 'web' && !householdId;

  return (
    <Tabs>
      <Tabs.Screen
        name="(home)"
        options={{
          title: 'ホーム',
          headerShown: false,
          tabBarIcon: tabIcon('home', 'home-outline'),
          href: restricted ? null : undefined,
        }}
      />
      <Tabs.Screen
        name="(ingredients)"
        options={{
          title: '食材',
          headerShown: false,
          tabBarIcon: tabIcon('nutrition', 'nutrition-outline'),
          href: restricted ? null : undefined,
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('(ingredients)', { screen: 'index' });
          },
        })}
      />
      <Tabs.Screen
        name="shopping"
        options={{
          title: '買うもの',
          headerShown: false,
          tabBarIcon: tabIcon('cart', 'cart-outline'),
          href: restricted ? null : undefined,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: '設定',
          headerShown: false,
          tabBarIcon: tabIcon('settings', 'settings-outline'),
        }}
      />
      <Tabs.Screen
        name="sharing"
        options={{
          title: '共有',
          headerShown: false,
          href: null,
        }}
      />
    </Tabs>
  );
}

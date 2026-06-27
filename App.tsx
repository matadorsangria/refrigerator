import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Tab = 'ホーム' | '食材' | '買うもの' | '設定';

const TABS: { name: Tab; icon: string }[] = [
  { name: 'ホーム', icon: 'home' },
  { name: '食材', icon: 'nutrition' },
  { name: '買うもの', icon: 'cart' },
  { name: '設定', icon: 'settings' },
];

function HomeScreen() {
  return <View style={styles.screen}><Text>ホーム</Text></View>;
}

function IngredientsScreen() {
  return <View style={styles.screen}><Text>食材</Text></View>;
}

function ShoppingScreen() {
  return <View style={styles.screen}><Text>買うもの</Text></View>;
}

function SettingsScreen() {
  return <View style={styles.screen}><Text>設定</Text></View>;
}

const SCREENS: Record<Tab, () => React.ReactElement> = {
  ホーム: HomeScreen,
  食材: IngredientsScreen,
  買うもの: ShoppingScreen,
  設定: SettingsScreen,
};

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('ホーム');
  const Screen = SCREENS[activeTab];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <View style={styles.content}>
        <Screen />
      </View>
      <View style={styles.tabBar}>
        {TABS.map(({ name, icon }) => {
          const active = activeTab === name;
          return (
            <TouchableOpacity
              key={name}
              style={styles.tabItem}
              onPress={() => setActiveTab(name)}
            >
              <Ionicons
                name={(active ? icon : `${icon}-outline`) as any}
                size={24}
                color={active ? '#007AFF' : '#8E8E93'}
              />
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                {name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
  },
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#C6C6C8',
    backgroundColor: '#F9F9F9',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    gap: 2,
  },
  tabLabel: {
    fontSize: 10,
    color: '#8E8E93',
  },
  tabLabelActive: {
    color: '#007AFF',
  },
});

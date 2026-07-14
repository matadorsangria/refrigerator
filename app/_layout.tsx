import { View, ActivityIndicator, Platform } from 'react-native';
import { Stack } from 'expo-router';
import Head from 'expo-router/head';
import { AppProvider, useApp } from '../store/AppContext';

if (Platform.OS === 'web') require('./global.css');

function AppStack() {
  const { loading } = useApp();
  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="ingredient/new" options={{ presentation: 'modal', headerShown: false }} />
      <Stack.Screen name="ingredient/[id]" options={{ presentation: 'modal', headerShown: false }} />
      <Stack.Screen name="sharing" options={{ presentation: 'modal', headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AppProvider>
      <Head>
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </Head>
      <AppStack />
    </AppProvider>
  );
}

import { Stack } from 'expo-router';
import { AppProvider } from '../store/AppContext';

export default function RootLayout() {
  return (
    <AppProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="ingredient/new"
          options={{ presentation: 'modal', headerShown: false }}
        />
        <Stack.Screen
          name="ingredient/[id]"
          options={{ presentation: 'modal', headerShown: false }}
        />
      </Stack>
    </AppProvider>
  );
}

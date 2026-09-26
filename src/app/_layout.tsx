import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { StoreProvider, useStore } from '../lib/store';
import { useTheme } from '../lib/theme';

SplashScreen.preventAutoHideAsync();

function Navigator() {
  const theme = useTheme();
  const { account } = useStore();
  const ready = account !== undefined;

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(theme.bg);
  }, [theme.bg]);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.bg },
        // Screens fade themselves in (see FadeIn); Android can't shorten native transitions.
        animation: 'none',
      }}
    />
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <Navigator />
      </StoreProvider>
    </SafeAreaProvider>
  );
}

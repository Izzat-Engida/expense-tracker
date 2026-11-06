import { useEffect } from 'react';
import { Appearance } from 'react-native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { ShipporiMincho_600SemiBold } from '@expo-google-fonts/shippori-mincho';
import { ShareTechMono_400Regular } from '@expo-google-fonts/share-tech-mono';
import {
  PlusJakartaSans_500Medium,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SQLiteProvider } from 'expo-sqlite';
import { migrateDb } from '@/db/client';
import { useSettingsStore } from '@/stores/settingsStore';

SplashScreen.preventAutoHideAsync();

function GatedStack() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen
        name="modals/add-expense"
        options={{ presentation: 'modal', headerShown: false }}
      />
      <Stack.Screen
        name="modals/income-budget"
        options={{ presentation: 'modal', headerShown: false }}
      />
      <Stack.Screen
        name="modals/sync-status"
        options={{ presentation: 'modal', headerShown: false }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    ShipporiMincho_600SemiBold,
    ShareTechMono_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_700Bold,
  });

  const loadSettings = useSettingsStore((s) => s.loadSettings);
  const isSettingsLoaded = useSettingsStore((s) => s.isLoaded);
  const themeMode = useSettingsStore((s) => s.themeMode);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
 
    if (typeof Appearance.setColorScheme === 'function') {
      Appearance.setColorScheme(themeMode === 'system' ? 'unspecified' : themeMode);
    }
  }, [themeMode]);

  useEffect(() => {
    if ((loaded || error) && isSettingsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error, isSettingsLoaded]);

  if ((!loaded && !error) || !isSettingsLoaded) return null;

  return (
    <SafeAreaProvider>
      <SQLiteProvider databaseName="yohaku.db" onInit={migrateDb}>
        <GatedStack />
      </SQLiteProvider>
    </SafeAreaProvider>
  );
}
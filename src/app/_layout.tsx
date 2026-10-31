import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { ShipporiMincho_600SemiBold } from '@expo-google-fonts/shippori-mincho';
import { ShareTechMono_400Regular } from '@expo-google-fonts/share-tech-mono';
import {
  PlusJakartaSans_500Medium,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    ShipporiMincho_600SemiBold,
    ShareTechMono_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_700Bold,
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return <Stack screenOptions={{ headerShown: false }} />;
}
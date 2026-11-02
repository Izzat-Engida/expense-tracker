import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { useThemeColors } from '@/constants/theme';

export default function Index() {
  const { colors } = useThemeColors();
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const accounts = useAuthStore((s) => s.accounts);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const initAuth = useAuthStore((s) => s.initAuth);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  if (!isInitialized) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator color={colors.textPrimary} size="large" />
      </View>
    );
  }

  if (accounts.length === 0) {
    return <Redirect href="/(auth)/onboarding" />;
  }

  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/select-account" />;
}

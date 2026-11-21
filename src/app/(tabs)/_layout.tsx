import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Tabs, router } from 'expo-router';
import { Colors, Fonts, useThemeColors } from '@/constants/theme';
import { HankoStamp } from '@/components/ui/HankoStamp'; 
import { triggerHaptic } from '@/utils/haptics'; 
import Animated, { FadeIn } from 'react-native-reanimated';

type TabKey = 'index' | 'overview' | 'wishlist' | 'settings';

interface TabItem {
  name: TabKey;
  label: string;
  route: '/(tabs)' | '/(tabs)/overview' | '/(tabs)/wishlist' | '/(tabs)/settings';
}

const TABS: TabItem[] = [
  { name: 'index', label: 'Home', route: '/(tabs)' },
  { name: 'overview', label: 'Overview', route: '/(tabs)/overview' },
  { name: 'wishlist', label: 'Wishlist', route: '/(tabs)/wishlist' },
  { name: 'settings', label: 'Settings', route: '/(tabs)/settings' },
];

type BottomTabBarProps = Parameters<NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>>[0];

function CustomTabBar({
  state,
  emitter,
  navigateToTab,
  insets,
}: BottomTabBarProps) {
  const { colors, isDark } = useThemeColors();

  return (
    <View
      style={[
        styles.barContainer,
        {
          backgroundColor: isDark ? colors.card : colors.background,
          borderTopColor: colors.border,
          paddingBottom: Math.max(insets.bottom, Platform.OS === 'ios' ? 20 : 8),
        },
      ]}
    >
      <View style={styles.bar}>
        <View style={styles.tabs}>
          {TABS.map((tab) => {
            const currentRoute = state.routes.find((r) => r.name === tab.name);
            const active = state.routes[state.index]?.name === tab.name;

            return (
              <TouchableOpacity
                key={tab.name}
                onPress={() => {
                  const event = currentRoute
                    ? emitter.emit({
                        type: 'tabPress',
                        target: currentRoute.key,
                        canPreventDefault: true,
                      })
                    : null;

                  if (!active && !event?.defaultPrevented) {
                    triggerHaptic.selection();
                    if (currentRoute) {
                      navigateToTab(currentRoute.key);
                    } else {
                      router.push(tab.route);
                    }
                  }
                }}
                activeOpacity={0.7}
                style={[
                  styles.tab,
                  active && [
                    styles.tabActive,
                    {
                      backgroundColor: colors.cardElevated,
                      borderColor: 'transparent',
                      shadowColor: colors.shadow,
                      shadowOpacity: 0,
                    },
                  ],
                ]}
              >
                {active && (
                  <Animated.View
                    key={`${tab.name}-active`}
                    entering={FadeIn.duration(180)}
                    pointerEvents="none"
                    style={[
                      StyleSheet.absoluteFill,
                      styles.tabActiveSurface,
                      { backgroundColor: colors.cardElevated },
                    ]}
                  />
                )}
                <Text
                  style={[
                    styles.tabLabel,
                    {
                      color: active
                        ? colors.textPrimary
                        : isDark
                        ? colors.textSecondary
                        : colors.textMuted,
                    },
                    active && styles.tabLabelActive,
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <HankoStamp
          size="fab"
          onPress={() => router.push('/modals/add-expense')}
        />
      </View>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="overview" />
      <Tabs.Screen name="wishlist" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  barContainer: {
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    paddingTop: 8,
    paddingHorizontal: 16,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tabs: {
    flexDirection: 'row',
    gap: 4,
    flex: 1,
    marginRight: 8,
  },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 0,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {
    backgroundColor: Colors.card,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOpacity: 0,
    elevation: 0,
  },
  tabActiveSurface: {
    borderRadius: 8,
  },
  tabLabel: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    color: Colors.textMuted,
    letterSpacing: 0.1,
  },
  tabLabelActive: {
    fontFamily: Fonts.sansBold,
  },
});

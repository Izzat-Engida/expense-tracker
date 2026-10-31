import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Tabs, router, useSegments } from 'expo-router';
import { Colors, Fonts } from '@/constants/theme';
import { HankoStamp } from '@/components/ui/HankoStamp';

type TabKey = 'index' | 'overview' | 'settings';

interface TabItem {
  name: TabKey;
  label: string;
  route: '/(tabs)' | '/(tabs)/overview' | '/(tabs)/settings';
}

const TABS: TabItem[] = [
  { name: 'index', label: 'Home', route: '/(tabs)' },
  { name: 'overview', label: 'Overview', route: '/(tabs)/overview' },
  { name: 'settings', label: 'Settings', route: '/(tabs)/settings' },
];

function CustomTabBar({ state }: { state: { index: number } }) {
  return (
    <View style={styles.barContainer}>
      <View style={styles.bar}>
        {/* Text tabs */}
        <View style={styles.tabs}>
          {TABS.map((tab, idx) => {
            const active = state.index === idx;
            return (
              <TouchableOpacity
                key={tab.name}
                onPress={() => router.push(tab.route)}
                activeOpacity={0.7}
                style={[styles.tab, active && styles.tabActive]}
              >
                <Text
                  style={[styles.tabLabel, active && styles.tabLabelActive]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* FAB — HankoStamp routes to add-expense modal */}
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
      tabBar={(props) => <CustomTabBar state={props.state} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="overview" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  barContainer: {
    backgroundColor: Colors.background,
    borderTopWidth: 1.5,
    borderTopColor: Colors.border,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    paddingTop: 10,
    paddingHorizontal: 18,
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
    marginRight: 12,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  tabActive: {
    backgroundColor: Colors.card,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 2, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  tabLabel: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.textMuted,
    letterSpacing: 0.2,
  },
  tabLabelActive: {
    fontFamily: Fonts.sansBold,
    color: Colors.textPrimary,
  },
});

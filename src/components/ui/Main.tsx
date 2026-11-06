import React from 'react';
import {
  View,
  ScrollView,
  ViewStyle,
  StyleSheet,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { Colors, useThemeColors } from '@/constants/theme';

const UKIYOE_BG_LIGHT = require('../../../assets/images/ukiyoe-crane-wave.jpg');
const UKIYOE_BG_DARK = require('../../../assets/images/ukiyoe-linework-light.png');

interface ScreenProps {
  children: React.ReactNode;
  scrollable?: boolean;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  edges?: Edge[];
  showArt?: boolean;
  artOpacity?: number;
  keyboardShouldPersistTaps?: 'always' | 'never' | 'handled';
  keyboardDismissMode?: 'none' | 'on-drag' | 'interactive';
}

const Main = ({
  children,
  scrollable = true,
  style,
  contentContainerStyle,
  edges = ['top', 'bottom'],
  showArt = true,
  artOpacity,
  keyboardShouldPersistTaps = 'handled',
  keyboardDismissMode = 'on-drag',
}: ScreenProps) => {
  const { colors, isDark } = useThemeColors();
  const defaultOpacity = isDark ? 0.08 : 0.14;
  const opacity = artOpacity ?? defaultOpacity;
  const artSource = isDark ? UKIYOE_BG_DARK : UKIYOE_BG_LIGHT;

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }, style]}
      edges={edges}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {showArt && (
        <Image
          source={artSource}
          style={[styles.bgArt, { opacity }]}
          resizeMode="cover"
          pointerEvents="none"
        />
      )}
      {scrollable ? (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.container, contentContainerStyle]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps={keyboardShouldPersistTaps}
          keyboardDismissMode={keyboardDismissMode}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, styles.container, contentContainerStyle]}>
          {children}
        </View>
      )}
    </SafeAreaView>
  );
};

export default Main;
export { Main };

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
    position: 'relative',
  },
  bgArt: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
  },
  flex: {
    flex: 1,
  },
  container: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 24,
    gap: 14,
  },
});
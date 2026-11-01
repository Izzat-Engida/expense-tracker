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
import { Colors } from '@/constants/theme';

const UKIYOE_BG = require('../../../assets/images/ukiyoe-crane-wave.jpg');

interface ScreenProps {
  children: React.ReactNode;
  scrollable?: boolean;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  edges?: Edge[];
  showArt?: boolean;
  artOpacity?: number;
}

const Main = ({
  children,
  scrollable = true,
  style,
  contentContainerStyle,
  edges = ['top', 'bottom'],
  showArt = true,
  artOpacity = 0.14,
}: ScreenProps) => {
  return (
    <SafeAreaView style={[styles.safeArea, style]} edges={edges}>
      <StatusBar style="dark" />
      {showArt && (
        <Image
          source={UKIYOE_BG}
          style={[styles.bgArt, { opacity: artOpacity }]}
          resizeMode="cover"
          pointerEvents="none"
        />
      )}
      {scrollable ? (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.container, contentContainerStyle]}
          showsVerticalScrollIndicator={false}
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
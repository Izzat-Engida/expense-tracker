import * as Haptics from 'expo-haptics';
import { useSettingsStore } from '@/stores/settingsStore';

/** Returns true if in-app haptics are currently enabled by the user setting. */
function isHapticsEnabled(): boolean {
  return useSettingsStore.getState().hapticsEnabled;
}

/**
 * Standard in-app haptics (disabled by default, respects user toggle in Settings > Appearance).
 * Used across main app tabs, navigation, modals, and buttons.
 */
export const triggerHaptic = {
  light: () => {
    if (!isHapticsEnabled()) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // safe fallback on platforms without haptics
    }
  },
  medium: () => {
    if (!isHapticsEnabled()) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // safe fallback
    }
  },
  heavy: () => {
    if (!isHapticsEnabled()) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch {
      // safe fallback
    }
  },
  success: () => {
    if (!isHapticsEnabled()) return;
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // safe fallback
    }
  },
  selection: () => {
    if (!isHapticsEnabled()) return;
    try {
      Haptics.selectionAsync();
    } catch {
      // safe fallback
    }
  },
};

/**
 * Auth-specific haptics for security-critical interactions (PIN entry, unlock feedback, errors).
 * Always active to provide immediate tactile feedback regardless of in-app haptics toggle.
 */
export const triggerAuthHaptic = {
  light: () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // safe fallback on platforms without haptics
    }
  },
  medium: () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // safe fallback
    }
  },
  heavy: () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch {
      // safe fallback
    }
  },
  success: () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // safe fallback
    }
  },
  selection: () => {
    try {
      Haptics.selectionAsync();
    } catch {
      // safe fallback
    }
  },
};

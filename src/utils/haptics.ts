import * as Haptics from 'expo-haptics';
import { useSettingsStore } from '@/stores/settingsStore';

/** Returns true if haptics are currently enabled by the user setting. */
function isHapticsEnabled(): boolean {
  return useSettingsStore.getState().hapticsEnabled;
}

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

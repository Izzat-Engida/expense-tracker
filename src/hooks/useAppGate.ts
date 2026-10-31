/**
 * hooks/useAppGate.ts
 *
 * Manages the three top-level app states:
 *
 *   'ONBOARDING'     — First launch; user hasn't completed setup.
 *   'BIOMETRIC_LOCK' — Setup done but the current session isn't authenticated.
 *   'UNLOCKED'       — The app is open and fully usable.
 *
 * State is derived from two SecureStore keys:
 *   - `yohaku.onboarding_complete`  ('1' when done)
 *   - `yohaku.biometric_enabled`    ('1' when the user opted in)
 *
 * Biometric prompt is triggered automatically on mount when the device
 * supports it. Falls back to passcode if biometrics fail (default behaviour
 * of `expo-local-authentication` when `disableDeviceFallback` is not set).
 *
 * @example
 * ```tsx
 * // app/_layout.tsx
 * export default function RootLayout() {
 *   const { gate, completeOnboarding, unlock, enableBiometrics } = useAppGate();
 *
 *   if (gate === 'ONBOARDING') return <Redirect href="/(auth)/onboarding" />;
 *   if (gate === 'BIOMETRIC_LOCK') return <Redirect href="/(auth)/lock" />;
 *   return <Stack />;
 * }
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';

// ─── Constants ───────────────────────────────────────────────────────────────

const KEY_ONBOARDING = 'yohaku.onboarding_complete';
const KEY_BIOMETRIC  = 'yohaku.biometric_enabled';

// ─── Types ───────────────────────────────────────────────────────────────────

export type AppGate = 'ONBOARDING' | 'BIOMETRIC_LOCK' | 'UNLOCKED';

export interface UseAppGateResult {
  /** Current gate state. `null` while the initial async check is in flight. */
  gate: AppGate | null;
  /** Whether biometric hardware exists and has enrolled credentials. */
  biometricAvailable: boolean;
  /**
   * Call from the final onboarding screen when the user finishes setup.
   * Optionally pass `enableBio: true` to turn on biometric lock immediately.
   */
  completeOnboarding: (opts?: { enableBio?: boolean }) => Promise<void>;
  /**
   * Trigger a biometric / passcode prompt to move from
   * `BIOMETRIC_LOCK` → `UNLOCKED`.
   * Returns `true` on success, `false` on cancellation or failure.
   */
  unlock: () => Promise<boolean>;
  /**
   * Toggle the biometric lock on or off from the Settings screen.
   * Requires the user to authenticate first so they can't be locked out.
   */
  setBiometricEnabled: (enabled: boolean) => Promise<void>;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useAppGate(): UseAppGateResult {
  const [gate, setGate] = useState<AppGate | null>(null);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  // ── Boot: read stored flags and auto-prompt if locked ────────────────────

  useEffect(() => {
    let cancelled = false;

    async function init() {
      // Check hardware availability once.
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled  = await LocalAuthentication.isEnrolledAsync();
      const available   = hasHardware && isEnrolled;
      if (!cancelled) setBiometricAvailable(available);

      const [onboardingDone, bioEnabled] = await Promise.all([
        SecureStore.getItemAsync(KEY_ONBOARDING),
        SecureStore.getItemAsync(KEY_BIOMETRIC),
      ]);

      if (!onboardingDone) {
        if (!cancelled) setGate('ONBOARDING');
        return;
      }

      if (bioEnabled === '1' && available) {
        // Auto-prompt on cold start — gives the native biometric sheet
        // immediately without an extra tap.
        if (!cancelled) setGate('BIOMETRIC_LOCK');
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Unlock Yohaku',
          cancelLabel: 'Cancel',
          disableDeviceFallback: false,
        });
        if (!cancelled) setGate(result.success ? 'UNLOCKED' : 'BIOMETRIC_LOCK');
      } else {
        if (!cancelled) setGate('UNLOCKED');
      }
    }

    init();
    return () => { cancelled = true; };
  }, []);

  // ── Actions ──────────────────────────────────────────────────────────────

  const completeOnboarding = useCallback(
    async (opts?: { enableBio?: boolean }) => {
      await SecureStore.setItemAsync(KEY_ONBOARDING, '1');
      if (opts?.enableBio) {
        await SecureStore.setItemAsync(KEY_BIOMETRIC, '1');
      }
      setGate(opts?.enableBio && biometricAvailable ? 'BIOMETRIC_LOCK' : 'UNLOCKED');
    },
    [biometricAvailable],
  );

  const unlock = useCallback(async (): Promise<boolean> => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock Yohaku',
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
    });
    if (result.success) {
      setGate('UNLOCKED');
      return true;
    }
    return false;
  }, []);

  const setBiometricEnabled = useCallback(
    async (enabled: boolean) => {
      if (enabled) {
        // Require authentication before enabling so the user can't
        // accidentally lock themselves in.
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Confirm to enable biometric lock',
          cancelLabel: 'Cancel',
          disableDeviceFallback: false,
        });
        if (!result.success) return; // User cancelled — do nothing.
        await SecureStore.setItemAsync(KEY_BIOMETRIC, '1');
      } else {
        await SecureStore.setItemAsync(KEY_BIOMETRIC, '0');
      }
    },
    [],
  );

  return { gate, biometricAvailable, completeOnboarding, unlock, setBiometricEnabled };
}

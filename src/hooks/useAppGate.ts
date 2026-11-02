import { useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';


const KEY_ONBOARDING = 'yohaku.onboarding_complete';
const KEY_BIOMETRIC  = 'yohaku.biometric_enabled';


export type AppGate = 'ONBOARDING' | 'BIOMETRIC_LOCK' | 'UNLOCKED';

export interface UseAppGateResult {
 
  gate: AppGate | null;

  biometricAvailable: boolean;

  completeOnboarding: (opts?: { enableBio?: boolean }) => Promise<void>;
  unlock: () => Promise<boolean>;

  setBiometricEnabled: (enabled: boolean) => Promise<void>;
}


export function useAppGate(): UseAppGateResult {
  const [gate, setGate] = useState<AppGate | null>(null);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  

  useEffect(() => {
    let cancelled = false;

    async function init() {
    
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
       
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Confirm to enable biometric lock',
          cancelLabel: 'Cancel',
          disableDeviceFallback: false,
        });
        if (!result.success) return; 
        await SecureStore.setItemAsync(KEY_BIOMETRIC, '1');
      } else {
        await SecureStore.setItemAsync(KEY_BIOMETRIC, '0');
      }
    },
    [],
  );

  return { gate, biometricAvailable, completeOnboarding, unlock, setBiometricEnabled };
}

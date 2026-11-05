import { create } from 'zustand';
import * as LocalAuthentication from 'expo-local-authentication';
import type { GoogleAccount, AuthTokens, GoogleUserProfile } from '@/types/auth';
import {
  loadRegisteredAccounts,
  saveRegisteredAccounts,
  getActiveAccountId,
  setActiveAccountId,
  saveAccountPassword,
  verifyAccountPassword,
  saveAccountTokens,
  removeAccountTokens,
  hashPassword,
} from '@/services/auth';
import { setCurrentDatabaseAccount } from '@/db/client';
import { useLedgerStore } from '@/stores/ledgerStore';

interface AuthState {
  accounts: GoogleAccount[];
  activeAccount: GoogleAccount | null;
  pendingAccount: GoogleAccount | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  biometricHardwareAvailable: boolean;
}

interface AuthActions {
  initAuth: () => Promise<void>;
  startAccountOnboarding: (
    profile: GoogleUserProfile,
    tokens: AuthTokens
  ) => Promise<GoogleAccount>;
  completePasswordSetup: (
    password: string,
    biometricEnabled: boolean
  ) => Promise<void>;
  unlockWithPassword: (accountId: string, password: string) => Promise<boolean>;
  unlockWithBiometrics: (accountId: string) => Promise<boolean>;
  selectAccountToUnlock: (accountId: string) => GoogleAccount | null;
  updateBiometricSetting: (accountId: string, enabled: boolean) => Promise<void>;
  changePassword: (accountId: string, newPassword: string) => Promise<void>;
  updateAccountSyncTime: (accountId: string, syncedAt: string) => Promise<void>;
  removeAccount: (accountId: string) => Promise<void>;
  lockSession: () => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>((set, get) => ({
  accounts: [],
  activeAccount: null,
  pendingAccount: null,
  isAuthenticated: false,
  isInitialized: false,
  biometricHardwareAvailable: false,

  initAuth: async () => {
    try {
      const [hasHw, isEnrolled] = await Promise.all([
        LocalAuthentication.hasHardwareAsync(),
        LocalAuthentication.isEnrolledAsync(),
      ]);
      const biometricHardwareAvailable = hasHw && isEnrolled;

      const accounts = await loadRegisteredAccounts();
      const activeId = await getActiveAccountId();

      let activeAccount = accounts.find((a) => a.id === activeId) || null;
      if (!activeAccount && accounts.length > 0) {
        activeAccount = accounts[0];
      }

      set({
        accounts,
        activeAccount,
        isInitialized: true,
        biometricHardwareAvailable,
      });
    } catch {
      set({ isInitialized: true });
    }
  },

  startAccountOnboarding: async (profile, tokens) => {
    const newAcc: GoogleAccount = {
      id: profile.id,
      email: profile.email,
      name: profile.name || profile.email.split('@')[0],
      avatarUrl: profile.picture,
      hasPassword: false,
      biometricEnabled: false,
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      lastSyncedAt: null,
    };

    await saveAccountTokens(newAcc.id, tokens);

    set({ pendingAccount: newAcc });
    return newAcc;
  },

  completePasswordSetup: async (password: string, biometricEnabled: boolean) => {
    const { pendingAccount, accounts } = get();
    if (!pendingAccount) {
      throw new Error('No pending account found');
    }


    await saveAccountPassword(pendingAccount.id, password);

    const readyAccount: GoogleAccount = {
      ...pendingAccount,
      hasPassword: true,
      biometricEnabled,
      lastActiveAt: new Date().toISOString(),
    };

    const existingIdx = accounts.findIndex((a) => a.id === readyAccount.id);
    let updatedAccounts: GoogleAccount[];
    if (existingIdx >= 0) {
      updatedAccounts = [...accounts];
      updatedAccounts[existingIdx] = readyAccount;
    } else {
      updatedAccounts = [readyAccount, ...accounts];
    }

    await saveRegisteredAccounts(updatedAccounts);
    await setActiveAccountId(readyAccount.id);

    setCurrentDatabaseAccount(readyAccount.id);
    await useLedgerStore.getState().loadAll();

    set({
      accounts: updatedAccounts,
      activeAccount: readyAccount,
      pendingAccount: null,
      isAuthenticated: true,
    });
  },

  selectAccountToUnlock: (accountId: string) => {
    const account = get().accounts.find((a) => a.id === accountId) || null;
    return account;
  },

  unlockWithPassword: async (accountId: string, password: string) => {
    const valid = await verifyAccountPassword(accountId, password);
    if (!valid) return false;

    const account = get().accounts.find((a) => a.id === accountId);
    if (!account) return false;

    const updatedAccount = {
      ...account,
      lastActiveAt: new Date().toISOString(),
    };
    const updatedAccounts = get().accounts.map((a) =>
      a.id === accountId ? updatedAccount : a
    );

    await saveRegisteredAccounts(updatedAccounts);
    await setActiveAccountId(accountId);

    setCurrentDatabaseAccount(accountId);
    await useLedgerStore.getState().loadAll();

    set({
      accounts: updatedAccounts,
      activeAccount: updatedAccount,
      isAuthenticated: true,
    });

    return true;
  },

  unlockWithBiometrics: async (accountId: string) => {
    const account = get().accounts.find((a) => a.id === accountId);
    if (!account) return false;

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: `Unlock ${account.name || account.email}`,
        fallbackLabel: 'Use Account Password',
        disableDeviceFallback: false,
      });

      if (!result.success) return false;

      const updatedAccount = {
        ...account,
        lastActiveAt: new Date().toISOString(),
      };
      const updatedAccounts = get().accounts.map((a) =>
        a.id === accountId ? updatedAccount : a
      );

      await saveRegisteredAccounts(updatedAccounts);
      await setActiveAccountId(accountId);

      setCurrentDatabaseAccount(accountId);
      await useLedgerStore.getState().loadAll();

      set({
        accounts: updatedAccounts,
        activeAccount: updatedAccount,
        isAuthenticated: true,
      });

      return true;
    } catch {
      return false;
    }
  },

  updateBiometricSetting: async (accountId: string, enabled: boolean) => {
    const updatedAccounts = get().accounts.map((a) =>
      a.id === accountId ? { ...a, biometricEnabled: enabled } : a
    );
    await saveRegisteredAccounts(updatedAccounts);
    set((s) => ({
      accounts: updatedAccounts,
      activeAccount:
        s.activeAccount?.id === accountId
          ? { ...s.activeAccount, biometricEnabled: enabled }
          : s.activeAccount,
    }));
  },

  changePassword: async (accountId: string, newPassword: string) => {
    await saveAccountPassword(accountId, newPassword);
  },

  updateAccountSyncTime: async (accountId: string, syncedAt: string) => {
    const updatedAccounts = get().accounts.map((a) =>
      a.id === accountId ? { ...a, lastSyncedAt: syncedAt } : a
    );
    await saveRegisteredAccounts(updatedAccounts);
    set((s) => ({
      accounts: updatedAccounts,
      activeAccount:
        s.activeAccount?.id === accountId
          ? { ...s.activeAccount, lastSyncedAt: syncedAt }
          : s.activeAccount,
    }));
  },

  removeAccount: async (accountId: string) => {
    const remaining = get().accounts.filter((a) => a.id !== accountId);
    await saveRegisteredAccounts(remaining);
    await removeAccountTokens(accountId);

    let nextActive = remaining.length > 0 ? remaining[0] : null;
    await setActiveAccountId(nextActive ? nextActive.id : null);
    setCurrentDatabaseAccount(nextActive ? nextActive.id : null);

    if (nextActive) {
      await useLedgerStore.getState().loadAll();
    }

    set({
      accounts: remaining,
      activeAccount: nextActive,
      isAuthenticated: !!nextActive,
    });
  },

  lockSession: () => {
    set({ isAuthenticated: false });
  },
}));

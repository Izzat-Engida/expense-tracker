import { create } from 'zustand';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Crypto from 'expo-crypto';
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
  removeAccountPassword,
} from '@/services/auth';
import { setCurrentDatabaseAccount, deleteAccountDatabase } from '@/db/client';
import { deleteAccountFromFirebase } from '@/services/firebaseSync';
import { useLedgerStore } from '@/stores/ledgerStore';
import { useSyncStore } from '@/stores/syncStore';

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
  startLocalAccountOnboarding: () => Promise<GoogleAccount>;
  completePasswordSetup: (
    password: string,
    biometricEnabled: boolean,
    displayName?: string
  ) => Promise<void>;
  unlockWithPassword: (accountId: string, password: string) => Promise<boolean>;
  unlockWithBiometrics: (accountId: string) => Promise<boolean>;
  selectAccountToUnlock: (accountId: string) => GoogleAccount | null;
  updateBiometricSetting: (accountId: string, enabled: boolean) => Promise<void>;
  changePassword: (accountId: string, newPassword: string) => Promise<void>;
  updateAccountSyncTime: (accountId: string, syncedAt: string) => Promise<void>;
  removeAccount: (accountId: string) => Promise<void>;
  deleteAccount: (accountId: string) => Promise<void>;
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

  startLocalAccountOnboarding: async () => {
    const newAcc: GoogleAccount = {
      id: `local_${Crypto.randomUUID()}`,
      email: '',
      name: '',
      hasPassword: false,
      biometricEnabled: false,
      isLocal: true,
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      lastSyncedAt: null,
    };

    // No tokens and no Firebase call — guest profiles are local SQLite only.
    set({ pendingAccount: newAcc });
    return newAcc;
  },

  completePasswordSetup: async (password: string, biometricEnabled: boolean, displayName?: string) => {
    const { pendingAccount, accounts } = get();
    if (!pendingAccount) {
      throw new Error('No pending account found');
    }

    const name = pendingAccount.isLocal
      ? (displayName?.trim() || pendingAccount.name || 'Guest')
      : (pendingAccount.name || pendingAccount.email.split('@')[0] || 'User');

    let accountId = pendingAccount.id;
    if (pendingAccount.isLocal) {
      const baseSlug = (displayName?.trim() || 'guest')
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, '_')
        .slice(0, 24) || 'guest';

      // Check if another account in accounts has the same name or matching id
      const hasConflict = accounts.some(
        (a) =>
          a.id !== pendingAccount.id &&
          (a.name.trim().toLowerCase() === name.toLowerCase() ||
            a.id === `local_${baseSlug}` ||
            a.id.startsWith(`local_${baseSlug}_`))
      );

      if (hasConflict) {
        accountId = `local_${baseSlug}_${Crypto.randomUUID().slice(0, 8)}`;
      } else {
        accountId = `local_${baseSlug}`;
      }
    }

    await saveAccountPassword(accountId, password);

    const readyAccount: GoogleAccount = {
      ...pendingAccount,
      id: accountId,
      name,
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

    // On new login/device, immediately download cloud data if available.
    // Guest profiles are local-only and must never touch Firebase.
    if (!readyAccount.isLocal) {
      try {
        await useSyncStore.getState().syncNow();
      } catch (e) {
        console.warn('Initial login sync notice:', e);
      }
    }

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
    await removeAccountPassword(accountId);

    let nextActive = remaining.length > 0 ? remaining[0] : null;
    await setActiveAccountId(nextActive ? nextActive.id : null);
    setCurrentDatabaseAccount(nextActive ? nextActive.id : null);

    if (nextActive) {
      await useLedgerStore.getState().loadAll();
    } else {
      useLedgerStore.setState({
        expenses: [],
        incomes: [],
        budgets: [],
        savings: [],
        wishlist: [],
      });
    }

    set({
      accounts: remaining,
      activeAccount: nextActive,
      isAuthenticated: !!nextActive,
    });
  },

  deleteAccount: async (accountId: string) => {
    const account = get().accounts.find((a) => a.id === accountId);

    // 1. Permanently delete cloud data from Firebase (skip for local guest profiles)
    if (!account?.isLocal) {
      try {
        await deleteAccountFromFirebase(accountId);
      } catch (e) {
        console.warn('Could not delete Firebase cloud data:', e);
      }
    }

    // 2. Permanently delete local SQLite database file
    await deleteAccountDatabase(accountId);

    // 3. Remove SecureStore keys
    await removeAccountTokens(accountId);
    await removeAccountPassword(accountId);

    // 4. Remove account from local registered accounts list
    const remaining = get().accounts.filter((a) => a.id !== accountId);
    await saveRegisteredAccounts(remaining);

    let nextActive = remaining.length > 0 ? remaining[0] : null;
    await setActiveAccountId(nextActive ? nextActive.id : null);
    setCurrentDatabaseAccount(nextActive ? nextActive.id : null);

    if (nextActive) {
      await useLedgerStore.getState().loadAll();
    } else {
      useLedgerStore.setState({
        expenses: [],
        incomes: [],
        budgets: [],
        savings: [],
        wishlist: [],
      });
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

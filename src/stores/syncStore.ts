import { create } from 'zustand';
import {
  isOnline,
  getPendingOutboxCount,
  syncAccountWithFirebase,
  type SyncResult,
} from '@/services/firebaseSync';
import { useAuthStore } from './authStore';
import { useLedgerStore } from './ledgerStore';

interface SyncState {
  syncStatus: 'idle' | 'syncing' | 'offline' | 'success' | 'error';
  isDeviceOnline: boolean;
  pendingCount: number;
  lastSyncedAt: string | null;
  statusMessage: string;
}

interface SyncActions {
  refreshStatus: () => Promise<void>;
  syncNow: () => Promise<SyncResult | null>;
  autoSyncIfConnected: () => Promise<void>;
}

type SyncStore = SyncState & SyncActions;

export const useSyncStore = create<SyncStore>((set, get) => ({
  syncStatus: 'idle',
  isDeviceOnline: true,
  pendingCount: 0,
  lastSyncedAt: null,
  statusMessage: 'Ready to sync',

  refreshStatus: async () => {
    const activeAccount = useAuthStore.getState().activeAccount;
    if (activeAccount?.isLocal) {
      set({
        isDeviceOnline: true,
        pendingCount: 0,
        lastSyncedAt: null,
        syncStatus: 'idle',
        statusMessage: 'Local profile (on-device only)',
      });
      return;
    }

    const online = await isOnline();
    const count = await getPendingOutboxCount(activeAccount?.id);

    set({
      isDeviceOnline: online,
      pendingCount: count,
      lastSyncedAt: activeAccount?.lastSyncedAt || null,
      syncStatus: !online ? 'offline' : get().syncStatus === 'syncing' ? 'syncing' : 'idle',
      statusMessage: !online
        ? 'Offline (changes saved in local SQLite)'
        : count > 0
        ? `${count} change${count > 1 ? 's' : ''} queued`
        : 'Up to date with Cloud (Firestore)',
    });
  },

  syncNow: async () => {
    const activeAccount = useAuthStore.getState().activeAccount;
    if (!activeAccount) {
      set({
        syncStatus: 'error',
        statusMessage: 'No active account selected',
      });
      return null;
    }

    // Guest accounts operate strictly in local SQLite and never sync to cloud.
    if (activeAccount.isLocal) {
      set({
        syncStatus: 'idle',
        statusMessage: 'Local profile (cloud sync disabled)',
      });
      return null;
    }

    set({ syncStatus: 'syncing', statusMessage: 'Syncing with Firestore…' });

    try {
      const result = await syncAccountWithFirebase(activeAccount.id);

      if (result.success) {
        await useAuthStore.getState().updateAccountSyncTime(activeAccount.id, result.syncedAt);
        await useLedgerStore.getState().loadAll();

        set({
          syncStatus: 'success',
          lastSyncedAt: result.syncedAt,
          pendingCount: 0,
          statusMessage: 'Sync complete',
        });
      } else {
        set({
          syncStatus: result.reason === 'offline' ? 'offline' : 'error',
          statusMessage: result.message,
        });
      }

      return result;
    } catch (err: any) {
      const msg = err?.message || 'Sync failed unexpectedly';
      set({ syncStatus: 'error', statusMessage: msg });
      return { success: false, reason: 'error', message: msg };
    }
  },

  autoSyncIfConnected: async () => {
    const activeAccount = useAuthStore.getState().activeAccount;
    if (!activeAccount || activeAccount.isLocal) return;

    const online = await isOnline();
    if (!online) return;

    const count = await getPendingOutboxCount(activeAccount.id);
    if (count > 0 || !activeAccount.lastSyncedAt) {
      await get().syncNow();
    }
  },
}));

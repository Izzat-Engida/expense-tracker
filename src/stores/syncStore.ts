import { create } from 'zustand';
import {
  isOnline,
  getPendingOutboxCount,
  syncAccountWithGoogleDrive,
  type SyncResult,
} from '@/services/driveSync';
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
        : 'Up to date with Google Drive',
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

    set({ syncStatus: 'syncing', statusMessage: 'Connecting to Google Drive…' });

    const result = await syncAccountWithGoogleDrive(activeAccount.id);

    if (result.success) {
      await useAuthStore.getState().updateAccountSyncTime(activeAccount.id, result.syncedAt);
      await useLedgerStore.getState().loadAll();
      const count = await getPendingOutboxCount(activeAccount.id);

      set({
        syncStatus: 'success',
        lastSyncedAt: result.syncedAt,
        pendingCount: count,
        statusMessage: result.message,
      });

      setTimeout(() => {
        if (get().syncStatus === 'success') {
          set({ syncStatus: 'idle' });
        }
      }, 3000);
    } else {
      set({
        syncStatus: result.reason === 'offline' ? 'offline' : 'error',
        statusMessage: result.message,
      });
    }

    return result;
  },

  autoSyncIfConnected: async () => {
    const online = await isOnline();
    if (!online) return;
    const activeAccount = useAuthStore.getState().activeAccount;
    if (!activeAccount) return;

    await get().syncNow();
  },
}));

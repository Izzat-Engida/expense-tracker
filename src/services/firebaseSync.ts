import * as Network from 'expo-network';
import { getDb } from '@/db/client';
import { db as firestoreDb } from '../../firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { Expense, Income, Budget, Saving, WishlistItem } from '@/db/types';

export interface SyncPayload {
  schema_version: number;
  account_id: string;
  synced_at: string;
  expenses: Expense[];
  incomes: Income[];
  budgets: Budget[];
  savings: Saving[];
  wishlist: WishlistItem[];
}

export type SyncResult =
  | { success: true; message: string; syncedAt: string; outboxDrained: number }
  | { success: false; reason: 'offline' | 'unauthenticated' | 'error'; message: string };

export async function isOnline(): Promise<boolean> {
  try {
    const state = await Network.getNetworkStateAsync();
    return !!(state.isConnected && state.isInternetReachable !== false);
  } catch {
    return false;
  }
}

export async function getPendingOutboxCount(accountId?: string | null): Promise<number> {
  try {
    const localDb = await getDb(accountId);
    const row = await localDb.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM sync_outbox WHERE synced = 0'
    );
    return row?.count ?? 0;
  } catch {
    return 0;
  }
}

export async function syncAccountWithFirebase(accountId: string): Promise<SyncResult> {
  const online = await isOnline();
  if (!online) {
    return {
      success: false,
      reason: 'offline',
      message: 'No internet connection detected. Data is saved locally in SQLite.',
    };
  }

  const localDb = await getDb(accountId);

  try {
    const userDocRef = doc(firestoreDb, 'users', accountId, 'data', 'ledger');
    const docSnap = await getDoc(userDocRef);

    if (docSnap.exists()) {
      const cloudData = docSnap.data() as SyncPayload;
      if (cloudData && Array.isArray(cloudData.expenses)) {
        await localDb.withTransactionAsync(async () => {
          for (const exp of cloudData.expenses) {
            await localDb.runAsync(
              `INSERT INTO expenses (id, title, amount, category, note, date, created_at, updated_at, deleted_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
               ON CONFLICT(id) DO UPDATE SET
                 title = excluded.title,
                 amount = excluded.amount,
                 category = excluded.category,
                 note = excluded.note,
                 date = excluded.date,
                 updated_at = excluded.updated_at,
                 deleted_at = excluded.deleted_at
               WHERE excluded.updated_at >= expenses.updated_at`,
              [exp.id, exp.title, exp.amount, exp.category, exp.note || null, exp.date, exp.created_at, exp.updated_at, exp.deleted_at || null]
            );
          }

          if (cloudData.incomes) {
            for (const inc of cloudData.incomes) {
              await localDb.runAsync(
                `INSERT INTO incomes (id, source_name, amount, month_key, updated_at)
                 VALUES (?, ?, ?, ?, ?)
                 ON CONFLICT(id) DO UPDATE SET
                   source_name = excluded.source_name,
                   amount = excluded.amount,
                   month_key = excluded.month_key,
                   updated_at = excluded.updated_at
                 WHERE excluded.updated_at >= incomes.updated_at`,
                [inc.id, inc.source_name, inc.amount, inc.month_key, inc.updated_at]
              );
            }
          }

          if (cloudData.budgets) {
            for (const b of cloudData.budgets) {
              await localDb.runAsync(
                `INSERT INTO budgets (id, category, percentage_or_limit, month_key, updated_at)
                 VALUES (?, ?, ?, ?, ?)
                 ON CONFLICT(id) DO UPDATE SET
                   category = excluded.category,
                   percentage_or_limit = excluded.percentage_or_limit,
                   month_key = excluded.month_key,
                   updated_at = excluded.updated_at
                 WHERE excluded.updated_at >= budgets.updated_at`,
                [b.id, b.category, b.percentage_or_limit, b.month_key, b.updated_at]
              );
            }
          }

          if (cloudData.savings) {
            for (const s of cloudData.savings) {
              await localDb.runAsync(
                `INSERT INTO savings (id, title, amount, category, wishlist_id, note, date, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                 ON CONFLICT(id) DO UPDATE SET
                   title = excluded.title,
                   amount = excluded.amount,
                   category = excluded.category,
                   wishlist_id = excluded.wishlist_id,
                   note = excluded.note,
                   date = excluded.date,
                   updated_at = excluded.updated_at
                 WHERE excluded.updated_at >= savings.updated_at`,
                [s.id, s.title, s.amount, s.category, s.wishlist_id || null, s.note || null, s.date, s.created_at, s.updated_at]
              );
            }
          }

          if (cloudData.wishlist) {
            for (const w of cloudData.wishlist) {
              await localDb.runAsync(
                `INSERT INTO wishlist (id, title, target_amount, saved_amount, category, priority, note, is_purchased, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                 ON CONFLICT(id) DO UPDATE SET
                   title = excluded.title,
                   target_amount = excluded.target_amount,
                   saved_amount = excluded.saved_amount,
                   category = excluded.category,
                   priority = excluded.priority,
                   note = excluded.note,
                   is_purchased = excluded.is_purchased,
                   updated_at = excluded.updated_at
                 WHERE excluded.updated_at >= wishlist.updated_at`,
                [w.id, w.title, w.target_amount, w.saved_amount, w.category, w.priority, w.note || null, w.is_purchased, w.created_at, w.updated_at]
              );
            }
          }
        });
      }
    }

    const expenses = await localDb.getAllAsync<Expense>('SELECT * FROM expenses');
    const incomes = await localDb.getAllAsync<Income>('SELECT * FROM incomes');
    const budgets = await localDb.getAllAsync<Budget>('SELECT * FROM budgets');
    const savings = await localDb.getAllAsync<Saving>('SELECT * FROM savings');
    const wishlist = await localDb.getAllAsync<WishlistItem>('SELECT * FROM wishlist');

    const syncedAt = new Date().toISOString();
    const payload: SyncPayload = {
      schema_version: 1,
      account_id: accountId,
      synced_at: syncedAt,
      expenses,
      incomes,
      budgets,
      savings,
      wishlist,
    };

    await setDoc(userDocRef, payload, { merge: true });

    const outboxResult = await localDb.runAsync('UPDATE sync_outbox SET synced = 1 WHERE synced = 0');
    const drained = outboxResult.changes ?? 0;

    return {
      success: true,
      message: 'Cloud sync complete (synced with Firebase Firestore).',
      syncedAt,
      outboxDrained: drained,
    };
  } catch (err: any) {
    return {
      success: false,
      reason: 'error',
      message: err?.message || 'Failed to sync with Firebase Firestore.',
    };
  }
}

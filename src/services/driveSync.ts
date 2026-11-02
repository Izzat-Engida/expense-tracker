import * as Network from 'expo-network';
import { getDb } from '@/db/client';
import { refreshGoogleTokenIfNeeded, getAccountTokens } from './auth';
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

const DRIVE_FILE_NAME = 'yohaku_ledger_sync.json';
const DRIVE_LIST_URL = `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=name='${DRIVE_FILE_NAME}'&fields=files(id,name,modifiedTime)`;
const DRIVE_UPLOAD_MULTIPART_URL = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
const DRIVE_UPDATE_MEDIA_URL = (fileId: string) =>
  `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`;
const DRIVE_GET_MEDIA_URL = (fileId: string) =>
  `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;


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
    const db = await getDb(accountId);
    const row = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM sync_outbox WHERE synced = 0'
    );
    return row?.count ?? 0;
  } catch {
    return 0;
  }
}


export async function syncAccountWithGoogleDrive(accountId: string): Promise<SyncResult> {
 
  const online = await isOnline();
  if (!online) {
    return {
      success: false,
      reason: 'offline',
      message: 'No internet connection detected. Data is saved locally in SQLite.',
    };
  }


  const token = await refreshGoogleTokenIfNeeded(accountId);
  const db = await getDb(accountId);


  if (!token || token.startsWith('mock_')) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const pendingCount = await getPendingOutboxCount(accountId);
    await db.runAsync('UPDATE sync_outbox SET synced = 1 WHERE synced = 0');
    const nowIso = new Date().toISOString();
    return {
      success: true,
      message: 'Synced locally (Dev / Offline mode)',
      syncedAt: nowIso,
      outboxDrained: pendingCount,
    };
  }

  try {
    const headers = { Authorization: `Bearer ${token}` };

    const listRes = await fetch(DRIVE_LIST_URL, { headers });
    if (!listRes.ok) {
      if (listRes.status === 401) {
        return {
          success: false,
          reason: 'unauthenticated',
          message: 'Google authorization expired. Please re-authenticate.',
        };
      }
      throw new Error(`Google Drive API error: ${listRes.statusText}`);
    }

    const listData = await listRes.json();
    const existingFile = listData.files && listData.files.length > 0 ? listData.files[0] : null;

    let remotePayload: SyncPayload | null = null;
    if (existingFile) {
      const getRes = await fetch(DRIVE_GET_MEDIA_URL(existingFile.id), { headers });
      if (getRes.ok) {
        remotePayload = (await getRes.json()) as SyncPayload;
      }
    }

    if (remotePayload) {
      await db.withExclusiveTransactionAsync(async (txn) => {
        
        if (Array.isArray(remotePayload?.expenses)) {
          for (const exp of remotePayload.expenses) {
            const local = await txn.getFirstAsync<Expense>(
              'SELECT * FROM expenses WHERE id = ?',
              [exp.id]
            );
            if (!local) {
              await txn.runAsync(
                `INSERT INTO expenses (id, title, amount, category, note, date, created_at, updated_at, deleted_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                  exp.id,
                  exp.title,
                  exp.amount,
                  exp.category,
                  exp.note ?? null,
                  exp.date,
                  exp.created_at,
                  exp.updated_at,
                  exp.deleted_at ?? null,
                ]
              );
            } else if (new Date(exp.updated_at) > new Date(local.updated_at)) {
              await txn.runAsync(
                `UPDATE expenses SET title = ?, amount = ?, category = ?, note = ?, date = ?, updated_at = ?, deleted_at = ?
                 WHERE id = ?`,
                [
                  exp.title,
                  exp.amount,
                  exp.category,
                  exp.note ?? null,
                  exp.date,
                  exp.updated_at,
                  exp.deleted_at ?? null,
                  exp.id,
                ]
              );
            }
          }
        }

   
        if (Array.isArray(remotePayload?.incomes)) {
          for (const inc of remotePayload.incomes) {
            const local = await txn.getFirstAsync<Income>(
              'SELECT * FROM incomes WHERE id = ?',
              [inc.id]
            );
            if (!local) {
              await txn.runAsync(
                `INSERT INTO incomes (id, source_name, amount, month_key, updated_at)
                 VALUES (?, ?, ?, ?, ?)`,
                [inc.id, inc.source_name, inc.amount, inc.month_key, inc.updated_at]
              );
            } else if (new Date(inc.updated_at) > new Date(local.updated_at)) {
              await txn.runAsync(
                `UPDATE incomes SET source_name = ?, amount = ?, month_key = ?, updated_at = ?
                 WHERE id = ?`,
                [inc.source_name, inc.amount, inc.month_key, inc.updated_at, inc.id]
              );
            }
          }
        }

     
        if (Array.isArray(remotePayload?.budgets)) {
          for (const bud of remotePayload.budgets) {
            const local = await txn.getFirstAsync<Budget>(
              'SELECT * FROM budgets WHERE id = ?',
              [bud.id]
            );
            if (!local) {
              await txn.runAsync(
                `INSERT INTO budgets (id, category, percentage_or_limit, month_key, updated_at)
                 VALUES (?, ?, ?, ?, ?)`,
                [bud.id, bud.category, bud.percentage_or_limit, bud.month_key, bud.updated_at]
              );
            } else if (new Date(bud.updated_at) > new Date(local.updated_at)) {
              await txn.runAsync(
                `UPDATE budgets SET category = ?, percentage_or_limit = ?, month_key = ?, updated_at = ?
                 WHERE id = ?`,
                [bud.category, bud.percentage_or_limit, bud.month_key, bud.updated_at, bud.id]
              );
            }
          }
        }

   
        if (Array.isArray(remotePayload?.wishlist)) {
          for (const w of remotePayload.wishlist) {
            const local = await txn.getFirstAsync<WishlistItem>(
              'SELECT * FROM wishlist WHERE id = ?',
              [w.id]
            );
            if (!local) {
              await txn.runAsync(
                `INSERT INTO wishlist (id, title, target_amount, saved_amount, category, priority, note, is_purchased, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                  w.id,
                  w.title,
                  w.target_amount,
                  w.saved_amount,
                  w.category,
                  w.priority,
                  w.note ?? null,
                  w.is_purchased,
                  w.created_at,
                  w.updated_at,
                ]
              );
            } else if (new Date(w.updated_at) > new Date(local.updated_at)) {
              await txn.runAsync(
                `UPDATE wishlist SET title = ?, target_amount = ?, saved_amount = ?, category = ?, priority = ?, note = ?, is_purchased = ?, updated_at = ?
                 WHERE id = ?`,
                [
                  w.title,
                  w.target_amount,
                  w.saved_amount,
                  w.category,
                  w.priority,
                  w.note ?? null,
                  w.is_purchased,
                  w.updated_at,
                  w.id,
                ]
              );
            }
          }
        }
      });
    }

    const [expenses, incomes, budgets, savings, wishlist] = await Promise.all([
      db.getAllAsync<Expense>('SELECT * FROM expenses', []),
      db.getAllAsync<Income>('SELECT * FROM incomes', []),
      db.getAllAsync<Budget>('SELECT * FROM budgets', []),
      db.getAllAsync<Saving>('SELECT * FROM savings', []),
      db.getAllAsync<WishlistItem>('SELECT * FROM wishlist', []),
    ]);

    const nowIso = new Date().toISOString();
    const uploadPayload: SyncPayload = {
      schema_version: 1,
      account_id: accountId,
      synced_at: nowIso,
      expenses,
      incomes,
      budgets,
      savings,
      wishlist,
    };

    const payloadJson = JSON.stringify(uploadPayload);

    if (existingFile) {
    
      const patchRes = await fetch(DRIVE_UPDATE_MEDIA_URL(existingFile.id), {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: payloadJson,
      });

      if (!patchRes.ok) {
        throw new Error(`Failed to update Drive file: ${patchRes.statusText}`);
      }
    } else {
      
      const boundary = 'foo_bar_baz_yohaku';
      const metadata = JSON.stringify({
        name: DRIVE_FILE_NAME,
        parents: ['appDataFolder'],
      });

      const multipartBody =
        `--${boundary}\r\n` +
        `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
        `${metadata}\r\n` +
        `--${boundary}\r\n` +
        `Content-Type: application/json\r\n\r\n` +
        `${payloadJson}\r\n` +
        `--${boundary}--`;

      const createRes = await fetch(DRIVE_UPLOAD_MULTIPART_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: multipartBody,
      });

      if (!createRes.ok) {
        throw new Error(`Failed to create Drive file: ${createRes.statusText}`);
      }
    }


    const pendingCount = await getPendingOutboxCount(accountId);
    await db.runAsync('UPDATE sync_outbox SET synced = 1 WHERE synced = 0');

    return {
      success: true,
      message: 'Synced successfully with Google Drive',
      syncedAt: nowIso,
      outboxDrained: pendingCount,
    };
  } catch (err: any) {
    return {
      success: false,
      reason: 'error',
      message: err?.message || 'Sync failed due to an unexpected error.',
    };
  }
}

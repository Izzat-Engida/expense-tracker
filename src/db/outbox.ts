/**
 * db/outbox.ts
 *
 * Helper that appends a row to `sync_outbox` inside an existing transaction.
 * Every mutating action in `useLedger` calls this so no mutation is ever
 * lost from the sync queue.
 */

import { type SQLiteDatabase } from 'expo-sqlite';
import { type SyncTableName, type SyncOperation } from './types';

/** A lightweight stand-in for crypto.randomUUID() on RN (no web Crypto API). */
function uuid(): string {
  // expo-crypto is available, but we keep this file dependency-free.
  // Simple RFC-4122 v4 compatible generator using Math.random.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Insert one pending outbox entry.
 * Must be called inside the same `withExclusiveTransactionAsync` block as
 * the primary mutation so they commit atomically.
 */
export async function enqueueOutbox(
  db: SQLiteDatabase,
  table_name: SyncTableName,
  record_id: string,
  operation: SyncOperation,
  payload: object,
): Promise<void> {
  await db.runAsync(
    `INSERT INTO sync_outbox
      (id, table_name, record_id, operation, payload_json, created_at, synced)
     VALUES (?, ?, ?, ?, ?, ?, 0)`,
    [
      uuid(),
      table_name,
      record_id,
      operation,
      JSON.stringify(payload),
      new Date().toISOString(),
    ],
  );
}

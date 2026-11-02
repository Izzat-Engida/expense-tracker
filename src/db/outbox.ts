import { type SQLiteDatabase } from 'expo-sqlite';
import { type SyncTableName, type SyncOperation } from './types';

function uuid(): string {

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}


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

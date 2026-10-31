/**
 * db/client.ts
 *
 * Single shared SQLite database handle for the app.
 * Open it once with `getDb()` — subsequent calls return the cached handle.
 *
 * The `SQLiteProvider` component in `_layout.tsx` is the recommended React
 * integration; this module gives you the bare `SQLiteDatabase` for use
 * outside of React (e.g. in Zustand actions or background tasks).
 */

import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';
import { ALL_MIGRATIONS } from './schema';

const DB_NAME = 'yohaku.db';

let _db: SQLiteDatabase | null = null;

/**
 * Returns the shared, fully-initialised database instance.
 * Safe to call multiple times — the database is opened and migrated exactly once.
 */
export async function getDb(): Promise<SQLiteDatabase> {
  if (_db) return _db;

  const db = await openDatabaseAsync(DB_NAME);

  // Run WAL mode for better concurrent read performance.
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync('PRAGMA foreign_keys = ON;');

  // Apply all DDL migrations idempotently.
  for (const sql of ALL_MIGRATIONS) {
    await db.execAsync(sql);
  }

  _db = db;
  return db;
}

/**
 * `onInit` callback for `<SQLiteProvider>`.
 * Pass this to the provider so the component-tree version also runs migrations.
 *
 * @example
 * ```tsx
 * <SQLiteProvider databaseName="yohaku.db" onInit={migrateDb}>
 *   <App />
 * </SQLiteProvider>
 * ```
 */
export async function migrateDb(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync('PRAGMA foreign_keys = ON;');
  for (const sql of ALL_MIGRATIONS) {
    await db.execAsync(sql);
  }
  // Keep the module-level handle in sync so `getDb()` callers get
  // the same connection that the Provider already opened.
  _db = db;
}

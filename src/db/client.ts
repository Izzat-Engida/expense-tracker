import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';
import { ALL_MIGRATIONS } from './schema';

const dbInstances = new Map<string, SQLiteDatabase>();
let currentActiveAccountId: string | null = null;

export function sanitizeAccountId(accountId: string): string {
  return accountId.replace(/[^a-zA-Z0-9_-]/g, '_');
}

export function getDatabaseName(accountId?: string | null): string {
  if (!accountId || accountId === 'default') {
    return 'yohaku.db';
  }
  return `yohaku_${sanitizeAccountId(accountId)}.db`;
}

export function setCurrentDatabaseAccount(accountId: string | null): void {
  currentActiveAccountId = accountId;
}

export function getCurrentDatabaseAccount(): string | null {
  return currentActiveAccountId;
}

export async function getDb(forAccountId?: string | null): Promise<SQLiteDatabase> {
  const targetId = forAccountId !== undefined ? forAccountId : currentActiveAccountId;
  const dbName = getDatabaseName(targetId);

  const existing = dbInstances.get(dbName);
  if (existing) {
    return existing;
  }

  const db = await openDatabaseAsync(dbName);

  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync('PRAGMA foreign_keys = ON;');

  for (const sql of ALL_MIGRATIONS) {
    await db.execAsync(sql);
  }

  dbInstances.set(dbName, db);
  return db;
}


export async function migrateDb(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync('PRAGMA foreign_keys = ON;');
  for (const sql of ALL_MIGRATIONS) {
    await db.execAsync(sql);
  }
}

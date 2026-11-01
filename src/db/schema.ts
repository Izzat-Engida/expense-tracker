/**
 * db/schema.ts
 *
 * Canonical SQL DDL for every table in the Yohaku local database.
 * All timestamps are stored as ISO-8601 strings (TEXT) for portability.
 * `deleted_at` is used for soft-deletes so the sync outbox can emit a
 * proper DELETE operation before the row is physically removed.
 */

export const CREATE_EXPENSES_TABLE = `
  CREATE TABLE IF NOT EXISTS expenses (
    id          TEXT PRIMARY KEY NOT NULL,
    title       TEXT NOT NULL,
    amount      REAL NOT NULL,
    category    TEXT NOT NULL,
    note        TEXT,
    date        TEXT NOT NULL,
    created_at  TEXT NOT NULL,
    updated_at  TEXT NOT NULL,
    deleted_at  TEXT
  );
` as const;

export const CREATE_INCOMES_TABLE = `
  CREATE TABLE IF NOT EXISTS incomes (
    id          TEXT PRIMARY KEY NOT NULL,
    source_name TEXT NOT NULL,
    amount      REAL NOT NULL,
    month_key   TEXT NOT NULL,
    updated_at  TEXT NOT NULL
  );
` as const;

export const CREATE_BUDGETS_TABLE = `
  CREATE TABLE IF NOT EXISTS budgets (
    id                   TEXT PRIMARY KEY NOT NULL,
    category             TEXT NOT NULL,
    percentage_or_limit  REAL NOT NULL,
    month_key            TEXT NOT NULL,
    updated_at           TEXT NOT NULL
  );
` as const;

export const CREATE_SAVINGS_TABLE = `
  CREATE TABLE IF NOT EXISTS savings (
    id          TEXT PRIMARY KEY NOT NULL,
    title       TEXT NOT NULL,
    amount      REAL NOT NULL,
    category    TEXT NOT NULL,
    wishlist_id TEXT,
    note        TEXT,
    date        TEXT NOT NULL,
    created_at  TEXT NOT NULL,
    updated_at  TEXT NOT NULL
  );
` as const;

export const CREATE_WISHLIST_TABLE = `
  CREATE TABLE IF NOT EXISTS wishlist (
    id            TEXT PRIMARY KEY NOT NULL,
    title         TEXT NOT NULL,
    target_amount REAL NOT NULL,
    saved_amount  REAL NOT NULL DEFAULT 0,
    category      TEXT NOT NULL,
    priority      TEXT NOT NULL DEFAULT 'medium',
    note          TEXT,
    is_purchased  INTEGER NOT NULL DEFAULT 0,
    created_at    TEXT NOT NULL,
    updated_at    TEXT NOT NULL
  );
` as const;

/**
 * Outbox for future Google Drive sync.
 * Every mutation writes here first; a background sync worker drains it.
 *
 * `operation` is one of: 'INSERT' | 'UPDATE' | 'DELETE'
 * `payload_json` is a JSON-serialised snapshot of the full row at mutation time.
 * `synced` is 0 (pending) or 1 (acked by remote).
 */
export const CREATE_SYNC_OUTBOX_TABLE = `
  CREATE TABLE IF NOT EXISTS sync_outbox (
    id           TEXT PRIMARY KEY NOT NULL,
    table_name   TEXT NOT NULL,
    record_id    TEXT NOT NULL,
    operation    TEXT NOT NULL,
    payload_json TEXT NOT NULL,
    created_at   TEXT NOT NULL,
    synced       INTEGER NOT NULL DEFAULT 0
  );
` as const;

/** Convenience index so the sync worker can cheaply fetch pending rows. */
export const CREATE_OUTBOX_PENDING_INDEX = `
  CREATE INDEX IF NOT EXISTS idx_sync_outbox_pending
    ON sync_outbox (synced, created_at);
` as const;

/** Run all DDL statements in order. Call this from `client.ts` `onInit`. */
export const ALL_MIGRATIONS = [
  CREATE_EXPENSES_TABLE,
  CREATE_INCOMES_TABLE,
  CREATE_BUDGETS_TABLE,
  CREATE_SAVINGS_TABLE,
  CREATE_WISHLIST_TABLE,
  CREATE_SYNC_OUTBOX_TABLE,
  CREATE_OUTBOX_PENDING_INDEX,
] as const;

export const CREATE_EXPENSES_TABLE = `
  CREATE TABLE IF NOT EXISTS expenses (
    id          TEXT PRIMARY KEY NOT NULL,
    title       TEXT NOT NULL,
    amount      REAL NOT NULL,
    category    TEXT NOT NULL,
    wishlist_id TEXT,
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


export const CREATE_OUTBOX_PENDING_INDEX = `
  CREATE INDEX IF NOT EXISTS idx_sync_outbox_pending
    ON sync_outbox (synced, created_at);
` as const;


export const ADD_RECURRING_COLUMNS = `ALTER TABLE expenses ADD COLUMN is_recurring INTEGER NOT NULL DEFAULT 0;` as const;
export const ADD_RECURRING_INTERVAL = `ALTER TABLE expenses ADD COLUMN recurrence_interval TEXT DEFAULT 'monthly';` as const;
export const ADD_EXPENSE_WISHLIST_ID = `ALTER TABLE expenses ADD COLUMN wishlist_id TEXT DEFAULT NULL;` as const;

export const ALL_MIGRATIONS = [
  CREATE_EXPENSES_TABLE,
  CREATE_INCOMES_TABLE,
  CREATE_BUDGETS_TABLE,
  CREATE_SAVINGS_TABLE,
  CREATE_WISHLIST_TABLE,
  CREATE_SYNC_OUTBOX_TABLE,
  CREATE_OUTBOX_PENDING_INDEX,
  ADD_RECURRING_COLUMNS,
  ADD_RECURRING_INTERVAL,
  ADD_EXPENSE_WISHLIST_ID,
] as const;

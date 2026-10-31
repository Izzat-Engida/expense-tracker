/**
 * db/types.ts
 *
 * TypeScript interfaces that mirror every SQLite table row 1-to-1.
 * Keep these in sync with the DDL in `schema.ts`.
 */

// ─── Domain rows ────────────────────────────────────────────────────────────

export type ExpenseCategory =
  | 'food'
  | 'bills'
  | 'transport'
  | 'fun'
  | 'other';

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  note: string | null;
  /** ISO-8601 date string, e.g. "2026-10-31" */
  date: string;
  created_at: string;
  updated_at: string;
  /** Non-null when soft-deleted */
  deleted_at: string | null;
}

export interface Income {
  id: string;
  source_name: string;
  amount: number;
  /** "YYYY-MM" e.g. "2026-10" */
  month_key: string;
  updated_at: string;
}

export interface Budget {
  id: string;
  category: ExpenseCategory;
  /**
   * A percentage (0–100) when used as a budget split,
   * or an absolute amount when used as a spending cap.
   * The UI decides the semantic; the DB stores the raw number.
   */
  percentage_or_limit: number;
  month_key: string;
  updated_at: string;
}

// ─── Sync outbox ─────────────────────────────────────────────────────────────

export type SyncOperation = 'INSERT' | 'UPDATE' | 'DELETE';
export type SyncTableName = 'expenses' | 'incomes' | 'budgets';

export interface SyncOutboxRow {
  id: string;
  table_name: SyncTableName;
  record_id: string;
  operation: SyncOperation;
  /** JSON-serialised row snapshot at mutation time. */
  payload_json: string;
  created_at: string;
  /** 0 = pending, 1 = synced */
  synced: 0 | 1;
}

// ─── Input types (omit DB-managed fields) ────────────────────────────────────

export type CreateExpenseInput = Omit<Expense, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>;
export type UpdateExpenseInput = Partial<Omit<Expense, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>>;

export type CreateIncomeInput = Omit<Income, 'id' | 'updated_at'>;
export type UpdateIncomeInput = Partial<Omit<Income, 'id' | 'updated_at'>>;

export type CreateBudgetInput = Omit<Budget, 'id' | 'updated_at'>;
export type UpdateBudgetInput = Partial<Omit<Budget, 'id' | 'updated_at'>>;

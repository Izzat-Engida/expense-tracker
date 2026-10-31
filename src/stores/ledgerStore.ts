/**
 * stores/ledgerStore.ts
 *
 * Zustand store that owns in-memory state for expenses, incomes, and budgets.
 * All write actions persist to SQLite first, then emit to `sync_outbox`,
 * then update the in-memory slice — so the UI never sees stale state.
 *
 * Usage:
 *   const expenses = useLedgerStore((s) => s.expenses);
 *   const { createExpense, deleteExpense } = useLedgerStore();
 *
 * Prefer the `useLedger` hook which wraps this store and exposes a
 * simpler API with loading states.
 */

import { create } from 'zustand';
import { getDb } from '@/db/client';
import { enqueueOutbox } from '@/db/outbox';
import type {
  Expense,
  Income,
  Budget,
  CreateExpenseInput,
  UpdateExpenseInput,
  CreateIncomeInput,
  UpdateIncomeInput,
  CreateBudgetInput,
  UpdateBudgetInput,
} from '@/db/types';

// ─── Utility ────────────────────────────────────────────────────────────────

function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function now(): string {
  return new Date().toISOString();
}

// ─── State shape ─────────────────────────────────────────────────────────────

interface LedgerState {
  expenses: Expense[];
  incomes: Income[];
  budgets: Budget[];
  /** True while the initial DB load is in flight. */
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
}

interface LedgerActions {
  /** Bootstrap: load all non-deleted rows from SQLite into memory. */
  loadAll: () => Promise<void>;
  seedDemoData: () => Promise<void>;
  clearAllData: () => Promise<void>;

  // ── Expenses ──────────────────────────────────────────────────────────────
  createExpense: (input: CreateExpenseInput) => Promise<Expense>;
  updateExpense: (id: string, patch: UpdateExpenseInput) => Promise<void>;
  /** Soft-delete: sets `deleted_at` and enqueues a DELETE sync event. */
  deleteExpense: (id: string) => Promise<void>;

  // ── Incomes ───────────────────────────────────────────────────────────────
  createIncome: (input: CreateIncomeInput) => Promise<Income>;
  updateIncome: (id: string, patch: UpdateIncomeInput) => Promise<void>;
  deleteIncome: (id: string) => Promise<void>;

  // ── Budgets ───────────────────────────────────────────────────────────────
  createBudget: (input: CreateBudgetInput) => Promise<Budget>;
  updateBudget: (id: string, patch: UpdateBudgetInput) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
}

type LedgerStore = LedgerState & LedgerActions;

// ─── Store ───────────────────────────────────────────────────────────────────

export const useLedgerStore = create<LedgerStore>((set, get) => ({
  expenses: [],
  incomes: [],
  budgets: [],
  isLoading: false,
  isInitialized: false,
  error: null,

  // ── Bootstrap ──────────────────────────────────────────────────────────────
  loadAll: async () => {
    set({ isLoading: true, error: null });
    try {
      const db = await getDb();
      const [expenses, incomes, budgets] = await Promise.all([
        db.getAllAsync<Expense>(
          'SELECT * FROM expenses WHERE deleted_at IS NULL ORDER BY date DESC',
          [],
        ),
        db.getAllAsync<Income>(
          'SELECT * FROM incomes ORDER BY month_key DESC',
          [],
        ),
        db.getAllAsync<Budget>(
          'SELECT * FROM budgets ORDER BY month_key DESC',
          [],
        ),
      ]);
      set({ expenses, incomes, budgets, isLoading: false, isInitialized: true });
    } catch (e) {
      set({ isLoading: false, isInitialized: true, error: String(e) });
    }
  },

  // ── Expenses ────────────────────────────────────────────────────────────────

  createExpense: async (input) => {
    const db = await getDb();
    const expense: Expense = {
      id: uuid(),
      ...input,
      created_at: now(),
      updated_at: now(),
      deleted_at: null,
    };

    await db.withExclusiveTransactionAsync(async (txn) => {
      await txn.runAsync(
        `INSERT INTO expenses
           (id, title, amount, category, note, date, created_at, updated_at, deleted_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
        [
          expense.id,
          expense.title,
          expense.amount,
          expense.category,
          expense.note ?? null,
          expense.date,
          expense.created_at,
          expense.updated_at,
        ],
      );
      await enqueueOutbox(txn, 'expenses', expense.id, 'INSERT', expense);
    });

    set((s) => ({ expenses: [expense, ...s.expenses] }));
    return expense;
  },

  updateExpense: async (id, patch) => {
    const db = await getDb();
    const existing = get().expenses.find((e) => e.id === id);
    if (!existing) throw new Error(`Expense ${id} not found`);

    const updated: Expense = { ...existing, ...patch, updated_at: now() };

    await db.withExclusiveTransactionAsync(async (txn) => {
      await txn.runAsync(
        `UPDATE expenses
         SET title = ?, amount = ?, category = ?, note = ?,
             date = ?, updated_at = ?
         WHERE id = ?`,
        [
          updated.title,
          updated.amount,
          updated.category,
          updated.note ?? null,
          updated.date,
          updated.updated_at,
          id,
        ],
      );
      await enqueueOutbox(txn, 'expenses', id, 'UPDATE', updated);
    });

    set((s) => ({
      expenses: s.expenses.map((e) => (e.id === id ? updated : e)),
    }));
  },

  deleteExpense: async (id) => {
    const db = await getDb();
    const existing = get().expenses.find((e) => e.id === id);
    if (!existing) throw new Error(`Expense ${id} not found`);

    const deletedAt = now();
    const deleted: Expense = { ...existing, deleted_at: deletedAt, updated_at: deletedAt };

    await db.withExclusiveTransactionAsync(async (txn) => {
      await txn.runAsync(
        'UPDATE expenses SET deleted_at = ?, updated_at = ? WHERE id = ?',
        [deletedAt, deletedAt, id],
      );
      await enqueueOutbox(txn, 'expenses', id, 'DELETE', deleted);
    });

    // Remove from the active in-memory list (soft-delete = hidden from UI)
    set((s) => ({ expenses: s.expenses.filter((e) => e.id !== id) }));
  },

  // ── Incomes ─────────────────────────────────────────────────────────────────

  createIncome: async (input) => {
    const db = await getDb();
    const income: Income = { id: uuid(), ...input, updated_at: now() };

    await db.withExclusiveTransactionAsync(async (txn) => {
      await txn.runAsync(
        `INSERT INTO incomes (id, source_name, amount, month_key, updated_at)
         VALUES (?, ?, ?, ?, ?)`,
        [income.id, income.source_name, income.amount, income.month_key, income.updated_at],
      );
      await enqueueOutbox(txn, 'incomes', income.id, 'INSERT', income);
    });

    set((s) => ({ incomes: [income, ...s.incomes] }));
    return income;
  },

  updateIncome: async (id, patch) => {
    const db = await getDb();
    const existing = get().incomes.find((i) => i.id === id);
    if (!existing) throw new Error(`Income ${id} not found`);

    const updated: Income = { ...existing, ...patch, updated_at: now() };

    await db.withExclusiveTransactionAsync(async (txn) => {
      await txn.runAsync(
        `UPDATE incomes
         SET source_name = ?, amount = ?, month_key = ?, updated_at = ?
         WHERE id = ?`,
        [updated.source_name, updated.amount, updated.month_key, updated.updated_at, id],
      );
      await enqueueOutbox(txn, 'incomes', id, 'UPDATE', updated);
    });

    set((s) => ({
      incomes: s.incomes.map((i) => (i.id === id ? updated : i)),
    }));
  },

  deleteIncome: async (id) => {
    const db = await getDb();
    const existing = get().incomes.find((i) => i.id === id);
    if (!existing) throw new Error(`Income ${id} not found`);

    await db.withExclusiveTransactionAsync(async (txn) => {
      await txn.runAsync('DELETE FROM incomes WHERE id = ?', [id]);
      await enqueueOutbox(txn, 'incomes', id, 'DELETE', existing);
    });

    set((s) => ({ incomes: s.incomes.filter((i) => i.id !== id) }));
  },

  // ── Budgets ─────────────────────────────────────────────────────────────────

  createBudget: async (input) => {
    const db = await getDb();
    const budget: Budget = { id: uuid(), ...input, updated_at: now() };

    await db.withExclusiveTransactionAsync(async (txn) => {
      await txn.runAsync(
        `INSERT INTO budgets (id, category, percentage_or_limit, month_key, updated_at)
         VALUES (?, ?, ?, ?, ?)`,
        [
          budget.id,
          budget.category,
          budget.percentage_or_limit,
          budget.month_key,
          budget.updated_at,
        ],
      );
      await enqueueOutbox(txn, 'budgets', budget.id, 'INSERT', budget);
    });

    set((s) => ({ budgets: [budget, ...s.budgets] }));
    return budget;
  },

  updateBudget: async (id, patch) => {
    const db = await getDb();
    const existing = get().budgets.find((b) => b.id === id);
    if (!existing) throw new Error(`Budget ${id} not found`);

    const updated: Budget = { ...existing, ...patch, updated_at: now() };

    await db.withExclusiveTransactionAsync(async (txn) => {
      await txn.runAsync(
        `UPDATE budgets
         SET category = ?, percentage_or_limit = ?, month_key = ?, updated_at = ?
         WHERE id = ?`,
        [
          updated.category,
          updated.percentage_or_limit,
          updated.month_key,
          updated.updated_at,
          id,
        ],
      );
      await enqueueOutbox(txn, 'budgets', id, 'UPDATE', updated);
    });

    set((s) => ({
      budgets: s.budgets.map((b) => (b.id === id ? updated : b)),
    }));
  },

  deleteBudget: async (id) => {
    const db = await getDb();
    const existing = get().budgets.find((b) => b.id === id);
    if (!existing) throw new Error(`Budget ${id} not found`);

    await db.withExclusiveTransactionAsync(async (txn) => {
      await txn.runAsync('DELETE FROM budgets WHERE id = ?', [id]);
      await enqueueOutbox(txn, 'budgets', id, 'DELETE', existing);
    });

    set((s) => ({ budgets: s.budgets.filter((b) => b.id !== id) }));
  },

  // ── Demo & Maintenance ──────────────────────────────────────────────────────

  seedDemoData: async () => {
    const db = await getDb();
    const currentMonth = new Date().toISOString().slice(0, 7); // e.g. "2026-10"
    const today = new Date().toISOString().slice(0, 10);

    const demoExpenses: CreateExpenseInput[] = [
      {
        title: 'Morning Pour-over & Matcha',
        amount: 680,
        category: 'food',
        note: 'Artisanal roast café',
        date: today,
      },
      {
        title: 'Supermarket Groceries',
        amount: 4520,
        category: 'food',
        note: 'Fresh produce & pantry essentials',
        date: today,
      },
      {
        title: 'Metro Pass Recharge',
        amount: 2000,
        category: 'transport',
        note: 'Commuter card reload',
        date: today,
      },
      {
        title: 'High-speed Fiber Internet',
        amount: 5400,
        category: 'bills',
        note: 'Monthly subscription',
        date: `${currentMonth}-15`,
      },
      {
        title: 'Weekend Cinema & Ramen',
        amount: 3200,
        category: 'fun',
        note: 'Film with friends',
        date: `${currentMonth}-20`,
      },
      {
        title: 'Notebooks & Fountain Pen Ink',
        amount: 1850,
        category: 'other',
        note: 'Stationery shop',
        date: `${currentMonth}-12`,
      },
    ];

    const demoIncomes: CreateIncomeInput[] = [
      {
        source_name: 'Main Salary',
        amount: 320000,
        month_key: currentMonth,
      },
    ];

    const demoBudgets: CreateBudgetInput[] = [
      { category: 'food', percentage_or_limit: 45000, month_key: currentMonth },
      { category: 'bills', percentage_or_limit: 90000, month_key: currentMonth },
      { category: 'transport', percentage_or_limit: 15000, month_key: currentMonth },
      { category: 'fun', percentage_or_limit: 25000, month_key: currentMonth },
      { category: 'other', percentage_or_limit: 20000, month_key: currentMonth },
    ];

    for (const exp of demoExpenses) {
      await get().createExpense(exp);
    }
    for (const inc of demoIncomes) {
      await get().createIncome(inc);
    }
    for (const bgt of demoBudgets) {
      await get().createBudget(bgt);
    }
  },

  clearAllData: async () => {
    const db = await getDb();
    await db.execAsync(`
      DELETE FROM expenses;
      DELETE FROM incomes;
      DELETE FROM budgets;
      DELETE FROM sync_outbox;
    `);
    set({ expenses: [], incomes: [], budgets: [] });
  },
}));

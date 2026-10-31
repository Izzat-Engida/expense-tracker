/**
 * hooks/useLedger.ts
 *
 * Convenience hook that bootstraps the ledger store on first mount and
 * exposes a clean, ergonomic API over the raw Zustand store.
 *
 * @example
 * ```tsx
 * function AddExpenseButton() {
 *   const { createExpense, isLoading } = useLedger();
 *   return (
 *     <Button
 *       disabled={isLoading}
 *       onPress={() =>
 *         createExpense({
 *           title: 'Morning coffee',
 *           amount: 420,
 *           category: 'food',
 *           note: null,
 *           date: '2026-10-31',
 *         })
 *       }
 *     />
 *   );
 * }
 * ```
 */

import { useEffect } from 'react';
import { useLedgerStore } from '@/stores/ledgerStore';

export function useLedger() {
  const store = useLedgerStore();

  // Load from SQLite exactly once, after the first mount.
  useEffect(() => {
    if (!store.isInitialized && !store.isLoading) {
      store.loadAll();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    // ── State ──────────────────────────────────────────────────────────────
    expenses: store.expenses,
    incomes: store.incomes,
    budgets: store.budgets,
    isLoading: store.isLoading,
    isInitialized: store.isInitialized,
    error: store.error,

    // ── Actions ────────────────────────────────────────────────────────────
    createExpense: store.createExpense,
    updateExpense: store.updateExpense,
    deleteExpense: store.deleteExpense,

    createIncome: store.createIncome,
    updateIncome: store.updateIncome,
    deleteIncome: store.deleteIncome,

    createBudget: store.createBudget,
    updateBudget: store.updateBudget,
    deleteBudget: store.deleteBudget,

    seedDemoData: store.seedDemoData,
    clearAllData: store.clearAllData,

    /** Re-sync the in-memory state from SQLite (e.g. after a cold start). */
    reload: store.loadAll,
  };
}

/**
 * hooks/useLedger.ts
 *
 * Convenience hook that bootstraps the ledger store on first mount and
 * exposes a clean, ergonomic API over the raw Zustand store.
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
    savings: store.savings,
    wishlist: store.wishlist,
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

    createSaving: store.createSaving,
    updateSaving: store.updateSaving,
    deleteSaving: store.deleteSaving,

    createWishlistItem: store.createWishlistItem,
    updateWishlistItem: store.updateWishlistItem,
    deleteWishlistItem: store.deleteWishlistItem,
    addSavingToWishlist: store.addSavingToWishlist,

    seedDemoData: store.seedDemoData,
    clearAllData: store.clearAllData,

    /** Re-sync the in-memory state from SQLite (e.g. after a cold start). */
    reload: store.loadAll,
  };
}

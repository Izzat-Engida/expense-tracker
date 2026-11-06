import { useEffect } from 'react';
import { useLedgerStore } from '@/stores/ledgerStore';

export function useLedger() {
  const store = useLedgerStore();

 
  useEffect(() => {
    if (!store.isInitialized && !store.isLoading) {
      store.loadAll();
    }
    // Intentionally run once on mount; loading is guarded by store flags.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
   
    expenses: store.expenses,
    incomes: store.incomes,
    budgets: store.budgets,
    savings: store.savings,
    wishlist: store.wishlist,
    isLoading: store.isLoading,
    isInitialized: store.isInitialized,
    error: store.error,


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


    reload: store.loadAll,
  };
}

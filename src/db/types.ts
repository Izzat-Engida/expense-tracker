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

  date: string;
  created_at: string;
  updated_at: string;

  deleted_at: string | null;
}

export interface Income {
  id: string;
  source_name: string;
  amount: number;

  month_key: string;
  updated_at: string;
}

export interface Budget {
  id: string;
  category: ExpenseCategory;

  percentage_or_limit: number;
  month_key: string;
  updated_at: string;
}

export interface Saving {
  id: string;
  title: string;
  amount: number;
  category: string;
  wishlist_id: string | null;
  note: string | null;
  
  date: string;
  created_at: string;
  updated_at: string;
}

export interface WishlistItem {
  id: string;
  title: string;
  target_amount: number;
  saved_amount: number;
  category: string;
  priority: 'low' | 'medium' | 'high';
  note: string | null;
  is_purchased: 0 | 1;
  created_at: string;
  updated_at: string;
}


export type SyncOperation = 'INSERT' | 'UPDATE' | 'DELETE';
export type SyncTableName = 'expenses' | 'incomes' | 'budgets' | 'savings' | 'wishlist';

export interface SyncOutboxRow {
  id: string;
  table_name: SyncTableName;
  record_id: string;
  operation: SyncOperation;

  payload_json: string;
  created_at: string;

  synced: 0 | 1;
}


export type CreateExpenseInput = Omit<Expense, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>;
export type UpdateExpenseInput = Partial<Omit<Expense, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>>;

export type CreateIncomeInput = Omit<Income, 'id' | 'updated_at'>;
export type UpdateIncomeInput = Partial<Omit<Income, 'id' | 'updated_at'>>;

export type CreateBudgetInput = Omit<Budget, 'id' | 'updated_at'>;
export type UpdateBudgetInput = Partial<Omit<Budget, 'id' | 'updated_at'>>;

export type CreateSavingInput = Omit<Saving, 'id' | 'created_at' | 'updated_at'>;
export type UpdateSavingInput = Partial<Omit<Saving, 'id' | 'created_at' | 'updated_at'>>;

export type CreateWishlistItemInput = Omit<WishlistItem, 'id' | 'created_at' | 'updated_at' | 'is_purchased'> & {
  is_purchased?: 0 | 1;
  saved_amount?: number;
};
export type UpdateWishlistItemInput = Partial<Omit<WishlistItem, 'id' | 'created_at' | 'updated_at'>>;

import type { Budget, Expense, ExpenseCategory, Income } from '@/db/types';

export type CategoryColorKey =
  | 'categoryFood'
  | 'categoryBills'
  | 'categoryTransport'
  | 'categoryFun'
  | 'categoryOther';

export const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  food: 'Food',
  bills: 'Bills',
  transport: 'Transport',
  fun: 'Fun',
  other: 'Other',
};

export const CATEGORY_COLOR_KEYS: Record<ExpenseCategory, CategoryColorKey> = {
  food: 'categoryFood',
  bills: 'categoryBills',
  transport: 'categoryTransport',
  fun: 'categoryFun',
  other: 'categoryOther',
};

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const MONTH_KANJI = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'];


export function localDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function dateKeyForOffset(days: number, from = new Date()): string {
  const date = new Date(from);
  date.setDate(date.getDate() + days);
  return localDateKey(date);
}

export function currentMonthKey(date = new Date()): string {
  return localDateKey(date).slice(0, 7);
}

export function monthKeyFromDateKey(dateKey: string): string {
  return dateKey.slice(0, 7);
}

export function addMonths(monthKey: string, delta: number): string {
  const [year, month] = monthKey.split('-').map(Number);
  const date = new Date(year, month - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function daysInMonth(monthKey: string): number {
  const [year, month] = monthKey.split('-').map(Number);
  return new Date(year, month, 0).getDate();
}

export function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number);
  return `${MONTH_NAMES[month - 1] ?? ''} ${year}`;
}


export function formatMonthKanji(monthKey: string): string {
  const [, month] = monthKey.split('-').map(Number);
  return `${MONTH_KANJI[month - 1] ?? ''}\n月`;
}

export function formatSignedAmount(amount: number): string {
  return `${amount < 0 ? '+' : '-'}${Math.abs(Math.round(amount)).toLocaleString()}`;
}

export function formatCompactAmount(amount: number): string {
  if (amount >= 1_000_000) {
    return `${trimDecimal(amount / 1_000_000)}m`;
  }
  if (amount >= 1_000) {
    return `${trimDecimal(amount / 1_000)}k`;
  }
  return `${Math.round(amount)}`;
}

function trimDecimal(value: number): string {
  return value.toFixed(1).replace(/\.0$/, '');
}

export function expensesForMonth(expenses: Expense[], monthKey: string): Expense[] {
  return expenses.filter((expense) => monthKeyFromDateKey(expense.date) === monthKey);
}

export function expensesForDate(expenses: Expense[], dateKey: string): Expense[] {
  return expenses
    .filter((expense) => expense.date === dateKey)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function totalAmount(expenses: Expense[]): number {
  return expenses.reduce((sum, expense) => sum + expense.amount, 0);
}

export function monthlyIncome(incomes: Income[], monthKey: string): number {
  return incomes
    .filter((income) => income.month_key === monthKey)
    .reduce((sum, income) => sum + income.amount, 0);
}

export function monthlyBudget(budgets: Budget[], monthKey: string): number {
  return budgets
    .filter((budget) => budget.month_key === monthKey)
    .reduce((sum, budget) => sum + budget.percentage_or_limit, 0);
}


export interface DayGroup {
  label: 'Today' | 'Yesterday';
  badge: string;
  expenses: Expense[];
  total: number;
}

export interface HomeSummary {
  monthKey: string;
  monthSpent: number;
  monthIncome: number;
  budgetTotal: number;
  budgetProgress: number;
  budgetPercent: number;
  today: DayGroup;
  yesterday: DayGroup;
}

export function getHomeSummary(
  expenses: Expense[],
  incomes: Income[],
  budgets: Budget[],
  now = new Date(),
): HomeSummary {
  const monthKey = currentMonthKey(now);
  const todayKey = localDateKey(now);
  const yesterdayKey = dateKeyForOffset(-1, now);

  const monthExpenses = expensesForMonth(expenses, monthKey);
  const todayExpenses = expensesForDate(expenses, todayKey);
  const yesterdayExpenses = expensesForDate(expenses, yesterdayKey);
  const monthSpent = totalAmount(monthExpenses);
  const budgetTotal = monthlyBudget(budgets, monthKey);
  const budgetProgress = budgetTotal > 0 ? monthSpent / budgetTotal : 0;

  return {
    monthKey,
    monthSpent,
    monthIncome: monthlyIncome(incomes, monthKey),
    budgetTotal,
    budgetProgress,
    budgetPercent: Math.round(budgetProgress * 100),
    today: {
      label: 'Today',
      badge: '今日',
      expenses: todayExpenses,
      total: totalAmount(todayExpenses),
    },
    yesterday: {
      label: 'Yesterday',
      badge: '昨日',
      expenses: yesterdayExpenses,
      total: totalAmount(yesterdayExpenses),
    },
  };
}


export interface CategoryRow {
  category: ExpenseCategory;
  label: string;
  colorKey: CategoryColorKey;
  amount: number;
  progress: number;
  percentText: string;
}

export interface DailyBar {
  day: number;
  amount: number;
  progress: number;
  isPeak: boolean;
}

export interface OverviewSummary {
  monthExpenses: Expense[];
  totalSpent: number;
  categoryRows: CategoryRow[];
  dailyBars: DailyBar[];
  maxDaily: number;
  days: number;
  peakDay: number | null;
}

export function getOverviewSummary(expenses: Expense[], monthKey: string): OverviewSummary {
  const monthExpenses = expensesForMonth(expenses, monthKey);
  const totalSpent = totalAmount(monthExpenses);
  const days = daysInMonth(monthKey);

  const categoryTotals = new Map<ExpenseCategory, number>();
  for (const expense of monthExpenses) {
    categoryTotals.set(expense.category, (categoryTotals.get(expense.category) ?? 0) + expense.amount);
  }

  const categoryRows: CategoryRow[] = Array.from(categoryTotals.entries())
    .filter(([, amount]) => amount > 0)
    .sort(([, a], [, b]) => b - a)
    .map(([category, amount]) => ({
      category,
      label: CATEGORY_LABELS[category],
      colorKey: CATEGORY_COLOR_KEYS[category],
      amount,
      progress: totalSpent > 0 ? amount / totalSpent : 0,
      percentText: totalSpent > 0 ? `${((amount / totalSpent) * 100).toFixed(1)}%` : '0.0%',
    }));

  const dailyTotals = Array.from({ length: days }, () => 0);
  for (const expense of monthExpenses) {
    const day = Number(expense.date.slice(8, 10));
    if (day >= 1 && day <= days) {
      dailyTotals[day - 1] += expense.amount;
    }
  }

  const maxDaily = Math.max(0, ...dailyTotals);
  const peakIndex = maxDaily > 0 ? dailyTotals.indexOf(maxDaily) : -1;

  const dailyBars: DailyBar[] = dailyTotals.map((amount, index) => ({
    day: index + 1,
    amount,
    progress: maxDaily > 0 ? amount / maxDaily : 0,
    isPeak: index === peakIndex,
  }));

  return {
    monthExpenses,
    totalSpent,
    categoryRows,
    dailyBars,
    maxDaily,
    days,
    peakDay: peakIndex >= 0 ? peakIndex + 1 : null,
  };
}

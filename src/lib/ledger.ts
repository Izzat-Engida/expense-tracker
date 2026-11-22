import type { Budget, Expense, ExpenseCategory, Income, Saving } from '@/db/types';

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

export function monthlySavings(savings: Saving[], monthKey: string): number {
  return savings
    .filter((s) => s.date.slice(0, 7) === monthKey)
    .reduce((sum, s) => sum + s.amount, 0);
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
  monthSaved: number;
  availableCash: number;
  operationalSpent: number;
  fundedSpent: number;
  budgetTotal: number;
  budgetProgress: number;
  budgetPercent: number;
  overBudgetAmount: number;
  totalSavingsPool: number;
  isCoveredBySavings: boolean;
  today: DayGroup;
  yesterday: DayGroup;
}

export function getHomeSummary(
  expenses: Expense[],
  incomes: Income[],
  budgets: Budget[],
  savings: Saving[] = [],
  now = new Date(),
): HomeSummary {
  const monthKey = currentMonthKey(now);
  const todayKey = localDateKey(now);
  const yesterdayKey = dateKeyForOffset(-1, now);

  const monthExpenses = expensesForMonth(expenses, monthKey);
  const todayExpenses = expensesForDate(expenses, todayKey);
  const yesterdayExpenses = expensesForDate(expenses, yesterdayKey);
  const monthSpent = totalAmount(monthExpenses);
  const monthIncome = monthlyIncome(incomes, monthKey);
  const monthSaved = monthlySavings(savings, monthKey);

  const fundedExpenses = monthExpenses.filter((e) => Boolean(e.wishlist_id));
  const fundedSpent = totalAmount(fundedExpenses);
  const operationalSpent = Math.max(0, monthSpent - fundedSpent);

  const budgetTotal = monthlyBudget(budgets, monthKey);
  const budgetProgress = budgetTotal > 0 ? operationalSpent / budgetTotal : 0;
  const overBudgetAmount = budgetTotal > 0 ? Math.max(0, operationalSpent - budgetTotal) : 0;
  const totalSavingsPool = savings.reduce((sum, s) => sum + s.amount, 0);
  const isCoveredBySavings = overBudgetAmount > 0 && totalSavingsPool >= overBudgetAmount;

  // Available cash = Income - Operational Everyday Spending - Money set aside in Savings/Wishlist
  const availableCash = monthIncome - operationalSpent - monthSaved;

  return {
    monthKey,
    monthSpent,
    monthIncome,
    monthSaved,
    availableCash,
    operationalSpent,
    fundedSpent,
    budgetTotal,
    budgetProgress,
    budgetPercent: Math.round(budgetProgress * 100),
    overBudgetAmount,
    totalSavingsPool,
    isCoveredBySavings,
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

export function cumulativeSeries(dailyBars: DailyBar[]): number[] {
  let running = 0;
  return dailyBars.map((bar) => {
    running += bar.amount;
    return running;
  });
}

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

export interface WeekdaySpend {
  dayIndex: number;
  label: string;
  amount: number;
}

export function getWeekdaySpending(expenses: Expense[]): WeekdaySpend[] {
  const totals = Array.from({ length: 7 }, () => 0);
  for (const expense of expenses) {
    const [year, month, day] = expense.date.split('-').map(Number);
    if (!year || !month || !day) continue;
    const mondayFirstIndex = (new Date(year, month - 1, day).getDay() + 6) % 7;
    totals[mondayFirstIndex] += expense.amount;
  }
  return totals.map((amount, dayIndex) => ({
    dayIndex,
    label: WEEKDAY_LABELS[dayIndex],
    amount,
  }));
}

export interface MonthTrendPoint {
  monthKey: string;
  label: string;
  amount: number;
}

export function getMonthlyTrend(
  expenses: Expense[],
  endMonthKey: string,
  count = 6,
): MonthTrendPoint[] {
  const points: MonthTrendPoint[] = [];
  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const monthKey = addMonths(endMonthKey, -offset);
    const [, month] = monthKey.split('-').map(Number);
    points.push({
      monthKey,
      label: (MONTH_NAMES[month - 1] ?? '').slice(0, 3),
      amount: totalAmount(expensesForMonth(expenses, monthKey)),
    });
  }
  return points;
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


/* ─── Year Summary ─── */

export interface MonthBudgetHealth {
  monthKey: string;
  label: string;
  income: number;
  spent: number;
  budgetLimit: number;
  saved: number;
  net: number;
  overBudget: boolean;
}

export interface YearSummary {
  year: number;
  totalIncome: number;
  totalSpent: number;
  totalSaved: number;
  totalBudget: number;
  net: number;
  months: MonthBudgetHealth[];
}

export function getYearSummary(
  expenses: Expense[],
  incomes: Income[],
  budgets: Budget[],
  savings: Saving[],
  year: number,
): YearSummary {
  const months: MonthBudgetHealth[] = [];
  let totalIncome = 0;
  let totalSpent = 0;
  let totalSaved = 0;
  let totalBudgetLimit = 0;

  for (let m = 1; m <= 12; m++) {
    const mk = `${year}-${String(m).padStart(2, '0')}`;
    const mIncome = monthlyIncome(incomes, mk);
    const mSpent = totalAmount(expensesForMonth(expenses, mk));
    const mBudget = monthlyBudget(budgets, mk);
    const mSaved = savings
      .filter((s) => s.date.startsWith(mk))
      .reduce((sum, s) => sum + s.amount, 0);

    totalIncome += mIncome;
    totalSpent += mSpent;
    totalSaved += mSaved;
    totalBudgetLimit += mBudget;

    months.push({
      monthKey: mk,
      label: (MONTH_NAMES[m - 1] ?? '').slice(0, 3),
      income: mIncome,
      spent: mSpent,
      budgetLimit: mBudget,
      saved: mSaved,
      net: mIncome - mSpent,
      overBudget: mBudget > 0 && mSpent > mBudget,
    });
  }

  return {
    year,
    totalIncome,
    totalSpent,
    totalSaved,
    totalBudget: totalBudgetLimit,
    net: totalIncome - totalSpent,
    months,
  };
}


/* ─── Spending Streak ─── */

export interface StreakResult {
  streak: number;           // consecutive "clean" days (under limit or zero-spend)
  todayAmount: number;      // spending today
  isCleanToday: boolean;    // is today under the limit?
  longestStreak: number;    // personal best across all history
}

export function computeSpendingStreak(
  expenses: Expense[],
  dailyLimit: number, // 0 means "no spending at all" counts as clean
  now = new Date(),
): StreakResult {
  // Build a map of dateKey -> total spent
  const spendByDay = new Map<string, number>();
  for (const exp of expenses) {
    spendByDay.set(exp.date, (spendByDay.get(exp.date) ?? 0) + exp.amount);
  }

  const limit = dailyLimit > 0 ? dailyLimit : 0;
  const isClean = (amount: number) => limit > 0 ? amount < limit : amount === 0;

  const todayKey = localDateKey(now);
  const todayAmount = spendByDay.get(todayKey) ?? 0;
  const isCleanToday = isClean(todayAmount);

  // Walk backwards from today to find current streak
  let streak = 0;
  const checkDate = new Date(now);
  while (true) {
    const key = localDateKey(checkDate);
    const amount = spendByDay.get(key) ?? 0;
    if (isClean(amount)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
    // Safety limit: don't go back more than 365 days
    if (streak > 365) break;
  }

  // Find longest streak in history
  // Get sorted unique date keys from expenses + today
  const allKeys = Array.from(spendByDay.keys()).sort();
  let longest = 0;
  let current = 0;
  for (const key of allKeys) {
    const amount = spendByDay.get(key) ?? 0;
    if (isClean(amount)) {
      current++;
      if (current > longest) longest = current;
    } else {
      current = 0;
    }
  }
  // Also consider current streak
  if (streak > longest) longest = streak;

  return { streak, todayAmount, isCleanToday, longestStreak: longest };
}

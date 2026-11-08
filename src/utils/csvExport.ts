import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';
import type { Expense, Income, Saving } from '@/db/types';

function escapeCsvCell(text: string | number | null | undefined): string {
  if (text === null || text === undefined) return '""';
  const str = String(text);
  return `"${str.replace(/"/g, '""')}"`;
}

export async function exportLedgerToCsv(
  expenses: Expense[],
  incomes: Income[],
  savings: Saving[],
  currency: string,
): Promise<void> {
  try {
    const isSharingAvailable = await Sharing.isAvailableAsync();
    if (!isSharingAvailable) {
      Alert.alert('Sharing Unavailable', 'Sharing is not supported on this device.');
      return;
    }

    const headers = ['Type', 'ID', 'Date / Month', 'Title / Source', 'Category', 'Amount', 'Currency', 'Note'];
    const rows: string[] = [headers.join(',')];

    // Expenses
    for (const exp of expenses) {
      rows.push([
        escapeCsvCell('EXPENSE'),
        escapeCsvCell(exp.id),
        escapeCsvCell(exp.date),
        escapeCsvCell(exp.title),
        escapeCsvCell(exp.category),
        escapeCsvCell(exp.amount),
        escapeCsvCell(currency),
        escapeCsvCell(exp.note || ''),
      ].join(','));
    }

    // Incomes
    for (const inc of incomes) {
      rows.push([
        escapeCsvCell('INCOME'),
        escapeCsvCell(inc.id),
        escapeCsvCell(inc.month_key),
        escapeCsvCell(inc.source_name),
        escapeCsvCell('Income'),
        escapeCsvCell(inc.amount),
        escapeCsvCell(currency),
        escapeCsvCell(''),
      ].join(','));
    }

    // Savings
    for (const sav of savings) {
      rows.push([
        escapeCsvCell('SAVING'),
        escapeCsvCell(sav.id),
        escapeCsvCell(sav.date),
        escapeCsvCell(sav.title),
        escapeCsvCell(sav.category),
        escapeCsvCell(sav.amount),
        escapeCsvCell(currency),
        escapeCsvCell(sav.note || ''),
      ].join(','));
    }

    const csvContent = rows.join('\n');
    const timestamp = new Date().toISOString().slice(0, 10);
    const fileUri = `${FileSystem.documentDirectory}yohaku_ledger_${timestamp}.csv`;

    await FileSystem.writeAsStringAsync(fileUri, csvContent, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    await Sharing.shareAsync(fileUri, {
      mimeType: 'text/csv',
      dialogTitle: 'Export Yohaku Ledger',
      UTI: 'public.comma-separated-values-text',
    });
  } catch (error: any) {
    Alert.alert('Export Failed', error?.message || 'Unable to generate CSV export.');
  }
}

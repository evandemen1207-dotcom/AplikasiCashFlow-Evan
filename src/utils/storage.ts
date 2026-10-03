import { Transaction, UserSettings, ThemeMode } from '../types';
import { DEFAULT_USER_SETTINGS, generateSeedTransactions } from './seedData';

const TRANSACTIONS_KEY = 'cashflow_transactions_v2';
const SETTINGS_KEY = 'cashflow_settings_v2';
const HAS_SEEDED_KEY = 'cashflow_has_seeded_v1';
const THEME_KEY = 'cashflow_theme_mode';

// In-memory fallback if localStorage fails or is blocked
const memoryStore: Record<string, string> = {};

// Clean legacy dummy transactions if present from earlier versions
if (typeof window !== 'undefined' && window.localStorage) {
  try {
    window.localStorage.removeItem('cashflow_transactions_v1');
  } catch (e) {
    // ignore
  }
}

function safeGetItem(key: string): string | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
  } catch (e) {
    console.warn('LocalStorage error reading key:', key, e);
  }
  return memoryStore[key] || null;
}

function safeSetItem(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  } catch (e) {
    console.warn('LocalStorage error writing key:', key, e);
  }
  memoryStore[key] = value;
}

export function loadTransactions(): Transaction[] {
  const raw = safeGetItem(TRANSACTIONS_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to parse transactions from storage:', err);
    return [];
  }
}

export function saveTransactions(transactions: Transaction[]): void {
  safeSetItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
}

export function loadSettings(): UserSettings {
  const raw = safeGetItem(SETTINGS_KEY);
  if (!raw) {
    return DEFAULT_USER_SETTINGS;
  }

  try {
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_USER_SETTINGS,
      ...parsed,
      categoryBudgets: {
        ...DEFAULT_USER_SETTINGS.categoryBudgets,
        ...(parsed.categoryBudgets || {}),
      },
      ewsThresholds: {
        ...DEFAULT_USER_SETTINGS.ewsThresholds,
        ...(parsed.ewsThresholds || {}),
      },
    };
  } catch (err) {
    console.error('Failed to parse settings from storage:', err);
    return DEFAULT_USER_SETTINGS;
  }
}

export function saveSettings(settings: UserSettings): void {
  safeSetItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function clearSampleData(): void {
  // Only remove transactions and mark has_seeded as true so it won't auto-seed
  safeSetItem(TRANSACTIONS_KEY, JSON.stringify([]));
  safeSetItem(HAS_SEEDED_KEY, 'true');
}

export function restoreSampleData(): Transaction[] {
  const seed = generateSeedTransactions();
  saveTransactions(seed);
  saveSettings(DEFAULT_USER_SETTINGS);
  safeSetItem(HAS_SEEDED_KEY, 'true');
  return seed;
}

export function loadThemeMode(): ThemeMode {
  const raw = safeGetItem(THEME_KEY);
  if (raw === 'dark' || raw === 'light' || raw === 'system') {
    return raw;
  }
  return 'system';
}

export function saveThemeMode(mode: ThemeMode): void {
  safeSetItem(THEME_KEY, mode);
}

export function getEffectiveTheme(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'dark') return 'dark';
  if (mode === 'light') return 'light';
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
}

// === EXPORT & IMPORT UTILITIES ===

export function exportTransactionsToCSV(transactions: Transaction[]): void {
  const headers = ['id', 'tanggal', 'jenis', 'kategori', 'nominal', 'catatan', 'createdAt'];
  const rows = transactions.map((t) => [
    `"${t.id}"`,
    `"${t.date}"`,
    `"${t.type}"`,
    `"${t.category}"`,
    t.amount,
    `"${(t.note || '').replace(/"/g, '""')}"`,
    `"${t.createdAt}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `cashflow_transaksi_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportTransactionsToJSON(transactions: Transaction[], settings: UserSettings): void {
  const data = {
    exportedAt: new Date().toISOString(),
    version: '1.0',
    transactions,
    settings,
  };
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `cashflow_backup_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function parseCSV(csvText: string): Transaction[] {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  // Parse CSV line handling quotes
  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const header = parseLine(lines[0]).map((h) => h.toLowerCase());
  const dateIdx = header.findIndex((h) => h.includes('tanggal') || h.includes('date'));
  const typeIdx = header.findIndex((h) => h.includes('jenis') || h.includes('type'));
  const catIdx = header.findIndex((h) => h.includes('kategori') || h.includes('category'));
  const amountIdx = header.findIndex((h) => h.includes('nominal') || h.includes('amount'));
  const noteIdx = header.findIndex((h) => h.includes('catatan') || h.includes('note'));

  const transactions: Transaction[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseLine(lines[i]);
    if (cols.length < 4) continue;

    const rawDate = dateIdx >= 0 ? cols[dateIdx] : cols[1];
    const rawType = (typeIdx >= 0 ? cols[typeIdx] : cols[2])?.toLowerCase();
    const rawCat = catIdx >= 0 ? cols[catIdx] : cols[3];
    const rawAmount = amountIdx >= 0 ? cols[amountIdx] : cols[4];
    const rawNote = noteIdx >= 0 ? cols[noteIdx] : (cols[5] || '');

    const parsedAmount = parseFloat(rawAmount.replace(/[^0-9.-]/g, ''));
    if (!rawDate || isNaN(parsedAmount) || parsedAmount <= 0) continue;

    const type = rawType.includes('masuk') || rawType === 'income' ? 'income' : 'expense';

    transactions.push({
      id: `imported-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`,
      date: rawDate.replace(/"/g, ''),
      type,
      category: rawCat as any,
      amount: parsedAmount,
      note: rawNote,
      createdAt: new Date().toISOString(),
    });
  }

  return transactions;
}

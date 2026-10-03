import { useEffect, useRef } from 'react';
import { Transaction, UserSettings, ExpenseCategory } from '../types';
import { formatRupiah } from '../utils/formatters';

export type BudgetAlertLevel = 'warning' | 'danger';

export interface BudgetAlertEvent {
  category: ExpenseCategory;
  spent: number;
  budget: number;
  ratio: number;
  level: BudgetAlertLevel;
  monthKey: string;
}

interface UseBudgetMonitorProps {
  transactions: Transaction[];
  settings: UserSettings;
  onAlert: (alert: BudgetAlertEvent) => void;
  enabled?: boolean;
}

/**
 * useBudgetMonitor
 * Custom background hook yang mengamati perubahan transaksi dan pagu anggaran secara real-time.
 * Menghitung rasio pengeluaran kategori terhadap anggaran bulanan dan memicu alert:
 * - >= 90% & < 100%: Level Warning (Kuning/Oranye)
 * - >= 100%: Level Danger (Merah)
 *
 * Menggunakan deduplication map (Ref) untuk mencegah spam notifikasi.
 */
export function useBudgetMonitor({
  transactions,
  settings,
  onAlert,
  enabled = true,
}: UseBudgetMonitorProps) {
  // Key: `${monthKey}:${category}` => Level yang sudah dipicu
  const alertedCategoriesRef = useRef<Map<string, BudgetAlertLevel>>(new Map());
  // Simpan ref callback agar tidak memicu efek ulang jika referensi onAlert berubah
  const onAlertRef = useRef(onAlert);
  onAlertRef.current = onAlert;

  // Lacak jumlah transaksi sebelumnya untuk mendeteksi penambahan/pengurangan/edit transaksi
  const prevTransactionsCountRef = useRef<number>(transactions.length);
  const isInitialMountRef = useRef<boolean>(true);

  useEffect(() => {
    if (!enabled) return;

    // Tentukan bulan aktif yang dipantau (bulan transaksi terbaru atau bulan saat ini)
    const currentYearMonth = new Date().toISOString().slice(0, 7);
    const activeMonths = new Set<string>();
    activeMonths.add(currentYearMonth);

    // Ambil bulan dari transaksi terakhir jika ada
    if (transactions.length > 0) {
      activeMonths.add(transactions[0].date.slice(0, 7));
    }

    // Jika transaksi direset (menjadi 0 atau berkurang drastis), bersihkan status deduplication
    if (transactions.length === 0) {
      alertedCategoriesRef.current.clear();
      prevTransactionsCountRef.current = 0;
      return;
    }

    activeMonths.forEach((monthKey) => {
      const monthExpenses = transactions.filter(
        (t) => t.type === 'expense' && t.date.slice(0, 7) === monthKey
      );

      // Hitung total pengeluaran per kategori pada bulan tersebut
      const categorySpentMap: Partial<Record<ExpenseCategory, number>> = {};
      monthExpenses.forEach((t) => {
        const cat = t.category as ExpenseCategory;
        categorySpentMap[cat] = (categorySpentMap[cat] || 0) + t.amount;
      });

      // Evaluasi setiap kategori yang memiliki pagu anggaran
      Object.entries(settings.categoryBudgets).forEach(([catKey, budgetVal]) => {
        const category = catKey as ExpenseCategory;
        const budget = Number(budgetVal) || 0;
        if (budget <= 0) return;

        const spent = categorySpentMap[category] || 0;
        const ratio = (spent / budget) * 100;
        const alertKey = `${monthKey}:${category}`;
        const previousAlertLevel = alertedCategoriesRef.current.get(alertKey);

        if (ratio >= 100) {
          // Level Danger (Batas Terlampaui)
          if (previousAlertLevel !== 'danger') {
            alertedCategoriesRef.current.set(alertKey, 'danger');
            onAlertRef.current({
              category,
              spent,
              budget,
              ratio,
              level: 'danger',
              monthKey,
            });
          }
        } else if (ratio >= 90) {
          // Level Warning (Mendekati Limit)
          if (!previousAlertLevel) {
            alertedCategoriesRef.current.set(alertKey, 'warning');
            onAlertRef.current({
              category,
              spent,
              budget,
              ratio,
              level: 'warning',
              monthKey,
            });
          }
        } else {
          // Rasio < 90%: Jika sebelumnya ada alert, reset agar dapat terpicu kembali jika naik lagi
          if (previousAlertLevel) {
            alertedCategoriesRef.current.delete(alertKey);
          }
        }
      });
    });

    prevTransactionsCountRef.current = transactions.length;
    isInitialMountRef.current = false;
  }, [transactions, settings.categoryBudgets, enabled]);
}

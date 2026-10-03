import React, { useState, useMemo } from 'react';
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  PieChart as PieIcon,
  Shield,
  Layers,
  ArrowRight,
  Inbox,
  Sparkles,
} from 'lucide-react';
import { Transaction, UserSettings, ExpenseCategory } from '../types';
import {
  formatRupiah,
  formatPercentage,
  formatDateIndo,
  formatMonthYearIndo,
} from '../utils/formatters';
import { calculateCategoryExpenses, calculateNetWorthTrends } from '../utils/calculations';
import { generateMonthlyPDF, MonthlyReportData } from '../utils/pdfExport';

interface MonthlyReportViewProps {
  transactions: Transaction[];
  settings: UserSettings;
}

export const MonthlyReportView: React.FC<MonthlyReportViewProps> = ({
  transactions,
  settings,
}) => {
  // Ambil daftar unik bulan yang tersedia dari data transaksi
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    transactions.forEach((t) => {
      months.add(t.date.slice(0, 7));
    });
    const sorted = Array.from(months).sort().reverse();
    return sorted.length > 0 ? sorted : [new Date().toISOString().slice(0, 7)];
  }, [transactions]);

  // Default ke bulan terbaru
  const [selectedMonth, setSelectedMonth] = useState<string>(() => availableMonths[0]);

  // Filter transaksi untuk bulan terpilih
  const monthTransactions = useMemo(() => {
    return transactions
      .filter((t) => t.date.slice(0, 7) === selectedMonth)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [transactions, selectedMonth]);

  // Hitung ringkasan bulan terpilih
  const reportData: MonthlyReportData = useMemo(() => {
    let incomeTotal = 0;
    let expenseTotal = 0;
    let investmentTotal = 0;

    monthTransactions.forEach((t) => {
      if (t.type === 'income') {
        incomeTotal += t.amount;
      } else if (t.type === 'expense') {
        expenseTotal += t.amount;
      } else if (t.type === 'investment') {
        investmentTotal += t.amount;
      }
    });

    const netCashFlow = incomeTotal - expenseTotal;
    const savingsRate = incomeTotal > 0 ? Math.max(0, (netCashFlow / incomeTotal) * 100) : 0;

    // Nilai bersih akhir bulan
    const netWorthSummary = calculateNetWorthTrends(transactions, settings);
    const monthNetWorthItem = netWorthSummary.history.find((h) => h.monthKey === selectedMonth);
    const endingNetWorth = monthNetWorthItem
      ? monthNetWorthItem.netWorth
      : netWorthSummary.currentNetWorth;

    // Kategori pengeluaran dengan perbandingan batas anggaran
    const categoryExpenses = calculateCategoryExpenses(monthTransactions, settings).map((c) => {
      const budget = (settings.categoryBudgets as any)[c.category] || 0;
      const budgetRatio = budget > 0 ? (c.total / budget) * 100 : 0;
      return {
        category: c.category,
        total: c.total,
        percentage: c.percentage,
        budget,
        budgetRatio,
      };
    });

    return {
      monthKey: selectedMonth,
      monthName: formatMonthYearIndo(selectedMonth),
      incomeTotal,
      expenseTotal,
      investmentTotal,
      netCashFlow,
      savingsRate,
      endingNetWorth,
      categoryExpenses,
      transactions: monthTransactions,
    };
  }, [monthTransactions, selectedMonth, transactions, settings]);

  const handleDownloadPDF = () => {
    generateMonthlyPDF(reportData, settings);
  };

  const hasData = monthTransactions.length > 0;

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 rounded-full border border-indigo-200/50 dark:border-indigo-800/50">
              Dokumen Cetak & Arsip
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Format Standar Bersih (A4)
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
            Laporan Bulanan Arus Kas
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Pilih periode bulan dan tahun untuk melihat pratinjau serta mengunduh dokumen PDF resmi.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Month Selector */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3.5 py-2 text-sm font-semibold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition"
            >
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {formatMonthYearIndo(m)}
                </option>
              ))}
            </select>
          </div>

          {/* Download PDF Button */}
          <button
            onClick={handleDownloadPDF}
            disabled={!hasData}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl shadow-md transition ${
              hasData
                ? 'text-white bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/25 active:scale-98 cursor-pointer'
                : 'text-slate-400 bg-slate-200 dark:bg-slate-800 cursor-not-allowed shadow-none'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Unduh PDF</span>
          </button>
        </div>
      </div>

      {/* Screen Preview Container */}
      {!hasData ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Inbox className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base">
            Tidak Ada Transaksi di Bulan {formatMonthYearIndo(selectedMonth)}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
            Belum ada catatan transaksi pemasukan, pengeluaran, atau investasi untuk periode ini. Silakan pilih bulan lain atau catat transaksi terlebih dahulu di tab Catat Transaksi.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-8">
          {/* Header Preview */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
            <div>
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 tracking-wider uppercase">
                Pratinjau Dokumen PDF
              </span>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                Laporan Cash Flow – {reportData.monthName}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Nama File Unduhan: <code className="text-indigo-600 dark:text-indigo-400 font-mono font-bold">cashflow-{reportData.monthKey}.pdf</code>
              </p>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-xs text-slate-400 block">Total Transaksi</span>
              <span className="text-lg font-black text-slate-900 dark:text-white">
                {reportData.transactions.length} Transaksi
              </span>
            </div>
          </div>

          {/* KPI Summary Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Pemasukan */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                Total Pemasukan
              </span>
              <span className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400 tabular-nums block mt-1">
                {formatRupiah(reportData.incomeTotal)}
              </span>
            </div>

            {/* Pengeluaran */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                Total Pengeluaran
              </span>
              <span className="text-sm sm:text-base font-black text-rose-500 tabular-nums block mt-1">
                {formatRupiah(reportData.expenseTotal)}
              </span>
            </div>

            {/* Investasi */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                Total Investasi
              </span>
              <span className="text-sm sm:text-base font-black text-blue-500 tabular-nums block mt-1">
                {formatRupiah(reportData.investmentTotal)}
              </span>
            </div>

            {/* Arus Kas Bersih */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                Arus Kas Bersih
              </span>
              <span
                className={`text-sm sm:text-base font-black tabular-nums block mt-1 ${
                  reportData.netCashFlow >= 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {formatRupiah(reportData.netCashFlow)}
              </span>
            </div>

            {/* Savings Rate */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                Savings Rate
              </span>
              <span className="text-sm sm:text-base font-black text-indigo-600 dark:text-indigo-400 tabular-nums block mt-1">
                {formatPercentage(reportData.savingsRate)}
              </span>
            </div>

            {/* Nilai Bersih Akhir Bulan */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                Nilai Bersih Akhir
              </span>
              <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white tabular-nums block mt-1">
                {formatRupiah(reportData.endingNetWorth)}
              </span>
            </div>
          </div>

          {/* Section: Progress Bar Realisasi Anggaran per Kategori */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <h4 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                <span>Realisasi Pengeluaran terhadap Anggaran Bulanan</span>
              </h4>
              <div className="flex items-center gap-3 text-[11px] font-semibold">
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> &lt;70% Aman
                </span>
                <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                  <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> 70-89% Waspada
                </span>
                <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
                  <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> &ge;90% Bahaya
                </span>
              </div>
            </div>

            {reportData.categoryExpenses.filter((c) => c.total > 0).length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                Tidak ada data pengeluaran pada bulan yang dipilih
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {reportData.categoryExpenses
                  .filter((c) => c.total > 0)
                  .map((cat) => {
                    const budget = cat.budget || 0;
                    const ratio = budget > 0 ? (cat.total / budget) * 100 : 0;
                    const cappedRatio = Math.min(100, Math.max(0, ratio));

                    // Indikator warna dinamis sesuai instruksi:
                    // Hijau (< 70%), Kuning/Oranye (70% - 89%), Merah (>= 90%)
                    let barColor = 'bg-emerald-500';
                    let textColor = 'text-emerald-600 dark:text-emerald-400';
                    let badgeColor =
                      'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
                    let statusLabel = 'Aman';

                    if (ratio >= 90) {
                      barColor = 'bg-rose-500';
                      textColor = 'text-rose-600 dark:text-rose-400';
                      badgeColor =
                        'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800';
                      statusLabel = ratio >= 100 ? 'Overbudget' : 'Bahaya';
                    } else if (ratio >= 70) {
                      barColor = 'bg-amber-500';
                      textColor = 'text-amber-600 dark:text-amber-400';
                      badgeColor =
                        'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
                      statusLabel = 'Waspada';
                    }

                    return (
                      <div
                        key={cat.category}
                        className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2.5 transition-smooth hover:border-slate-300 dark:hover:border-slate-700"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-slate-900 dark:text-white">
                            {cat.category}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${badgeColor}`}
                          >
                            {statusLabel}
                          </span>
                        </div>

                        {/* Visual Progress Bar Track */}
                        <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                            style={{
                              width: `${budget > 0 ? cappedRatio : 100}%`,
                            }}
                          />
                        </div>

                        {/* Detail Teks Nominal */}
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-600 dark:text-slate-300 font-medium">
                            {budget > 0 ? (
                              <>
                                <strong className="text-slate-900 dark:text-white tabular-nums">
                                  {formatRupiah(cat.total)}
                                </strong>{' '}
                                dari{' '}
                                <span className="text-slate-500 dark:text-slate-400 tabular-nums">
                                  {formatRupiah(budget)}
                                </span>
                              </>
                            ) : (
                              <>
                                <strong className="text-slate-900 dark:text-white tabular-nums">
                                  {formatRupiah(cat.total)}
                                </strong>{' '}
                                <span className="text-slate-400">(Tanpa batas)</span>
                              </>
                            )}
                          </span>
                          <span
                            className={`font-black tabular-nums ${
                              budget > 0 ? textColor : 'text-slate-400'
                            }`}
                          >
                            {budget > 0
                              ? `(${ratio.toFixed(1)}%)`
                              : formatPercentage(cat.percentage)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          {/* Section: Pengeluaran per Kategori (Tabel Rincian) */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>Tabel Rincian & Porsi Pengeluaran</span>
            </h4>
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                <thead className="bg-indigo-600 text-white text-xs uppercase font-semibold">
                  <tr>
                    <th className="py-2.5 px-4">Kategori Pengeluaran</th>
                    <th className="py-2.5 px-4 text-center">Porsi (%)</th>
                    <th className="py-2.5 px-4 text-right">Nominal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {reportData.categoryExpenses.filter((c) => c.total > 0).length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-4 text-center text-xs text-slate-400">
                        Tidak ada pengeluaran yang tercatat pada bulan ini
                      </td>
                    </tr>
                  ) : (
                    reportData.categoryExpenses
                      .filter((c) => c.total > 0)
                      .map((cat) => (
                        <tr key={cat.category} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="py-2.5 px-4 font-medium text-slate-900 dark:text-white">
                            {cat.category}
                          </td>
                          <td className="py-2.5 px-4 text-center tabular-nums">
                            {formatPercentage(cat.percentage)}
                          </td>
                          <td className="py-2.5 px-4 text-right font-bold text-slate-900 dark:text-white tabular-nums">
                            {formatRupiah(cat.total)}
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section: Seluruh Transaksi */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              <span>Daftar Transaksi Bulan {reportData.monthName}</span>
            </h4>
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                <thead className="bg-indigo-600 text-white text-xs uppercase font-semibold">
                  <tr>
                    <th className="py-2.5 px-4">Tanggal</th>
                    <th className="py-2.5 px-4 text-center">Jenis</th>
                    <th className="py-2.5 px-4">Kategori</th>
                    <th className="py-2.5 px-4">Catatan</th>
                    <th className="py-2.5 px-4 text-right">Nominal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {reportData.transactions.map((t) => {
                    const isIncome = t.type === 'income';
                    const isInvest = t.type === 'investment';
                    return (
                      <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 px-4 text-xs font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">
                          {formatDateIndo(t.date)}
                        </td>
                        <td className="py-2.5 px-4 text-center whitespace-nowrap">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isIncome
                                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                                : isInvest
                                ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                                : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                            }`}
                          >
                            {isIncome ? 'Pemasukan' : isInvest ? 'Investasi' : 'Pengeluaran'}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-xs font-medium">{t.category}</td>
                        <td className="py-2.5 px-4 text-xs text-slate-500 max-w-xs truncate">
                          {t.note || '-'}
                        </td>
                        <td
                          className={`py-2.5 px-4 text-right text-xs font-bold tabular-nums whitespace-nowrap ${
                            isIncome
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : isInvest
                              ? 'text-blue-600 dark:text-blue-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {isIncome ? `+${formatRupiah(t.amount)}` : isInvest ? formatRupiah(t.amount) : `-${formatRupiah(t.amount)}`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-slate-100 dark:bg-slate-800/70 font-bold text-slate-900 dark:text-white text-xs border-t border-slate-200 dark:border-slate-700">
                  <tr>
                    <td colSpan={3} className="py-3 px-4">
                      Total Arus Kas Masuk & Keluar
                    </td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                      Pemasukan: {formatRupiah(reportData.incomeTotal)} | Pengeluaran: {formatRupiah(reportData.expenseTotal)}
                    </td>
                    <td className="py-3 px-4 text-right text-indigo-600 dark:text-indigo-400 tabular-nums">
                      Net: {formatRupiah(reportData.netCashFlow)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

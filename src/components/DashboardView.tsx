import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Scale,
  Percent,
  Shield,
  Calendar,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Coins,
} from 'lucide-react';
import {
  Transaction,
  UserSettings,
  FilterPeriod,
  EwsAlert,
  EwsSeverity,
} from '../types';
import {
  filterTransactionsByPeriod,
  calculateCashFlowSummary,
  calculateMonthlyTrends,
  calculateCategoryExpenses,
  calculate50_30_20,
  calculateEmergencyFundStatus,
  calculateInvestmentCapacity,
  calculateNetWorthTrends,
} from '../utils/calculations';
import { formatRupiah, formatPercentage } from '../utils/formatters';
import { EwsBanner } from './EwsBanner';
import { RedesignedEwsResult } from '../utils/ews';
import { NetWorthAreaChart } from './NetWorthAreaChart';
import { DashboardCharts } from './DashboardCharts';
import { SpendingTrendsChart } from './SpendingTrendsChart';
import { InvestmentPanel } from './InvestmentPanel';
import { DashboardAuthBanner } from './DashboardAuthBanner';
import { User } from 'firebase/auth';
import { SyncStatus } from '../services/firebase';

interface DashboardViewProps {
  transactions: Transaction[];
  settings: UserSettings;
  period: FilterPeriod;
  setPeriod: (period: FilterPeriod) => void;
  ewsStatus: EwsSeverity;
  statusBadgeText: string;
  statusHeadline: string;
  alerts: EwsAlert[];
  dismissedAlertIds: string[];
  onDismissAlert: (id: string) => void;
  onRestoreDismissedAlerts: () => void;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
  isDarkMode: boolean;
  evaluation?: RedesignedEwsResult;
  currentUser?: User | null;
  onOpenAddModal?: () => void;
  onGoogleSignIn?: () => void;
  syncStatus?: SyncStatus;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  transactions,
  settings,
  period,
  setPeriod,
  ewsStatus,
  statusBadgeText,
  statusHeadline,
  alerts,
  dismissedAlertIds,
  onDismissAlert,
  onRestoreDismissedAlerts,
  onUpdateSettings,
  isDarkMode,
  evaluation,
  currentUser,
  onOpenAddModal,
  onGoogleSignIn,
  syncStatus = 'synced',
}) => {
  // Transaksi terfilter sesuai periode yang dipilih
  const filteredTransactions = filterTransactionsByPeriod(transactions, period);

  // Kalkulasi metrik arus kas
  const summary = calculateCashFlowSummary(filteredTransactions);
  const monthlyTrends = calculateMonthlyTrends(filteredTransactions);
  const categoryExpenses = calculateCategoryExpenses(filteredTransactions, settings);
  const rule50_30_20 = calculate50_30_20(filteredTransactions);

  // Status dana darurat
  const emergencyFundStatus = calculateEmergencyFundStatus(
    settings.currentEmergencyFund,
    settings.emergencyFundMonthsTarget,
    summary.avgMonthlyExpense,
    summary.netCashFlow / Math.max(1, summary.monthsCount)
  );

  // Kapasitas investasi
  const investmentCapacity = calculateInvestmentCapacity(
    summary,
    filteredTransactions,
    emergencyFundStatus
  );

  // Kalkulasi perkembangan nilai bersih (Net Worth Trends)
  const netWorthData = calculateNetWorthTrends(transactions, settings);

  const isNetPositive = summary.netCashFlow >= 0;

  return (
    <div className="space-y-6">
      {/* 0. Status Welcoming & Persistent Auth Header */}
      <DashboardAuthBanner
        currentUser={currentUser}
        syncStatus={syncStatus}
        onGoogleSignIn={onGoogleSignIn}
      />

      {/* 1. Early Warning System Banner with Dynamic Budget Bar Chart */}
      <EwsBanner
        evaluation={evaluation}
        transactions={transactions}
        settings={settings}
        period={period}
        isDarkMode={isDarkMode}
        overallStatus={ewsStatus}
        statusBadgeText={statusBadgeText}
        statusHeadline={statusHeadline}
        alerts={alerts}
        dismissedAlertIds={dismissedAlertIds}
        onDismissAlert={onDismissAlert}
        onRestoreDismissedAlerts={onRestoreDismissedAlerts}
      />

      {/* Empty State Banner when no transactions */}
      {transactions.length === 0 && (
        <div className="bg-gradient-to-br from-indigo-50/90 via-white to-blue-50/60 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/40 rounded-3xl p-6 sm:p-8 border border-indigo-100 dark:border-indigo-900/50 shadow-sm text-center">
          <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <Coins className="w-7 h-7" />
          </div>
          <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
            Belum Ada Riwayat Transaksi
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-lg mx-auto mt-1.5 leading-relaxed">
            Data transaksi Anda masih kosong. Masuk dengan akun Google untuk menyinkronkan data keuangan pribadi dari cloud, atau mulai catat transaksi pertama Anda untuk mengaktifkan pemantauan real-time.
          </p>
          <div className="flex items-center justify-center gap-3 mt-5 flex-wrap">
            {onOpenAddModal && (
              <button
                type="button"
                onClick={onOpenAddModal}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-indigo-600/25 transition-smooth active:scale-98"
              >
                <span>+ Catat Transaksi Pertama</span>
              </button>
            )}
            {!currentUser && onGoogleSignIn && (
              <button
                type="button"
                onClick={onGoogleSignIn}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-bold shadow-2xs transition-smooth active:scale-98"
              >
                <span>Masuk dengan Google</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 2. Top Header & Period Filter */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-smooth hover:border-slate-300 dark:hover:border-slate-700">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            Ringkasan Kinerja Arus Kas
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Menampilkan data kalkulasi dari {summary.monthsCount} bulan terpilih
          </p>
        </div>

        {/* Filter Periode Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl overflow-x-auto border border-slate-200/60 dark:border-slate-700/60">
          {[
            { id: 'this_month', label: 'Bulan Ini' },
            { id: '3_months', label: '3 Bulan' },
            { id: '6_months', label: '6 Bulan' },
            { id: 'this_year', label: 'Tahun Ini' },
            { id: 'all', label: 'Semua' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setPeriod(item.id as FilterPeriod)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-smooth whitespace-nowrap ${
                period === item.id
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Kartu KPI Utama (Grid 12-kolom responsif, tipografi tebal & tabular-nums) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Pemasukan */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-smooth hover:shadow-md hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Pemasukan
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h4 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight tabular-nums">
              {formatRupiah(summary.totalIncome)}
            </h4>
            <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1 tabular-nums">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>{formatRupiah(summary.avgMonthlyIncome)} /bln</span>
            </div>
          </div>
        </div>

        {/* Total Pengeluaran */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-smooth hover:shadow-md hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Pengeluaran
            </span>
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h4 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight tabular-nums">
              {formatRupiah(summary.totalExpense)}
            </h4>
            <div className="flex items-center gap-1 text-xs text-rose-500 font-semibold mt-1 tabular-nums">
              <ArrowDownRight className="w-3.5 h-3.5" />
              <span>{formatRupiah(summary.avgMonthlyExpense)} /bln</span>
            </div>
          </div>
        </div>

        {/* Arus Kas Bersih */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-smooth hover:shadow-md hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Arus Kas Bersih
            </span>
            <div
              className={`p-2 rounded-xl ${
                isNetPositive
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                  : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
              }`}
            >
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h4
              className={`text-xl sm:text-2xl font-black tracking-tight tabular-nums ${
                isNetPositive
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {formatRupiah(summary.netCashFlow)}
            </h4>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
              {isNetPositive ? 'Surplus Tersisa' : 'Defisit Arus Kas'}
            </div>
          </div>
        </div>

        {/* Savings Rate */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-smooth hover:shadow-md hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Savings Rate
            </span>
            <div
              className={`p-2 rounded-xl ${
                summary.savingsRate >= 20
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                  : 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
              }`}
            >
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h4 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight tabular-nums">
              {formatPercentage(summary.savingsRate)}
            </h4>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
              {summary.savingsRate >= 20 ? 'Optimal (≥20%)' : 'Perlu Dioptimalkan (<20%)'}
            </div>
          </div>
        </div>

        {/* Dana Darurat Terkumpul */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm sm:col-span-2 lg:col-span-1 transition-smooth hover:shadow-md hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Dana Darurat
            </span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Shield className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h4 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight tabular-nums">
              {emergencyFundStatus.fundedMonths.toFixed(1)} Bulan
            </h4>
            <div className="text-xs text-blue-600 dark:text-blue-400 font-semibold mt-1">
              Target: {settings.emergencyFundMonthsTarget} Bulan Pengeluaran
            </div>
          </div>
        </div>
      </div>

      {/* 4. GRAFIK AREA NILAI BERSIH (LEBAR PENUH, TEPAT DI BAWAH KARTU KPI - Task 1) */}
      <NetWorthAreaChart netWorthData={netWorthData} isDarkMode={isDarkMode} />

      {/* 5. Grafik Recharts (Tren Bulanan, Kumulatif, Donut Kategori) */}
      <DashboardCharts
        monthlyTrends={monthlyTrends}
        categoryExpenses={categoryExpenses}
        isDarkMode={isDarkMode}
      />

      {/* 6. Visualisasi Tren Pengeluaran per Kategori (Historical Spending Trends) */}
      <SpendingTrendsChart
        transactions={transactions}
        isDarkMode={isDarkMode}
      />

      {/* 7. Panel Rekomendasi Investasi Lengkap */}
      <InvestmentPanel
        summary={summary}
        capacity={investmentCapacity}
        rule50_30_20={rule50_30_20}
        emergencyFundStatus={emergencyFundStatus}
        settings={settings}
        onUpdateSettings={onUpdateSettings}
      />
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine,
  Cell,
} from 'recharts';
import {
  BarChart3,
  SlidersHorizontal,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  TrendingUp,
  Percent,
  Coins,
  ArrowUpDown,
  Filter,
  Info,
} from 'lucide-react';
import { Transaction, UserSettings, ExpenseCategory, FilterPeriod } from '../types';
import { formatRupiah, formatPercentage } from '../utils/formatters';

interface EwsBudgetBarChartProps {
  transactions: Transaction[];
  settings: UserSettings;
  period?: FilterPeriod;
  isDarkMode?: boolean;
}

type ChartViewMode = 'dual' | 'percentage';
type SortOption = 'usage_desc' | 'actual_desc' | 'budget_desc' | 'name_asc';
type StatusFilter = 'all' | 'danger' | 'warning_danger' | 'safe';

export const EwsBudgetBarChart: React.FC<EwsBudgetBarChartProps> = ({
  transactions,
  settings,
  period = 'this_month',
  isDarkMode = false,
}) => {
  const [viewMode, setViewMode] = useState<ChartViewMode>('dual');
  const [sortBy, setSortBy] = useState<SortOption>('usage_desc');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Hitung jumlah bulan yang dicakup oleh periode aktif
  const monthsCount = useMemo(() => {
    switch (period) {
      case '3_months':
        return 3;
      case '6_months':
        return 6;
      case 'this_year':
      case 'all':
        // Cari span bulan unik dalam transaksi
        if (transactions.length === 0) return 1;
        const uniqueMonths = new Set(transactions.map((t) => t.date.slice(0, 7)));
        return Math.max(1, uniqueMonths.size);
      case 'this_month':
      default:
        return 1;
    }
  }, [period, transactions]);

  // Ambang batas dari pengaturan EWS pengguna (default 80% & 100%)
  const warningThreshold = settings.ewsThresholds?.budgetUsageWarning ?? 80;
  const dangerThreshold = settings.ewsThresholds?.budgetUsageDanger ?? 100;

  // Daftar kategori pengeluaran standar
  const categoriesList: ExpenseCategory[] = useMemo(() => {
    return [
      'Kebutuhan Pokok',
      'Transportasi',
      'Tagihan',
      'Cicilan/Utang',
      'Hiburan',
      'Pendidikan',
      'Kesehatan',
      'Lainnya',
    ];
  }, []);

  // Hitung agregat pengeluaran aktual per kategori real-time
  const chartDataRaw = useMemo(() => {
    const expenseMap: Record<string, number> = {};
    transactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        expenseMap[t.category] = (expenseMap[t.category] || 0) + t.amount;
      });

    return categoriesList.map((category) => {
      const actual = expenseMap[category] || 0;
      const baseMonthlyBudget = settings.categoryBudgets[category] || 0;
      // Sesuaikan batas anggaran dengan durasi periode yang dipilih
      const budget = baseMonthlyBudget * monthsCount;
      const usagePercent = budget > 0 ? (actual / budget) * 100 : 0;
      const diff = budget - actual; // positif = sisa kuota, negatif = over budget

      let status: 'aman' | 'waspada' | 'bahaya' = 'aman';
      if (usagePercent > dangerThreshold) {
        status = 'bahaya';
      } else if (usagePercent >= warningThreshold) {
        status = 'waspada';
      }

      return {
        category,
        actual,
        budget,
        baseMonthlyBudget,
        usagePercent: Math.round(usagePercent * 10) / 10,
        remaining: Math.max(0, diff),
        overBudget: Math.max(0, -diff),
        status,
        isOverBudget: actual > budget,
      };
    });
  }, [transactions, settings.categoryBudgets, monthsCount, categoriesList, warningThreshold, dangerThreshold]);

  // Filter & sorting dinamis
  const filteredAndSortedData = useMemo(() => {
    let result = [...chartDataRaw];

    // Filter Status EWS
    if (statusFilter === 'danger') {
      result = result.filter((d) => d.status === 'bahaya');
    } else if (statusFilter === 'warning_danger') {
      result = result.filter((d) => d.status === 'waspada' || d.status === 'bahaya');
    } else if (statusFilter === 'safe') {
      result = result.filter((d) => d.status === 'aman');
    }

    // Sorting
    switch (sortBy) {
      case 'usage_desc':
        result.sort((a, b) => b.usagePercent - a.usagePercent);
        break;
      case 'actual_desc':
        result.sort((a, b) => b.actual - a.actual);
        break;
      case 'budget_desc':
        result.sort((a, b) => b.budget - a.budget);
        break;
      case 'name_asc':
        result.sort((a, b) => a.category.localeCompare(b.category));
        break;
    }

    return result;
  }, [chartDataRaw, statusFilter, sortBy]);

  // Statistik agregat EWS untuk header chart
  const summaryStats = useMemo(() => {
    const totalActual = chartDataRaw.reduce((acc, curr) => acc + curr.actual, 0);
    const totalBudget = chartDataRaw.reduce((acc, curr) => acc + curr.budget, 0);
    const totalUsagePercent = totalBudget > 0 ? (totalActual / totalBudget) * 100 : 0;
    const overBudgetCount = chartDataRaw.filter((c) => c.status === 'bahaya').length;
    const warningCount = chartDataRaw.filter((c) => c.status === 'waspada').length;
    const safeCount = chartDataRaw.filter((c) => c.status === 'aman').length;

    return {
      totalActual,
      totalBudget,
      totalUsagePercent: Math.round(totalUsagePercent * 10) / 10,
      overBudgetCount,
      warningCount,
      safeCount,
      overallStatus:
        overBudgetCount > 0 ? 'bahaya' : warningCount > 0 ? 'waspada' : 'aman',
    };
  }, [chartDataRaw]);

  // Warna grafik adaptif berdasarkan tema
  const gridColor = isDarkMode ? '#334155' : '#E2E8F0';
  const textColor = isDarkMode ? '#CBD5E1' : '#64748B';
  const budgetBarColor = isDarkMode ? '#475569' : '#94A3B8';

  const getBarColor = (item: (typeof chartDataRaw)[0]) => {
    if (item.status === 'bahaya') return '#EF4444'; // Red/Rose
    if (item.status === 'waspada') return '#F59E0B'; // Amber
    return '#10B981'; // Emerald
  };

  // Custom Tooltip Interaktif
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    const data = payload[0].payload;

    return (
      <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl text-xs space-y-2 max-w-xs animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
          <span className="font-black text-slate-900 dark:text-white text-sm">
            {data.category}
          </span>
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black border ${
              data.status === 'bahaya'
                ? 'bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                : data.status === 'waspada'
                ? 'bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                : 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
            }`}
          >
            {data.status === 'bahaya' ? (
              <AlertOctagon className="w-3 h-3 text-rose-500" />
            ) : data.status === 'waspada' ? (
              <AlertTriangle className="w-3 h-3 text-amber-500" />
            ) : (
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            )}
            <span className="uppercase">{data.status}</span>
          </span>
        </div>

        <div className="space-y-1.5 pt-0.5">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
            <span>Pengeluaran Aktual:</span>
            <span className="font-bold text-slate-900 dark:text-white tabular-nums">
              {formatRupiah(data.actual)}
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
            <span>Batas Anggaran:</span>
            <span className="font-bold text-slate-900 dark:text-white tabular-nums">
              {formatRupiah(data.budget)}
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
            <span>Rasio Pemakaian:</span>
            <span
              className={`font-black tabular-nums ${
                data.status === 'bahaya'
                  ? 'text-rose-600 dark:text-rose-400'
                  : data.status === 'waspada'
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {data.usagePercent}%
            </span>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-1.5 flex items-center justify-between text-[11px]">
            {data.isOverBudget ? (
              <>
                <span className="text-rose-600 dark:text-rose-400 font-semibold">
                  Melebihi Anggaran:
                </span>
                <span className="font-black text-rose-600 dark:text-rose-400 tabular-nums">
                  +{formatRupiah(data.overBudget)}
                </span>
              </>
            ) : (
              <>
                <span className="text-slate-500 dark:text-slate-400">Sisa Kuota Anggaran:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {formatRupiah(data.remaining)}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="mt-4 pt-4 border-t border-slate-200/80 dark:border-slate-800 space-y-4">
      {/* 1. Header Bagian Grafik dengan Badge Agregat */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white/70 dark:bg-slate-900/80 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <BarChart3 className="w-4 h-4" />
            </span>
            <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
              Visualisasi Real-Time: Pengeluaran Aktual vs Batas Anggaran EWS
            </h4>
            {monthsCount > 1 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                Rentang {monthsCount} Bulan
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Perbandingan dinamis alokasi anggaran terhadap belanja riil per kategori pengeluaran
          </p>
        </div>

        {/* Ringkasan Status Pill Cepat */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
            <span className="text-slate-500 dark:text-slate-400">Total Terpakai:</span>
            <span
              className={`font-black tabular-nums ${
                summaryStats.totalUsagePercent > dangerThreshold
                  ? 'text-rose-600 dark:text-rose-400'
                  : summaryStats.totalUsagePercent >= warningThreshold
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {summaryStats.totalUsagePercent}%
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            {summaryStats.overBudgetCount > 0 ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold border border-rose-200 dark:border-rose-900/60">
                <AlertOctagon className="w-3.5 h-3.5 text-rose-500" />
                <span>{summaryStats.overBudgetCount} Over Budget</span>
              </span>
            ) : summaryStats.warningCount > 0 ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold border border-amber-200 dark:border-amber-900/60">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                <span>{summaryStats.warningCount} Waspada</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-900/60">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Semua Anggaran Terkendali</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2. Kontrol Interaktif: Mode Tampilan, Filter Status & Sorting */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Toggle Mode Tampilan (Dual Bar vs Persentase) */}
        <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setViewMode('dual')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-smooth ${
              viewMode === 'dual'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Dual Bar (Rp)</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('percentage')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-smooth ${
              viewMode === 'percentage'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Percent className="w-3.5 h-3.5" />
            <span>Rasio Pemakaian (%)</span>
          </button>
        </div>

        {/* Filter & Sort Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Filter */}
          <div className="flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 shadow-2xs"
            >
              <option value="all">Semua Kategori ({chartDataRaw.length})</option>
              <option value="danger">Hanya Over Budget ({summaryStats.overBudgetCount})</option>
              <option value="warning_danger">
                Waspada &amp; Bahaya ({summaryStats.warningCount + summaryStats.overBudgetCount})
              </option>
              <option value="safe">Hanya Aman ({summaryStats.safeCount})</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 shadow-2xs"
            >
              <option value="usage_desc">Urut: % Pemakaian Tertinggi</option>
              <option value="actual_desc">Urut: Pengeluaran Terbesar</option>
              <option value="budget_desc">Urut: Anggaran Terbesar</option>
              <option value="name_asc">Urut: Nama Kategori (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Area Visualisasi Recharts Bar Chart */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-4 flex-wrap">
            {viewMode === 'dual' ? (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" />
                  <span>Aktual (Aman)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-amber-500 inline-block" />
                  <span>Aktual (Waspada &gt;={warningThreshold}%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-rose-500 inline-block" />
                  <span>Aktual (Over Budget &gt;{dangerThreshold}%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-slate-400 dark:bg-slate-600 inline-block" />
                  <span>Batas Anggaran</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" />
                  <span>&lt; {warningThreshold}% (Aman)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-amber-500 inline-block" />
                  <span>{warningThreshold}% - {dangerThreshold}% (Waspada)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-rose-500 inline-block" />
                  <span>&gt; {dangerThreshold}% (Bahaya)</span>
                </div>
              </>
            )}
          </div>
          <span className="text-[11px] italic hidden md:inline">
            Arahkan kursor pada bar untuk rincian nominal
          </span>
        </div>

        <div className="h-80 w-full">
          {filteredAndSortedData.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-xs text-slate-400 space-y-1">
              <Info className="w-6 h-6 text-slate-300 dark:text-slate-600" />
              <span>Tidak ada kategori yang sesuai dengan filter yang dipilih.</span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              {viewMode === 'dual' ? (
                <BarChart
                  data={filteredAndSortedData}
                  margin={{ top: 15, right: 15, left: 10, bottom: 25 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis
                    dataKey="category"
                    stroke={textColor}
                    fontSize={11}
                    tickLine={false}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                    height={45}
                  />
                  <YAxis
                    stroke={textColor}
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `Rp ${(val / 1000000).toFixed(1)}jt`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="budget"
                    name="Batas Anggaran"
                    fill={budgetBarColor}
                    radius={[6, 6, 0, 0]}
                    maxBarSize={36}
                    opacity={0.85}
                  />
                  <Bar
                    dataKey="actual"
                    name="Pengeluaran Aktual"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={36}
                  >
                    {filteredAndSortedData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getBarColor(entry)} />
                    ))}
                  </Bar>
                </BarChart>
              ) : (
                <BarChart
                  data={filteredAndSortedData}
                  margin={{ top: 15, right: 15, left: 10, bottom: 25 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis
                    dataKey="category"
                    stroke={textColor}
                    fontSize={11}
                    tickLine={false}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                    height={45}
                  />
                  <YAxis
                    stroke={textColor}
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    domain={[0, (dataMax: number) => Math.max(120, Math.ceil(dataMax / 20) * 20)]}
                    tickFormatter={(val) => `${val}%`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine
                    y={warningThreshold}
                    stroke="#F59E0B"
                    strokeDasharray="4 4"
                    label={{
                      value: `Waspada (${warningThreshold}%)`,
                      fill: '#F59E0B',
                      fontSize: 10,
                      position: 'top',
                    }}
                  />
                  <ReferenceLine
                    y={dangerThreshold}
                    stroke="#EF4444"
                    strokeDasharray="4 4"
                    label={{
                      value: `Batas Anggaran (${dangerThreshold}%)`,
                      fill: '#EF4444',
                      fontSize: 10,
                      position: 'top',
                    }}
                  />
                  <Bar
                    dataKey="usagePercent"
                    name="Pemakaian Anggaran (%)"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={44}
                  >
                    {filteredAndSortedData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getBarColor(entry)} />
                    ))}
                  </Bar>
                </BarChart>
              )}
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 4. Kartu Mini Pemakaian Anggaran per Kategori */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
        {filteredAndSortedData.map((cat) => {
          return (
            <div
              key={cat.category}
              className={`p-3.5 rounded-xl border transition-smooth bg-white dark:bg-slate-900 ${
                cat.status === 'bahaya'
                  ? 'border-rose-300 dark:border-rose-900/60 shadow-xs'
                  : cat.status === 'waspada'
                  ? 'border-amber-300 dark:border-amber-900/60 shadow-xs'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                  {cat.category}
                </span>
                <span
                  className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                    cat.status === 'bahaya'
                      ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300'
                      : cat.status === 'waspada'
                      ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300'
                      : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
                  }`}
                >
                  {cat.usagePercent}%
                </span>
              </div>

              {/* Progress bar dinamis */}
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden mb-2">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    cat.status === 'bahaya'
                      ? 'bg-rose-500'
                      : cat.status === 'waspada'
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, cat.usagePercent)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span>Aktual:</span>
                <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                  {formatRupiah(cat.actual)}
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span>Batas:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
                  {formatRupiah(cat.budget)}
                </span>
              </div>

              <div className="mt-1 pt-1 border-t border-slate-100 dark:border-slate-800 text-[10px] flex items-center justify-between">
                {cat.isOverBudget ? (
                  <span className="text-rose-600 dark:text-rose-400 font-bold">
                    Over +{formatRupiah(cat.overBudget)}
                  </span>
                ) : (
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                    Sisa {formatRupiah(cat.remaining)}
                  </span>
                )}
                <span className="text-slate-400">
                  {cat.status === 'bahaya'
                    ? 'Bahaya EWS'
                    : cat.status === 'waspada'
                    ? 'Waspada EWS'
                    : 'Aman'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Layers,
  BarChart3,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { Transaction, ExpenseCategory } from '../types';
import { formatRupiah, formatPercentage, formatMonthYearIndo } from '../utils/formatters';

interface SpendingTrendsChartProps {
  transactions: Transaction[];
  isDarkMode: boolean;
}

const CATEGORY_CONFIG: Record<
  ExpenseCategory,
  { label: string; color: string; darkColor: string }
> = {
  'Makanan & Minuman': { label: 'Makanan & Minuman', color: '#10B981', darkColor: '#34D399' },
  Transportasi: { label: 'Transportasi', color: '#3B82F6', darkColor: '#60A5FA' },
  'Tagihan & Rutin': { label: 'Tagihan & Rutin', color: '#F59E0B', darkColor: '#FBBF24' },
  'Belanja & Gaya Hidup': { label: 'Belanja & Gaya Hidup', color: '#EC4899', darkColor: '#F472B6' },
  Hiburan: { label: 'Hiburan', color: '#8B5CF6', darkColor: '#A78BFA' },
  Kesehatan: { label: 'Kesehatan', color: '#14B8A6', darkColor: '#2DD4BF' },
  'Kebutuhan Pokok': { label: 'Kebutuhan Pokok', color: '#059669', darkColor: '#10B981' },
  Tagihan: { label: 'Tagihan', color: '#D97706', darkColor: '#F59E0B' },
  'Cicilan/Utang': { label: 'Cicilan / Utang', color: '#EF4444', darkColor: '#F87171' },
  Pendidikan: { label: 'Pendidikan', color: '#06B6D4', darkColor: '#22D3EE' },
  Lainnya: { label: 'Lainnya', color: '#64748B', darkColor: '#94A3B8' },
};

const ALL_CATEGORIES: ExpenseCategory[] = [
  'Makanan & Minuman',
  'Transportasi',
  'Tagihan & Rutin',
  'Belanja & Gaya Hidup',
  'Hiburan',
  'Kesehatan',
  'Kebutuhan Pokok',
  'Tagihan',
  'Cicilan/Utang',
  'Pendidikan',
  'Lainnya',
];

export const SpendingTrendsChart: React.FC<SpendingTrendsChartProps> = ({
  transactions,
  isDarkMode,
}) => {
  const [chartType, setChartType] = useState<'bar' | 'area'>('bar');
  const [rangeMonths, setRangeMonths] = useState<number>(6);

  // Group transactions by month and category
  const historicalSpending = useMemo(() => {
    // Collect all unique months from transactions
    const monthsSet = new Set<string>();
    transactions.forEach((t) => {
      if (t.type === 'expense') {
        monthsSet.add(t.date.slice(0, 7));
      }
    });

    // Ensure we have at least the last few months sorted chronologically
    const sortedMonths = Array.from(monthsSet).sort();
    const slicedMonths = sortedMonths.slice(-rangeMonths);

    let prevTotal: number | null = null;

    return slicedMonths.map((monthKey) => {
      const monthTx = transactions.filter(
        (t) => t.type === 'expense' && t.date.slice(0, 7) === monthKey
      );

      const categoryTotals: Record<string, number> = {};
      ALL_CATEGORIES.forEach((cat) => {
        categoryTotals[cat] = 0;
      });

      let totalExpense = 0;
      monthTx.forEach((t) => {
        const cat = t.category as ExpenseCategory;
        if (categoryTotals[cat] !== undefined) {
          categoryTotals[cat] += t.amount;
        } else {
          categoryTotals['Lainnya'] = (categoryTotals['Lainnya'] || 0) + t.amount;
        }
        totalExpense += t.amount;
      });

      // MoM Change vs previous month
      let momPercent: number | null = null;
      let momDiff: number | null = null;
      if (prevTotal !== null && prevTotal > 0) {
        momDiff = totalExpense - prevTotal;
        momPercent = (momDiff / prevTotal) * 100;
      }
      prevTotal = totalExpense;

      // Find top spending category for this month
      let topCategory = 'Kebutuhan Pokok';
      let topAmount = 0;
      ALL_CATEGORIES.forEach((cat) => {
        if (categoryTotals[cat] > topAmount) {
          topAmount = categoryTotals[cat];
          topCategory = cat;
        }
      });

      return {
        monthKey,
        monthName: formatMonthYearIndo(monthKey),
        shortMonth: formatMonthYearIndo(monthKey).split(' ')[0].slice(0, 3),
        totalExpense,
        momPercent,
        momDiff,
        topCategory,
        topAmount,
        ...categoryTotals,
      };
    });
  }, [transactions, rangeMonths]);

  const latestMonthData = historicalSpending[historicalSpending.length - 1];
  const previousMonthData =
    historicalSpending.length > 1 ? historicalSpending[historicalSpending.length - 2] : null;

  const gridColor = isDarkMode ? '#1F2937' : '#F1F5F9';
  const axisColor = isDarkMode ? '#9CA3AF' : '#64748B';

  const CustomSpendingTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    const currentData = historicalSpending.find((d) => d.shortMonth === label || d.monthName === label);
    if (!currentData) return null;

    // Filter only categories with spending > 0 and sort descending
    const items = ALL_CATEGORIES.map((cat) => ({
      category: cat,
      amount: (currentData as any)[cat] || 0,
      config: CATEGORY_CONFIG[cat],
    }))
      .filter((i) => i.amount > 0)
      .sort((a, b) => b.amount - a.amount);

    return (
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 text-xs min-w-[240px] max-w-xs space-y-2.5 animate-in fade-in">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
          <span className="font-black text-sm text-slate-900 dark:text-white">
            {currentData.monthName}
          </span>
          {currentData.momPercent !== null && (
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                currentData.momPercent > 0
                  ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900'
                  : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900'
              }`}
            >
              {currentData.momPercent > 0 ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              <span>
                {currentData.momPercent > 0 ? '+' : ''}
                {currentData.momPercent.toFixed(1)}% MoM
              </span>
            </span>
          )}
        </div>

        <div className="flex items-center justify-between text-xs py-1 px-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
          <span className="text-slate-500 dark:text-slate-400 font-semibold">Total Pengeluaran</span>
          <span className="font-black text-slate-900 dark:text-white tabular-nums">
            {formatRupiah(currentData.totalExpense)}
          </span>
        </div>

        <div className="space-y-1.5 pt-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Rincian Kategori
          </div>
          {items.map((item) => {
            const share =
              currentData.totalExpense > 0
                ? (item.amount / currentData.totalExpense) * 100
                : 0;
            return (
              <div
                key={item.category}
                className="flex items-center justify-between text-[11px]"
              >
                <div className="flex items-center gap-1.5 truncate pr-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{
                      backgroundColor: isDarkMode
                        ? item.config.darkColor
                        : item.config.color,
                    }}
                  />
                  <span className="text-slate-600 dark:text-slate-300 truncate">
                    {item.category}
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-bold text-slate-900 dark:text-white tabular-nums mr-1">
                    {formatRupiah(item.amount)}
                  </span>
                  <span className="text-slate-400 text-[10px] tabular-nums">
                    ({share.toFixed(0)}%)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const hasData = historicalSpending.length > 0 && historicalSpending.some((d) => d.totalExpense > 0);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5 transition-smooth hover:border-slate-300 dark:hover:border-slate-700">
      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/50">
              Analisis Tren Pengeluaran
            </span>
            <span className="text-xs text-slate-400">Historical Spending</span>
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1 flex items-center gap-2">
            <span>Tren & Komposisi Pengeluaran Bulanan</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Perbandingan pengeluaran per kategori antar bulan serta fluktuasi Month-over-Month (MoM)
          </p>
        </div>

        {/* View Toggle & Filter Range Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Chart Type Toggle */}
          <div className="p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-1 text-xs font-bold">
            <button
              onClick={() => setChartType('bar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-smooth ${
                chartType === 'bar'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Stacked Bar</span>
            </button>
            <button
              onClick={() => setChartType('area')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-smooth ${
                chartType === 'area'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Stacked Area</span>
            </button>
          </div>

          {/* Month Range Pills */}
          <div className="p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-1 text-xs font-bold">
            {[3, 6, 12].map((m) => (
              <button
                key={m}
                onClick={() => setRangeMonths(m)}
                className={`px-2.5 py-1.5 rounded-lg transition-smooth ${
                  rangeMonths === m
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {m} Bulan
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Comparison Cards Strip */}
      {latestMonthData && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
          {/* Latest Month Total */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
              Pengeluaran Bulan Ini ({latestMonthData.shortMonth})
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tabular-nums">
                {formatRupiah(latestMonthData.totalExpense)}
              </span>
            </div>
          </div>

          {/* MoM Difference */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
              Perubahan vs Bulan Lalu
            </span>
            <div className="flex items-center gap-2 mt-1">
              {latestMonthData.momPercent !== null ? (
                <>
                  <span
                    className={`text-lg sm:text-xl font-black tabular-nums ${
                      latestMonthData.momPercent > 0
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    {latestMonthData.momPercent > 0 ? '+' : ''}
                    {latestMonthData.momPercent.toFixed(1)}%
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                    ({latestMonthData.momDiff! > 0 ? '+' : ''}
                    {formatRupiah(latestMonthData.momDiff!)})
                  </span>
                </>
              ) : (
                <span className="text-sm font-semibold text-slate-400">Periode awal</span>
              )}
            </div>
          </div>

          {/* Top Spending Category */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
              Pos Pengeluaran Terbesar
            </span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate">
                {latestMonthData.topCategory}
              </span>
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300 tabular-nums">
                {formatRupiah(latestMonthData.topAmount)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main Recharts Area */}
      {!hasData ? (
        <div className="h-64 flex flex-col items-center justify-center text-xs text-slate-400">
          <Calendar className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-2" />
          <span>Belum ada transaksi pengeluaran pada rentang waktu ini.</span>
        </div>
      ) : (
        <div className="h-72 sm:h-80 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'bar' ? (
              <BarChart
                data={historicalSpending}
                margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis
                  dataKey="shortMonth"
                  stroke={axisColor}
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: gridColor }}
                />
                <YAxis
                  stroke={axisColor}
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) =>
                    val >= 1000000
                      ? `${(val / 1000000).toFixed(0)}Jt`
                      : val >= 1000
                      ? `${(val / 1000).toFixed(0)}Rb`
                      : val
                  }
                />
                <Tooltip content={<CustomSpendingTooltip />} />
                {ALL_CATEGORIES.map((cat) => (
                  <Bar
                    key={cat}
                    dataKey={cat}
                    stackId="spending"
                    name={cat}
                    fill={isDarkMode ? CATEGORY_CONFIG[cat].darkColor : CATEGORY_CONFIG[cat].color}
                    radius={[0, 0, 0, 0]}
                  />
                ))}
              </BarChart>
            ) : (
              <AreaChart
                data={historicalSpending}
                margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis
                  dataKey="shortMonth"
                  stroke={axisColor}
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: gridColor }}
                />
                <YAxis
                  stroke={axisColor}
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) =>
                    val >= 1000000
                      ? `${(val / 1000000).toFixed(0)}Jt`
                      : val >= 1000
                      ? `${(val / 1000).toFixed(0)}Rb`
                      : val
                  }
                />
                <Tooltip content={<CustomSpendingTooltip />} />
                {ALL_CATEGORIES.map((cat) => (
                  <Area
                    key={cat}
                    type="monotone"
                    dataKey={cat}
                    stackId="spending"
                    name={cat}
                    fill={isDarkMode ? CATEGORY_CONFIG[cat].darkColor : CATEGORY_CONFIG[cat].color}
                    stroke={isDarkMode ? CATEGORY_CONFIG[cat].darkColor : CATEGORY_CONFIG[cat].color}
                    fillOpacity={0.65}
                  />
                ))}
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      )}

      {/* Category Legend Pill Badges */}
      <div className="flex flex-wrap items-center justify-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] font-semibold">
        {ALL_CATEGORIES.map((cat) => (
          <div
            key={cat}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800"
          >
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{
                backgroundColor: isDarkMode
                  ? CATEGORY_CONFIG[cat].darkColor
                  : CATEGORY_CONFIG[cat].color,
              }}
            />
            <span className="text-slate-700 dark:text-slate-300">{cat}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { MonthlyTrendItem, CategoryExpenseBreakdown } from '../utils/calculations';
import { formatRupiah, formatPercentage } from '../utils/formatters';

interface DashboardChartsProps {
  monthlyTrends: MonthlyTrendItem[];
  categoryExpenses: CategoryExpenseBreakdown[];
  isDarkMode: boolean;
}

// Skema warna visual kategori konsisten
const CATEGORY_COLORS = [
  '#10B981', // Emerald
  '#3B82F6', // Blue
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#64748B', // Slate
];

export const DashboardCharts: React.FC<DashboardChartsProps> = ({
  monthlyTrends,
  categoryExpenses,
  isDarkMode,
}) => {
  const gridColor = isDarkMode ? '#1F2937' : '#F1F5F9';
  const textColor = isDarkMode ? '#9CA3AF' : '#64748B';

  const incomeBarColor = isDarkMode ? '#34D399' : '#10B981';
  const expenseBarColor = isDarkMode ? '#F87171' : '#EF4444';
  const cumulativeStrokeColor = isDarkMode ? '#818CF8' : '#6366F1';

  const customTooltipStyle = {
    backgroundColor: isDarkMode ? '#111827' : '#FFFFFF',
    borderColor: isDarkMode ? '#374151' : '#E2E8F0',
    borderRadius: '1rem',
    boxShadow: '0 12px 24px -4px rgba(0, 0, 0, 0.15)',
    color: isDarkMode ? '#F9FAFB' : '#0F172A',
    fontSize: '12px',
    padding: '8px 12px',
  };

  const hasExpenses = categoryExpenses.some((c) => c.total > 0);

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* 1. Bar Chart: Tren Pemasukan vs Pengeluaran Bulanan (6 Kolom Desktop) */}
      <div className="col-span-12 lg:col-span-6 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-smooth hover:shadow-md flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base">
            Tren Pemasukan vs Pengeluaran
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Komparasi arus masuk dan beban pengeluaran per bulan
          </p>
        </div>

        <div className="h-72 w-full mt-4">
          {monthlyTrends.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              Belum ada data tren bulanan
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyTrends}
                margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="monthLabel" stroke={textColor} fontSize={12} tickLine={false} />
                <YAxis
                  stroke={textColor}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `Rp ${(val / 1000000).toFixed(0)}jt`}
                />
                <Tooltip
                  contentStyle={customTooltipStyle}
                  formatter={(val: any) => [formatRupiah(Number(val) || 0)]}
                />
                <Legend
                  wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                  iconType="circle"
                />
                <Bar
                  dataKey="income"
                  name="Pemasukan"
                  fill={incomeBarColor}
                  radius={[6, 6, 0, 0]}
                  maxBarSize={36}
                  animationDuration={800}
                />
                <Bar
                  dataKey="expense"
                  name="Pengeluaran"
                  fill={expenseBarColor}
                  radius={[6, 6, 0, 0]}
                  maxBarSize={36}
                  animationDuration={800}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 2. Area Chart: Arus Kas Bersih Kumulatif (6 Kolom Desktop) */}
      <div className="col-span-12 lg:col-span-6 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-smooth hover:shadow-md flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base">
            Arus Kas Bersih Kumulatif
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Akumulasi pertumbuhan saldo sisa kas dari waktu ke waktu
          </p>
        </div>

        <div className="h-72 w-full mt-4">
          {monthlyTrends.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              Belum ada data kumulatif
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={monthlyTrends}
                margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="colorCumulativeNet" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={cumulativeStrokeColor} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={cumulativeStrokeColor} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="monthLabel" stroke={textColor} fontSize={12} tickLine={false} />
                <YAxis
                  stroke={textColor}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `Rp ${(val / 1000000).toFixed(0)}jt`}
                />
                <Tooltip
                  contentStyle={customTooltipStyle}
                  formatter={(val: any) => [formatRupiah(Number(val) || 0), 'Saldo Kumulatif']}
                />
                <Area
                  type="monotone"
                  dataKey="cumulativeNet"
                  name="Arus Kas Kumulatif"
                  stroke={cumulativeStrokeColor}
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorCumulativeNet)"
                  animationDuration={900}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 3. Donut Chart: Komposisi Pengeluaran per Kategori (12 Kolom Penuh) */}
      <div className="col-span-12 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-smooth hover:shadow-md">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base">
            Komposisi Pengeluaran per Kategori
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Distribusi alokasi dana belanja dan evaluasi terhadap batas anggaran
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center mt-4">
          {/* Donut Chart Visual */}
          <div className="md:col-span-5 h-64 w-full">
            {!hasExpenses ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Belum ada transaksi pengeluaran
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    contentStyle={customTooltipStyle}
                    formatter={(val: any, name: any) => [
                      formatRupiah(Number(val) || 0),
                      name,
                    ]}
                  />
                  <Pie
                    data={categoryExpenses.filter((c) => c.total > 0)}
                    dataKey="total"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={3}
                    animationDuration={800}
                  >
                    {categoryExpenses
                      .filter((c) => c.total > 0)
                      .map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                        />
                      ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Breakdown List with Budget Progress */}
          <div className="md:col-span-7 space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {categoryExpenses.map((cat, idx) => {
              const color = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
              const isOverbudget = cat.budget > 0 && cat.total > cat.budget;
              const isWarningBudget =
                cat.budget > 0 && !isOverbudget && cat.total > cat.budget * 0.8;

              return (
                <div
                  key={cat.category}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 transition-smooth hover:bg-slate-100/70 dark:hover:bg-slate-800/80"
                >
                  <div className="flex items-center justify-between text-xs font-semibold mb-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-slate-800 dark:text-slate-200">
                        {cat.category}
                      </span>
                      {isOverbudget && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-500 text-white font-bold">
                          Overbudget
                        </span>
                      )}
                      {isWarningBudget && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500 text-white font-bold">
                          &gt;80%
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-slate-900 dark:text-white font-bold tabular-nums">
                        {formatRupiah(cat.total)}
                      </span>{' '}
                      <span className="text-slate-400 font-normal tabular-nums">
                        ({formatPercentage(cat.percentage)})
                      </span>
                    </div>
                  </div>

                  {/* Budget bar if configured */}
                  {cat.budget > 0 && (
                    <div className="space-y-1 mt-1">
                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isOverbudget
                              ? 'bg-rose-500'
                              : isWarningBudget
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{
                            width: `${Math.min(100, cat.budgetUsagePercent)}%`,
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 tabular-nums">
                        <span>Anggaran: {formatRupiah(cat.budget)}</span>
                        <span>Terpakai {formatPercentage(cat.budgetUsagePercent)}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

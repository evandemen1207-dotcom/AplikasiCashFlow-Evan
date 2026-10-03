import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ShieldCheck,
  Building,
  Coins,
} from 'lucide-react';
import { NetWorthSummary } from '../types';
import { formatRupiah, formatPercentage } from '../utils/formatters';

interface NetWorthAreaChartProps {
  netWorthData: NetWorthSummary;
  isDarkMode: boolean;
}

export const NetWorthAreaChart: React.FC<NetWorthAreaChartProps> = ({
  netWorthData,
  isDarkMode,
}) => {
  const {
    currentNetWorth,
    differenceNominal,
    differencePercentage,
    isPositive,
    history,
  } = netWorthData;

  const gridColor = isDarkMode ? '#1F2937' : '#F1F5F9';
  const axisColor = isDarkMode ? '#9CA3AF' : '#64748B';

  const customTooltipStyle = {
    backgroundColor: isDarkMode ? '#111827' : '#FFFFFF',
    borderColor: isDarkMode ? '#374151' : '#E2E8F0',
    borderRadius: '1rem',
    boxShadow: '0 12px 24px -4px rgba(0, 0, 0, 0.15)',
    color: isDarkMode ? '#F9FAFB' : '#0F172A',
    fontSize: '12px',
    padding: '10px 14px',
  };

  const latestHistory = history.length > 0 ? history[history.length - 1] : null;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-smooth hover:shadow-md">
      {/* Header Stat & Comparison */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 rounded-full border border-indigo-200/50 dark:border-indigo-800/50">
              Kekayaan Bersih
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Kas + Portofolio Investasi – Beban Utang
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
            Perkembangan Nilai Bersih
          </h3>
        </div>

        {/* Current Net Worth & MoM Delta Indicator */}
        <div className="flex items-baseline md:items-end flex-col">
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
            {formatRupiah(currentNetWorth)}
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <span
              className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full tabular-nums ${
                isPositive
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/50'
                  : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/50'
              }`}
            >
              {isPositive ? (
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              )}
              <span>
                {isPositive ? '+' : ''}
                {formatRupiah(differenceNominal)} ({isPositive ? '+' : ''}
                {formatPercentage(differencePercentage)})
              </span>
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              dibanding bulan lalu
            </span>
          </div>
        </div>
      </div>

      {/* Snapshot Sub-badges */}
      {latestHistory && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-4">
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
            <div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                Akumulasi Kas/Tabungan
              </span>
              <span className="text-xs font-bold text-slate-900 dark:text-white tabular-nums">
                {formatRupiah(latestHistory.cashSavings)}
              </span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
            <div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                Akumulasi Aset Investasi
              </span>
              <span className="text-xs font-bold text-slate-900 dark:text-white tabular-nums">
                {formatRupiah(latestHistory.investmentAssets)}
              </span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 col-span-2 sm:col-span-1 flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0" />
            <div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                Total Nilai Bersih
              </span>
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                {formatRupiah(latestHistory.netWorth)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Chart Area */}
      <div className="h-80 w-full mt-2">
        {history.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
            <Wallet className="w-10 h-10 text-slate-400 mb-2" />
            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
              Belum Ada Data Perkembangan Nilai Bersih
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1">
              Catat transaksi pemasukan, pengeluaran, atau kontribusi investasi untuk melihat grafik pertumbuhan aset dan kekayaan bersih Anda dari bulan ke bulan.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={history}
              margin={{ top: 15, right: 15, left: 15, bottom: 5 }}
            >
              <defs>
                {/* Gradient for Cash / Savings */}
                <linearGradient id="colorCashSavings" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.02} />
                </linearGradient>

                {/* Gradient for Investment Assets */}
                <linearGradient id="colorInvestAssets" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.02} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />

              <XAxis
                dataKey="monthLabel"
                stroke={axisColor}
                fontSize={12}
                tickLine={false}
              />

              <YAxis
                stroke={axisColor}
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `Rp ${(val / 1000000).toFixed(0)}jt`}
              />

              <Tooltip
                contentStyle={customTooltipStyle}
                formatter={(val: any, name: any) => [
                  formatRupiah(Number(val) || 0),
                  name,
                ]}
              />

              <Legend
                wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }}
                iconType="circle"
              />

              {/* Stacked Area 1: Kas / Tabungan */}
              <Area
                type="monotone"
                dataKey="cashSavings"
                name="Kas & Tabungan"
                stackId="1"
                stroke="#10B981"
                strokeWidth={2}
                fill="url(#colorCashSavings)"
                animationDuration={900}
              />

              {/* Stacked Area 2: Aset Investasi */}
              <Area
                type="monotone"
                dataKey="investmentAssets"
                name="Aset Investasi"
                stackId="1"
                stroke="#3B82F6"
                strokeWidth={2}
                fill="url(#colorInvestAssets)"
                animationDuration={900}
              />

              {/* Total Net Worth Line */}
              <Line
                type="monotone"
                dataKey="netWorth"
                name="Total Nilai Bersih"
                stroke="#6366F1"
                strokeWidth={3}
                dot={{ r: 4, fill: '#6366F1', strokeWidth: 2, stroke: '#FFFFFF' }}
                activeDot={{ r: 6, fill: '#4F46E5', stroke: '#EEF2FF', strokeWidth: 2 }}
                animationDuration={1100}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

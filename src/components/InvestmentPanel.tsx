import React, { useState } from 'react';
import {
  TrendingUp,
  Shield,
  PieChart as PieIcon,
  Calculator,
  Compass,
  AlertCircle,
  Clock,
  Sparkles,
  Percent,
  CheckCircle,
  HelpCircle,
  Flame,
} from 'lucide-react';
import {
  CashFlowSummary,
  InvestmentCapacityResult,
  Rule50_30_20Analysis,
  EmergencyFundStatus,
  getAssetAllocationByRiskProfile,
  calculateFireProjection,
} from '../utils/calculations';
import { UserSettings, RiskProfile } from '../types';
import { formatRupiah, formatPercentage } from '../utils/formatters';

interface InvestmentPanelProps {
  summary: CashFlowSummary;
  capacity: InvestmentCapacityResult;
  rule50_30_20: Rule50_30_20Analysis;
  emergencyFundStatus: EmergencyFundStatus;
  settings: UserSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
}

export const InvestmentPanel: React.FC<InvestmentPanelProps> = ({
  summary,
  capacity,
  rule50_30_20,
  emergencyFundStatus,
  settings,
  onUpdateSettings,
}) => {
  // Local state for interactive FIRE simulation controls
  const [interactiveReturn, setInteractiveReturn] = useState<number>(
    settings.annualExpectedReturn || 8
  );
  const [interactiveInflation, setInteractiveInflation] = useState<number>(
    settings.annualInflation || 4
  );
  const [interactiveProfile, setInteractiveProfile] = useState<RiskProfile>(
    settings.riskProfile || 'moderat'
  );

  // Perhitungan Proyeksi FIRE
  const fireResult = calculateFireProjection(
    summary.avgMonthlyExpense,
    capacity.investmentCapacity > 0
      ? capacity.investmentCapacity
      : settings.monthlyInvestmentTarget,
    settings.currentPortfolioValue,
    interactiveReturn,
    interactiveInflation
  );

  // Alokasi aset berdasarkan profil risiko terpilih
  const assetAllocations = getAssetAllocationByRiskProfile(
    interactiveProfile,
    capacity.investmentCapacity > 0
      ? capacity.investmentCapacity
      : settings.monthlyInvestmentTarget
  );

  const handleProfileChange = (profile: RiskProfile) => {
    setInteractiveProfile(profile);
    onUpdateSettings({ riskProfile: profile });
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 rounded-2xl p-6 text-white shadow-lg shadow-teal-500/10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-amber-300" />
              <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full">
                Perencanaan & Alokasi Kekayaan
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black">
              Panel Rekomendasi Investasi & FIRE
            </h2>
            <p className="text-emerald-100 text-xs sm:text-sm mt-1 max-w-2xl">
              Optimalkan arus kas surplus Anda ke instrumen produktif untuk mencapai kemandirian finansial lebih cepat.
            </p>
          </div>

          {/* Quick Kapasitas Investasi Badge */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 text-right md:min-w-64">
            <span className="text-xs text-emerald-100 block">Kapasitas Investasi Bulanan</span>
            <span className="text-2xl font-black text-white">
              {formatRupiah(capacity.investmentCapacity)}
            </span>
            <span className="text-[11px] text-emerald-200 block mt-0.5">
              Setelah dipotong kebutuhan wajib & dana darurat
            </span>
          </div>
        </div>
      </div>

      {/* Grid: Kapasitas Investasi & Acuan 50/30/20 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Rumus & Bedah Kapasitas Investasi */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Kapasitas Investasi Riil
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Formula: Pemasukan – Pengeluaran Wajib – Alokasi Dana Darurat
              </p>
            </div>
          </div>

          <div className="space-y-3 text-xs sm:text-sm">
            <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-slate-600 dark:text-slate-400">Rata-rata Pemasukan Bulanan</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                +{formatRupiah(capacity.monthlyIncome)}
              </span>
            </div>

            <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-slate-600 dark:text-slate-400 block">Pengeluaran Wajib</span>
                <span className="text-[10px] text-slate-400">Kebutuhan Pokok, Tagihan, Cicilan</span>
              </div>
              <span className="font-bold text-rose-500">
                -{formatRupiah(capacity.mandatoryExpenses)}
              </span>
            </div>

            <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-slate-600 dark:text-slate-400 block">Pengeluaran Fleksibel (Gaya Hidup)</span>
                <span className="text-[10px] text-slate-400">Hiburan, Transportasi non-rutin, Lainnya</span>
              </div>
              <span className="font-bold text-slate-700 dark:text-slate-300">
                -{formatRupiah(capacity.discretionaryExpenses)}
              </span>
            </div>

            <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-slate-600 dark:text-slate-400 block">Target Cadangan Dana Darurat</span>
                <span className="text-[10px] text-slate-400">Alokasi bulanan percepatan safety net</span>
              </div>
              <span className="font-bold text-amber-600 dark:text-amber-400">
                -{formatRupiah(capacity.emergencyFundMonthlyContribution)}
              </span>
            </div>

            <div className="flex justify-between items-center p-3.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-sm">
              <span className="font-bold text-emerald-900 dark:text-emerald-200">
                Sisa Siap Investasi / Bulan
              </span>
              <span className="font-black text-emerald-600 dark:text-emerald-400 text-base">
                {formatRupiah(capacity.investmentCapacity)}
              </span>
            </div>
          </div>
        </div>

        {/* 2. Acuan Aturan 50/30/20 vs Realisasi */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <PieIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Realisasi Acuan 50/30/20
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                50% Kebutuhan Pokok, 30% Keinginan, 20% Tabungan & Investasi
              </p>
            </div>
          </div>

          <div className="space-y-4 pt-1">
            {/* Kebutuhan (Needs) 50% */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Kebutuhan (Target: Maks 50%)
                </span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {formatPercentage(rule50_30_20.needsPercent)} ({formatRupiah(rule50_30_20.needsActual)})
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    rule50_30_20.needsPercent > 50 ? 'bg-amber-500' : 'bg-blue-600'
                  }`}
                  style={{ width: `${Math.min(100, rule50_30_20.needsPercent)}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Target ideal: {formatRupiah(rule50_30_20.needsTarget)}
              </p>
            </div>

            {/* Keinginan (Wants) 30% */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Keinginan (Target: Maks 30%)
                </span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {formatPercentage(rule50_30_20.wantsPercent)} ({formatRupiah(rule50_30_20.wantsActual)})
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    rule50_30_20.wantsPercent > 30 ? 'bg-rose-500' : 'bg-teal-500'
                  }`}
                  style={{ width: `${Math.min(100, rule50_30_20.wantsPercent)}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Target ideal: {formatRupiah(rule50_30_20.wantsTarget)}
              </p>
            </div>

            {/* Tabungan & Investasi (Savings) 20% */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Tabungan & Investasi (Target: Min 20%)
                </span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {formatPercentage(rule50_30_20.savingsPercent)} ({formatRupiah(rule50_30_20.savingsActual)})
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    rule50_30_20.savingsPercent >= 20 ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                  style={{ width: `${Math.min(100, rule50_30_20.savingsPercent)}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Target ideal: {formatRupiah(rule50_30_20.savingsTarget)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Target & Progres Dana Darurat */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Target Dana Darurat ({settings.emergencyFundMonthsTarget}x Pengeluaran Bulanan)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Bantalan keamanan finansial sebelum berinvestasi risiko tinggi
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-500 dark:text-slate-400 block">Terkumpul Saat Ini</span>
            <span className="font-bold text-base text-slate-900 dark:text-white">
              {formatRupiah(emergencyFundStatus.currentFund)}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-slate-600 dark:text-slate-400">
              Progres Terkumpul: {emergencyFundStatus.fundedMonths.toFixed(1)} dari {emergencyFundStatus.targetMonths} Bulan Pengeluaran
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
              {emergencyFundStatus.progressPercent.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, emergencyFundStatus.progressPercent)}%` }}
            />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-1 pt-1">
            <span>
              Target Total: <strong>{formatRupiah(emergencyFundStatus.targetFundAmount)}</strong> (berdasarkan pengeluaran {formatRupiah(emergencyFundStatus.avgMonthlyExpense)}/bln)
            </span>
            {emergencyFundStatus.deficit > 0 ? (
              <span className="text-amber-600 dark:text-amber-400 font-medium">
                Defisit: {formatRupiah(emergencyFundStatus.deficit)} (Estimasi tercapai ~{emergencyFundStatus.estimatedMonthsToTarget} bulan lagi)
              </span>
            ) : (
              <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> Target Dana Darurat Tercapai Penuh!
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 4. Alokasi Investasi Menurut Profil Risiko */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Rekomendasi Alokasi Aset Investasi
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pilih profil risiko untuk melihat komposisi diversifikasi instrumen yang tepat
              </p>
            </div>
          </div>

          {/* Interactive Profile Switcher */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            {(['konservatif', 'moderat', 'agresif'] as RiskProfile[]).map((prof) => (
              <button
                key={prof}
                onClick={() => handleProfileChange(prof)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition ${
                  interactiveProfile === prof
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {prof}
              </button>
            ))}
          </div>
        </div>

        {/* Allocation Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
          {assetAllocations.map((item) => (
            <div
              key={item.assetClass}
              className="p-4 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs font-black px-2 py-0.5 rounded-full bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-600">
                  {item.percentage}%
                </span>
              </div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                {item.assetClass}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {item.description}
              </p>
              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                <span className="text-[10px] text-slate-400 block">Rekomendasi Setoran:</span>
                <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                  {formatRupiah(item.recommendedAmount)} /bln
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Proyeksi Kemandirian Finansial (FIRE: 25x Pengeluaran Tahunan) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Proyeksi Kemandirian Finansial (FIRE Calculator)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Target = 25x Pengeluaran Tahunan (Safe Withdrawal Rate 4% Rule)
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-500 dark:text-slate-400 block">Angka Target FIRE Bebas Finansial</span>
            <span className="text-xl font-black text-rose-600 dark:text-rose-400">
              {formatRupiah(fireResult.fireTargetNumber)}
            </span>
          </div>
        </div>

        {/* Interactive Sliders for Assumptions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 text-xs">
          <div>
            <div className="flex justify-between mb-1.5 font-semibold text-slate-700 dark:text-slate-300">
              <span>Asumsi Return Investasi Tahunan:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                {interactiveReturn}% / tahun
              </span>
            </div>
            <input
              type="range"
              min="3"
              max="18"
              step="0.5"
              value={interactiveReturn}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setInteractiveReturn(val);
                onUpdateSettings({ annualExpectedReturn: val });
              }}
              className="w-full accent-emerald-600 cursor-pointer"
            />
            <span className="text-[10px] text-slate-400">
              Contoh: Reksadana Saham/SBN historis rata-rata 7% - 11%
            </span>
          </div>

          <div>
            <div className="flex justify-between mb-1.5 font-semibold text-slate-700 dark:text-slate-300">
              <span>Asumsi Inflasi Tahunan:</span>
              <span className="text-amber-600 dark:text-amber-400 font-bold">
                {interactiveInflation}% / tahun
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              step="0.5"
              value={interactiveInflation}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setInteractiveInflation(val);
                onUpdateSettings({ annualInflation: val });
              }}
              className="w-full accent-amber-600 cursor-pointer"
            />
            <span className="text-[10px] text-slate-400">
              Rata-rata inflasi riil Indonesia jangka panjang 3% - 5%
            </span>
          </div>
        </div>

        {/* Hasil Estimasi Tahun Tercapai */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-indigo-950/40 border border-blue-200 dark:border-indigo-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-blue-700 dark:text-blue-300 font-bold">
              <Clock className="w-4 h-4" />
              <span>ESTIMASI WAKTU TERCAPAI KEMANDIRIAN FINANSIAL</span>
            </div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1">
              Dengan investasi berkala{' '}
              <strong className="text-emerald-600 dark:text-emerald-400">
                {formatRupiah(
                  capacity.investmentCapacity > 0
                    ? capacity.investmentCapacity
                    : settings.monthlyInvestmentTarget
                )}
                /bulan
              </strong>{' '}
              dan saldo awal {formatRupiah(settings.currentPortfolioValue)}.
            </p>
          </div>

          <div className="text-right">
            <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400">
              {fireResult.yearsToFire !== null ? `${fireResult.yearsToFire} Tahun` : '> 30 Tahun'}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 block mt-0.5">
              (Disesuaikan daya beli inflasi)
            </span>
          </div>
        </div>

        {/* Milestone Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Tahun Ke</th>
                <th className="py-2.5 px-3">Portofolio Nominal</th>
                <th className="py-2.5 px-3">Nilai Riil (Riil Bersih Inflasi)</th>
                <th className="py-2.5 px-3">Estimasi Passive Income (4%/thn)</th>
                <th className="py-2.5 px-3">Status Target FIRE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {fireResult.projectedTimeline
                .filter((p) => [0, 5, 10, 15, 20, 25, 30].includes(p.year) || p.year === fireResult.yearsToFire)
                .sort((a, b) => a.year - b.year)
                .map((item) => {
                  const isAchieved = item.realPortfolio >= fireResult.fireTargetNumber;
                  return (
                    <tr
                      key={item.year}
                      className={
                        item.year === fireResult.yearsToFire
                          ? 'bg-emerald-50/80 dark:bg-emerald-950/40 font-bold'
                          : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/30'
                      }
                    >
                      <td className="py-2 px-3">
                        {item.year === 0 ? 'Sekarang' : `Tahun ${item.year}`}
                        {item.year === fireResult.yearsToFire && (
                          <span className="ml-1.5 text-[10px] bg-emerald-600 text-white px-1.5 py-0.2 rounded font-bold">
                            FIRE Tercapai!
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3">{formatRupiah(item.nominalPortfolio)}</td>
                      <td className="py-2 px-3 text-slate-900 dark:text-white font-medium">
                        {formatRupiah(item.realPortfolio)}
                      </td>
                      <td className="py-2 px-3 text-emerald-600 dark:text-emerald-400 font-medium">
                        {formatRupiah(item.passiveIncomeAnnual / 12)} /bln
                      </td>
                      <td className="py-2 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            isAchieved
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          {isAchieved ? 'Mencapai Kebebasan Finansial' : `${((item.realPortfolio / fireResult.fireTargetNumber) * 100).toFixed(0)}% Target`}
                        </span>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Asumsi & Edukasi Disclaimer */}
      <div className="p-4 rounded-xl bg-slate-100/70 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-start gap-3">
        <HelpCircle className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-slate-700 dark:text-slate-300">
            Catatan Edukasi & Asumsi Perhitungan:
          </p>
          <p>
            Simulasi di atas mengasumsikan return compounding tahunan sebesar {interactiveReturn}% dengan tingkat inflasi {interactiveInflation}% per tahun, dan penarikan aman 4% tahunan (The 4% Rule). Seluruh proyeksi dan rekomendasi disajikan secara otomatis untuk tujuan <strong>edukasi dan perencanaan mandiri</strong>, bukan merupakan nasihat investasi resmi berlisensi OJK. Sesuaikan selalu dengan situasi dan profil risiko Anda secara bijak.
          </p>
        </div>
      </div>
    </div>
  );
};

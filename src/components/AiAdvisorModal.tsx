import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  X,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Target,
  FileText,
  ListOrdered,
  Shield,
  Coins,
  ArrowRight,
  Info,
  Calendar,
  AlertCircle,
  PlusCircle,
} from 'lucide-react';
import { Transaction } from '../types';
import {
  FinancialSummary,
  StrategicRecommendation,
  buildFinancialSummary,
  getAdvisorRecommendation,
  AiAdvisorInput,
  AiFinancialReport,
} from '../services/aiAdvisor';
import { formatRupiah, formatPercentage, formatMonthYearIndo } from '../utils/formatters';

interface AiAdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions?: Transaction[];
  advisorInput?: AiAdvisorInput;
  userId?: string | null;
  savedReport?: AiFinancialReport | null;
  onReportGenerated?: (report: AiFinancialReport) => void;
  onOpenAddModal?: () => void;
}

export const AiAdvisorModal: React.FC<AiAdvisorModalProps> = ({
  isOpen,
  onClose,
  transactions: propTransactions,
  advisorInput,
  onOpenAddModal,
}) => {
  // Ambil transaksi dari props atau dari advisorInput
  const transactions = useMemo(() => {
    return propTransactions || advisorInput?.transactions || [];
  }, [propTransactions, advisorInput?.transactions]);

  // 1. Kalkulasi murni Financial Summary di kode
  const summary: FinancialSummary = useMemo(() => {
    return buildFinancialSummary(transactions);
  }, [transactions]);

  const [recommendation, setRecommendation] = useState<StrategicRecommendation | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Ambil rekomendasi strategis
  const handleFetchRecommendation = async (forceRefresh: boolean = false) => {
    if (summary.jumlahTransaksi < 5) return;

    setIsLoading(true);
    setError(null);
    try {
      const result = await getAdvisorRecommendation(summary, forceRefresh);
      setRecommendation(result);
    } catch (err: any) {
      console.error('Failed to get advisor recommendation:', err);
      setError('Gagal memuat rekomendasi AI. Silakan periksa koneksi atau coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  // Muat rekomendasi saat modal pertama kali dibuka (jika belum ada dan data cukup)
  useEffect(() => {
    if (isOpen && !recommendation && summary.jumlahTransaksi >= 5 && !isLoading) {
      handleFetchRecommendation(false);
    }
  }, [isOpen, summary.jumlahTransaksi]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-3xl max-h-[92vh] flex flex-col bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="relative px-6 py-5 bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-amber-300 shadow-inner">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-lg sm:text-xl tracking-tight">
                  AI Advisor Strategis
                </h3>
                <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
                  Gemini
                </span>
              </div>
              <p className="text-xs text-indigo-100 mt-0.5">
                Rekomendasi Keuangan Terarah Berdasarkan Data Finansial Evan
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {summary.jumlahTransaksi >= 5 && (
              <button
                onClick={() => handleFetchRecommendation(true)}
                disabled={isLoading}
                title="Perbarui Saran"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-white/15 hover:bg-white/25 rounded-xl transition-smooth disabled:opacity-50 text-white"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Perbarui Saran</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-smooth"
              aria-label="Tutup modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* KASUS 1: Data < 5 Transaksi */}
          {summary.jumlahTransaksi < 5 ? (
            <div className="py-12 px-4 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/80 flex items-center justify-center text-amber-500 shadow-inner">
                <Coins className="w-8 h-8" />
              </div>
              <div className="max-w-md space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300">
                  Data Belum Memadai
                </span>
                <h4 className="font-black text-lg text-slate-900 dark:text-white">
                  Perlu Minimal 5 Transaksi
                </h4>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Saat ini baru tercatat{' '}
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {summary.jumlahTransaksi} transaksi
                  </span>
                  . AI Advisor membutuhkan minimal 5 transaksi untuk mengenali pola arus kas dan memberikan rekomendasi strategis yang akurat.
                </p>
              </div>
              {onOpenAddModal && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenAddModal();
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white text-xs sm:text-sm font-bold shadow-md shadow-indigo-600/20 transition-smooth mt-2"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Catat Transaksi Sekarang</span>
                </button>
              )}
            </div>
          ) : isLoading ? (
            /* KASUS 2: Loading State (Skeleton) */
            <div className="space-y-4 py-2">
              <div className="h-16 bg-slate-100 dark:bg-slate-800/60 rounded-2xl animate-pulse" />
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-xl bg-slate-200 dark:bg-slate-700 animate-pulse" />
                  <div className="h-4 w-36 bg-slate-200 dark:bg-slate-700 rounded-md animate-pulse" />
                </div>
                <div className="h-3 w-full bg-slate-200 dark:bg-slate-700 rounded-md animate-pulse" />
                <div className="h-3 w-4/5 bg-slate-200 dark:bg-slate-700 rounded-md animate-pulse" />
              </div>
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-xl bg-slate-200 dark:bg-slate-700 animate-pulse" />
                  <div className="h-4 w-44 bg-slate-200 dark:bg-slate-700 rounded-md animate-pulse" />
                </div>
                <div className="space-y-2 pt-1">
                  <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
                  <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
                  <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
                </div>
              </div>
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-xl bg-slate-200 dark:bg-slate-700 animate-pulse" />
                  <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded-md animate-pulse" />
                </div>
                <div className="h-3 w-full bg-slate-200 dark:bg-slate-700 rounded-md animate-pulse" />
                <div className="h-3 w-3/4 bg-slate-200 dark:bg-slate-700 rounded-md animate-pulse" />
              </div>
            </div>
          ) : error ? (
            /* KASUS 3: Error State */
            <div className="py-12 px-4 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 flex items-center justify-center text-rose-500">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="max-w-md space-y-1">
                <h4 className="font-bold text-base text-slate-900 dark:text-white">
                  Gagal Memuat Rekomendasi
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {error}
                </p>
              </div>
              <button
                onClick={() => handleFetchRecommendation(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-smooth mt-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Coba Lagi</span>
              </button>
            </div>
          ) : recommendation ? (
            /* KASUS 4: Tiga Kartu Bernomor Sesuai Spesifikasi */
            <div className="space-y-4">
              {/* Ringkasan Parameter Finansial Bulan Berjalan */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Bulan Evaluasi:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {formatMonthYearIndo(summary.currentMonthKey)}
                    </span>
                  </div>
                  {recommendation.isFallback && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      Mode Analisis Aturan (Deterministic)
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                    <span className="text-[10px] font-semibold text-slate-400 block uppercase">
                      Pemasukan
                    </span>
                    <span className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {formatRupiah(summary.totalPemasukan)}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                    <span className="text-[10px] font-semibold text-slate-400 block uppercase">
                      Pengeluaran
                    </span>
                    <span className="text-xs sm:text-sm font-black text-rose-600 dark:text-rose-400 tabular-nums">
                      {formatRupiah(summary.totalPengeluaran)}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                    <span className="text-[10px] font-semibold text-slate-400 block uppercase">
                      Rasio Beban
                    </span>
                    <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white tabular-nums">
                      {formatPercentage(summary.rasioPengeluaran * 100)}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                    <span className="text-[10px] font-semibold text-slate-400 block uppercase">
                      Saving Rate
                    </span>
                    <span
                      className={`text-xs sm:text-sm font-black tabular-nums ${
                        summary.savingRate >= 0.2
                          ? 'text-indigo-600 dark:text-indigo-400'
                          : 'text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {formatPercentage(summary.savingRate * 100)}
                    </span>
                  </div>
                </div>
              </div>

              {/* KARTU 1: Analisis Ringkas */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3 transition-smooth hover:border-indigo-200 dark:hover:border-indigo-900">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center font-black text-sm shrink-0">
                    1
                  </div>
                  <div>
                    <h4 className="font-black text-sm sm:text-base text-slate-900 dark:text-white leading-tight">
                      Analisis Ringkas
                    </h4>
                    <span className="text-[11px] text-slate-400">
                      Diagnosis pola arus kas & konsentrasi pengeluaran
                    </span>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-medium bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
                  {recommendation.analisis}
                </p>

                {/* 3 Kategori Pengeluaran Terbesar */}
                {summary.topKategori.length > 0 && (
                  <div className="pt-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                      3 Pos Pengeluaran Terbesar Bulan Ini:
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {summary.topKategori.map((cat, idx) => (
                        <div
                          key={cat.nama}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs"
                        >
                          <div className="truncate pr-1">
                            <span className="text-[10px] font-bold text-slate-400 mr-1.5">
                              #{idx + 1}
                            </span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                              {cat.nama}
                            </span>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="font-black text-slate-900 dark:text-white tabular-nums">
                              {formatRupiah(cat.nominal)}
                            </div>
                            <div className="text-[10px] text-slate-400 tabular-nums">
                              {cat.persen.toFixed(0)}% total
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* KARTU 2: Tindakan Strategis */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3 transition-smooth hover:border-emerald-200 dark:hover:border-emerald-900">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center font-black text-sm shrink-0">
                    2
                  </div>
                  <div>
                    <h4 className="font-black text-sm sm:text-base text-slate-900 dark:text-white leading-tight">
                      Tindakan Strategis
                    </h4>
                    <span className="text-[11px] text-slate-400">
                      Langkah spesifik terurut prioritas (Dana Darurat &gt; Investasi)
                    </span>
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  {recommendation.tindakan.map((step, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800"
                    >
                      <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <div className="flex-1">
                        <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                          {step}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* KARTU 3: Target 1-3 Bulan */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3 transition-smooth hover:border-blue-200 dark:hover:border-blue-900">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 flex items-center justify-center font-black text-sm shrink-0">
                    3
                  </div>
                  <div>
                    <h4 className="font-black text-sm sm:text-base text-slate-900 dark:text-white leading-tight">
                      Target 1–3 Bulan
                    </h4>
                    <span className="text-[11px] text-slate-400">
                      Dampak konkret terukur yang dapat diwujudkan
                    </span>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-medium bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
                  {recommendation.target}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <div className="p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 flex items-center justify-between text-xs">
                    <span className="text-slate-600 dark:text-slate-400">Surplus Kas Bulanan:</span>
                    <span className="font-black text-blue-600 dark:text-blue-400 tabular-nums">
                      {formatRupiah(summary.selisih)}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 flex items-center justify-between text-xs">
                    <span className="text-slate-600 dark:text-slate-400">Bantalan Dana Darurat:</span>
                    <span className="font-black text-blue-600 dark:text-blue-400 tabular-nums">
                      {summary.bulanDanaDarurat.toFixed(1)} Bulan
                    </span>
                  </div>
                </div>
              </div>

              {/* Catatan Edukatif Wajib */}
              <div className="flex items-center justify-center gap-2 py-2 text-center">
                <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  Saran bersifat edukatif, bukan nasihat investasi profesional.
                </p>
              </div>
            </div>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:px-6 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-xl transition-smooth"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Info,
  ShieldCheck,
  ShieldAlert,
  Zap,
  Activity,
  Layers,
} from 'lucide-react';
import { Transaction, UserSettings, EwsAlert, EwsSeverity, FilterPeriod } from '../types';
import {
  RedesignedEwsResult,
  EwsIndicator,
  evaluateEWS,
} from '../utils/ews';
import { FinancialSummary, buildFinancialSummary } from '../services/aiAdvisor';
import { EwsBudgetBarChart } from './EwsBudgetBarChart';

interface EwsBannerProps {
  evaluation?: RedesignedEwsResult;
  transactions?: Transaction[];
  summary?: FinancialSummary;
  settings?: UserSettings;
  overallStatus?: EwsSeverity;
  statusBadgeText?: string;
  statusHeadline?: string;
  alerts?: EwsAlert[];
  dismissedAlertIds?: string[];
  onDismissAlert?: (id: string) => void;
  onRestoreDismissedAlerts?: () => void;
  period?: FilterPeriod;
  isDarkMode?: boolean;
}

export const EwsBanner: React.FC<EwsBannerProps> = ({
  evaluation: propEvaluation,
  transactions = [],
  summary: propSummary,
  settings,
  period = 'this_month',
  isDarkMode = false,
}) => {
  // Toggle detail peringatan (default: tersembunyi / false)
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);

  // Dapatkan hasil evaluasi EWS terpusat
  const evalResult: RedesignedEwsResult = useMemo(() => {
    if (propEvaluation) {
      return propEvaluation;
    }
    if (propSummary) {
      return evaluateEWS(propSummary);
    }
    if (transactions && transactions.length > 0) {
      const summary = buildFinancialSummary(transactions);
      return evaluateEWS(summary);
    }
    return evaluateEWS(buildFinancialSummary([]));
  }, [propEvaluation, propSummary, transactions]);

  const { status, ringkasan, daftarIndikator, penyebabUtama, saranCepat, detailPeringatan } =
    evalResult;

  // Style tokens berdasarkan status keseluruhan
  const getStatusStyles = () => {
    switch (status) {
      case 'BAHAYA':
        return {
          container:
            'bg-rose-50/70 dark:bg-rose-950/20 border-rose-200/90 dark:border-rose-900/60 shadow-xs',
          headerBorder: 'border-rose-200/60 dark:border-rose-900/40',
          badgeBg: 'bg-rose-600 text-white',
          badgeIcon: <AlertOctagon className="w-4 h-4 shrink-0 animate-pulse" />,
          cardBg: 'bg-white dark:bg-slate-900/90 border-rose-100 dark:border-rose-900/40',
          titleColor: 'text-rose-950 dark:text-rose-200',
          accentText: 'text-rose-600 dark:text-rose-400',
          riskLevel: 'Tinggi (Tindakan Segera Diperlukan)',
        };
      case 'WASPADA':
        return {
          container:
            'bg-amber-50/70 dark:bg-amber-950/20 border-amber-200/90 dark:border-amber-900/60 shadow-xs',
          headerBorder: 'border-amber-200/60 dark:border-amber-900/40',
          badgeBg: 'bg-amber-500 text-white',
          badgeIcon: <AlertTriangle className="w-4 h-4 shrink-0" />,
          cardBg: 'bg-white dark:bg-slate-900/90 border-amber-100 dark:border-amber-900/40',
          titleColor: 'text-amber-950 dark:text-amber-200',
          accentText: 'text-amber-600 dark:text-amber-400',
          riskLevel: 'Sedang (Perlu Pengawasan Ketat)',
        };
      case 'AMAN':
        return {
          container:
            'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200/90 dark:border-emerald-900/60 shadow-xs',
          headerBorder: 'border-emerald-200/60 dark:border-emerald-900/40',
          badgeBg: 'bg-emerald-600 text-white',
          badgeIcon: <CheckCircle2 className="w-4 h-4 shrink-0" />,
          cardBg: 'bg-white dark:bg-slate-900/90 border-emerald-100 dark:border-emerald-900/40',
          titleColor: 'text-emerald-950 dark:text-emerald-200',
          accentText: 'text-emerald-600 dark:text-emerald-400',
          riskLevel: 'Rendah (Pondasi Finansial Sehat)',
        };
      case 'Data belum cukup':
      default:
        return {
          container:
            'bg-slate-50/80 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800 shadow-xs',
          headerBorder: 'border-slate-200/60 dark:border-slate-800',
          badgeBg: 'bg-slate-600 text-white',
          badgeIcon: <Info className="w-4 h-4 shrink-0" />,
          cardBg: 'bg-white dark:bg-slate-900/90 border-slate-200/60 dark:border-slate-800',
          titleColor: 'text-slate-900 dark:text-slate-200',
          accentText: 'text-slate-600 dark:text-slate-400',
          riskLevel: 'Netral (Menunggu Data Transaksi)',
        };
    }
  };

  const getIndicatorStyles = (indStatus: EwsIndicator['status']) => {
    switch (indStatus) {
      case 'BAHAYA':
        return {
          barColor: 'bg-rose-500',
          badge:
            'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
          icon: <AlertOctagon className="w-3 h-3 text-rose-500" />,
        };
      case 'WASPADA':
        return {
          barColor: 'bg-amber-500',
          badge:
            'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
          icon: <AlertTriangle className="w-3 h-3 text-amber-500" />,
        };
      case 'AMAN':
        return {
          barColor: 'bg-emerald-500',
          badge:
            'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
          icon: <CheckCircle2 className="w-3 h-3 text-emerald-500" />,
        };
      case 'NETRAL':
      default:
        return {
          barColor: 'bg-slate-400 dark:bg-slate-600',
          badge:
            'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700',
          icon: <Info className="w-3 h-3 text-slate-400" />,
        };
    }
  };

  const style = getStatusStyles();

  return (
    <section
      aria-label="Sistem Peringatan Dini Keuangan (Early Warning System)"
      className={`rounded-2xl border transition-smooth overflow-hidden ${style.container}`}
    >
      {/* 1. Header Bar: Badge Status Besar + Ringkasan 1 Kalimat + Tombol Toggle */}
      <div
        className={`px-4 sm:px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b ${style.headerBorder}`}
      >
        <div className="flex items-center gap-3 min-w-0">
          {/* Badge Status Besar (Ikon + Teks) */}
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider shadow-xs shrink-0 ${style.badgeBg}`}
          >
            {style.badgeIcon}
            <span>{status}</span>
          </div>

          {/* Ringkasan 1 Kalimat */}
          <p
            className={`text-xs sm:text-sm font-semibold leading-relaxed truncate-2-lines ${style.titleColor}`}
          >
            {ringkasan}
          </p>
        </div>

        {/* Tombol Toggle "Lihat Detail / Sembunyikan Detail" */}
        <button
          type="button"
          onClick={() => setIsDetailOpen((prev) => !prev)}
          aria-expanded={isDetailOpen}
          aria-controls="ews-detail-panel"
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-smooth shrink-0 self-start sm:self-auto focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
        >
          <span>{isDetailOpen ? 'Sembunyikan Detail' : 'Lihat Detail'}</span>
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-200 ${
              isDetailOpen ? 'rotate-180' : ''
            }`}
          />
        </button>
      </div>

      {/* 2. Hanya 3 Poin Kunci di Kartu Utama */}
      <div className="p-4 sm:p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Poin 1: Status Risiko */}
          <div
            className={`p-3.5 rounded-xl border shadow-xs transition-smooth ${style.cardBg}`}
          >
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-1">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Status Risiko</span>
            </div>
            <div className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>{status}</span>
              <span className="text-xs font-normal text-slate-500 dark:text-slate-400">·</span>
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                {style.riskLevel}
              </span>
            </div>
          </div>

          {/* Poin 2: Penyebab Utama */}
          <div
            className={`p-3.5 rounded-xl border shadow-xs transition-smooth ${style.cardBg}`}
          >
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-1">
              <Activity className="w-3.5 h-3.5" />
              <span>Penyebab Utama</span>
            </div>
            <p className="text-xs sm:text-[13px] font-semibold text-slate-800 dark:text-slate-200 leading-snug">
              {penyebabUtama}
            </p>
          </div>

          {/* Poin 3: Saran Tindakan Cepat */}
          <div
            className={`p-3.5 rounded-xl border shadow-xs transition-smooth ${style.cardBg}`}
          >
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-1">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Saran Tindakan Cepat</span>
            </div>
            <p className="text-xs sm:text-[13px] font-semibold text-slate-800 dark:text-slate-200 leading-snug">
              {saranCepat}
            </p>
          </div>
        </div>

        {/* 3. Grid Indikator Responsif */}
        <div className="mt-4 pt-4 border-t border-slate-200/60 dark:border-slate-800">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" />
            <span>Indikator Pengukuran EWS</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {daftarIndikator.map((ind) => {
              const indStyle = getIndicatorStyles(ind.status);
              return (
                <div
                  key={ind.nama}
                  className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-2.5"
                >
                  {/* Baris Nama & Status Indikator */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {ind.nama}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black border tabular-nums ${indStyle.badge}`}
                    >
                      {indStyle.icon}
                      <span>{ind.status}</span>
                    </span>
                  </div>

                  {/* Nilai Indikator */}
                  <div className="text-lg font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
                    {ind.nilai}
                  </div>

                  {/* Progress Bar dengan Aksesibilitas aria-valuenow */}
                  <div className="space-y-1">
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        role="progressbar"
                        aria-valuenow={ind.persentase}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={ind.nama}
                        className={`h-full transition-all duration-500 rounded-full ${indStyle.barColor}`}
                        style={{ width: `${Math.min(100, Math.max(5, ind.persentase))}%` }}
                      />
                    </div>

                    {/* Ambang Batas */}
                    <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                      <span>Ambang:</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {ind.ambang}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. Panel Detail Peringatan (Toggleable dengan animasi mulus) */}
        {isDetailOpen && (
          <div
            id="ews-detail-panel"
            className="mt-4 pt-4 border-t border-slate-200/60 dark:border-slate-800 animate-in fade-in slide-in-from-top-2 duration-200"
          >
            <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2">
              <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-indigo-500" />
                <span>Rincian Evaluasi Risiko:</span>
              </h5>
              <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                {detailPeringatan.map((baris, idx) => (
                  <li key={idx} className="flex items-start gap-2 leading-relaxed">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
                    <span>{baris}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* 5. Chart Bar Dinamis: Real-time Komparasi Pengeluaran Aktual vs Batas Anggaran EWS */}
        {settings && (
          <EwsBudgetBarChart
            transactions={transactions}
            settings={settings}
            period={period}
            isDarkMode={isDarkMode}
          />
        )}
      </div>
    </section>
  );
};

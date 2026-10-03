import React, { useState } from 'react';
import {
  Wallet,
  LayoutDashboard,
  ReceiptText,
  FileText,
  Settings as SettingsIcon,
  Moon,
  Sun,
  Laptop,
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
  RotateCcw,
  Trash2,
  ChevronDown,
  Cloud,
  CloudOff,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { EwsSeverity, ThemeMode } from '../types';
import { SyncStatus } from '../services/firebase';

interface NavbarProps {
  currentTab: 'dashboard' | 'transactions' | 'reports' | 'settings';
  setCurrentTab: (tab: 'dashboard' | 'transactions' | 'reports' | 'settings') => void;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  ewsStatus: EwsSeverity;
  alertCount: number;
  hasTransactions: boolean;
  onClearData: () => void;
  onRestoreData: () => void;
  syncStatus: SyncStatus;
  onOpenAiAdvisor: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  themeMode,
  setThemeMode,
  ewsStatus,
  alertCount,
  hasTransactions,
  onClearData,
  onRestoreData,
  syncStatus,
  onOpenAiAdvisor,
}) => {
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);

  const getEwsStatusBadge = () => {
    switch (ewsStatus) {
      case 'bahaya':
        return {
          icon: <AlertOctagon className="w-3.5 h-3.5 text-rose-500 animate-pulse" />,
          label: 'EWS: BAHAYA',
          classes: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
        };
      case 'waspada':
        return {
          icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />,
          label: 'EWS: WASPADA',
          classes: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
        };
      case 'aman':
      default:
        return {
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />,
          label: 'EWS: AMAN',
          classes: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        };
    }
  };

  const getSyncBadge = () => {
    switch (syncStatus) {
      case 'synced':
        return {
          icon: <Cloud className="w-3 h-3 text-emerald-500" />,
          label: 'Cloud Sync',
          title: 'Data tersinkronisasi penuh dengan Firebase Firestore',
          classes: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
        };
      case 'syncing':
        return {
          icon: <RefreshCw className="w-3 h-3 text-blue-500 animate-spin" />,
          label: 'Menyinkronkan...',
          title: 'Sedang memperbarui perubahan ke Firebase Firestore',
          classes: 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800',
        };
      case 'offline':
      default:
        return {
          icon: <CloudOff className="w-3 h-3 text-slate-400" />,
          label: 'Lokal',
          title: 'Mode offline aktif (penyimpanan lokal)',
          classes: 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
        };
    }
  };

  const statusBadge = getEwsStatusBadge();
  const syncBadge = getSyncBadge();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & App Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg tracking-tight text-slate-900 dark:text-white">
                  Cash Flow Pribadi
                </span>
                {/* Cloud Sync Status Pill */}
                <div
                  title={syncBadge.title}
                  className={`hidden sm:flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${syncBadge.classes}`}
                >
                  {syncBadge.icon}
                  <span>{syncBadge.label}</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
                Arus Kas, Kekayaan Bersih & Early Warning System
              </p>
            </div>
          </div>

          {/* Navigation Tabs (Desktop) */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-800/70 p-1 rounded-xl border border-slate-200/70 dark:border-slate-700/60">
            <button
              onClick={() => setCurrentTab('dashboard')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-smooth ${
                currentTab === 'dashboard'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
              {alertCount > 0 && (
                <span
                  className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold tabular-nums ${
                    ewsStatus === 'bahaya' ? 'bg-rose-500 text-white' : 'bg-amber-500 text-white'
                  }`}
                >
                  {alertCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setCurrentTab('transactions')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-smooth ${
                currentTab === 'transactions'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ReceiptText className="w-4 h-4" />
              <span>Catat Transaksi</span>
            </button>

            <button
              onClick={() => setCurrentTab('reports')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-smooth ${
                currentTab === 'reports'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Laporan Bulanan</span>
            </button>

            <button
              onClick={() => setCurrentTab('settings')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-smooth ${
                currentTab === 'settings'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <SettingsIcon className="w-4 h-4" />
              <span>Pengaturan</span>
            </button>
          </nav>

          {/* Quick Actions, AI Trigger & Theme Switcher */}
          <div className="flex items-center gap-2">
            {/* AI Advisor Button */}
            <button
              onClick={onOpenAiAdvisor}
              title="Buka AI Financial Advisor berbasis Google Gemini"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-bold shadow-md shadow-indigo-600/20 active:scale-98 transition-smooth"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span>AI Advisor</span>
            </button>

            {/* EWS Pill Status */}
            <div
              className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${statusBadge.classes}`}
            >
              {statusBadge.icon}
              <span>{statusBadge.label}</span>
            </div>

            {/* Seed Data Controls */}
            {hasTransactions ? (
              <button
                onClick={onClearData}
                title="Hapus data contoh untuk memulai dari nol"
                className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition-smooth border border-slate-200 dark:border-slate-700"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus contoh</span>
              </button>
            ) : (
              <button
                onClick={onRestoreData}
                title="Muat data contoh 3 bulan untuk demonstrasi"
                className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 rounded-lg transition-smooth border border-emerald-200 dark:border-emerald-800"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Muat contoh</span>
              </button>
            )}

            {/* 3-Mode Theme Selector Dropdown */}
            <div className="relative">
              <button
                onClick={() => setThemeDropdownOpen(!themeDropdownOpen)}
                aria-label="Pilih Mode Tema"
                title="Pilih tema tampilan"
                className="flex items-center gap-1.5 p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-smooth border border-slate-200 dark:border-slate-700 text-xs font-semibold"
              >
                {themeMode === 'light' ? (
                  <Sun className="w-4 h-4 text-amber-500" />
                ) : themeMode === 'dark' ? (
                  <Moon className="w-4 h-4 text-indigo-400" />
                ) : (
                  <Laptop className="w-4 h-4 text-slate-500" />
                )}
                <span className="hidden 2xl:inline capitalize">
                  {themeMode === 'light'
                    ? 'Terang'
                    : themeMode === 'dark'
                    ? 'Gelap'
                    : 'Sistem'}
                </span>
                <ChevronDown className="w-3 h-3 opacity-60" />
              </button>

              {themeDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setThemeDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-36 rounded-xl bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700 py-1 z-50 text-xs font-semibold animate-in fade-in">
                    <button
                      onClick={() => {
                        setThemeMode('light');
                        setThemeDropdownOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-700 ${
                        themeMode === 'light'
                          ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50/50 dark:bg-indigo-950/40'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <Sun className="w-3.5 h-3.5 text-amber-500" />
                      <span>Terang</span>
                    </button>

                    <button
                      onClick={() => {
                        setThemeMode('dark');
                        setThemeDropdownOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-700 ${
                        themeMode === 'dark'
                          ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50/50 dark:bg-indigo-950/40'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <Moon className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Gelap</span>
                    </button>

                    <button
                      onClick={() => {
                        setThemeMode('system');
                        setThemeDropdownOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-700 ${
                        themeMode === 'system'
                          ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50/50 dark:bg-indigo-950/40'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <Laptop className="w-3.5 h-3.5 text-slate-400" />
                      <span>Ikuti Sistem</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Subnav */}
        <div className="flex md:hidden border-t border-slate-200 dark:border-slate-800 py-2 justify-around">
          <button
            onClick={() => setCurrentTab('dashboard')}
            className={`flex flex-col items-center py-1 px-2.5 rounded-lg text-xs font-semibold ${
              currentTab === 'dashboard'
                ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 mb-0.5" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setCurrentTab('transactions')}
            className={`flex flex-col items-center py-1 px-2.5 rounded-lg text-xs font-semibold ${
              currentTab === 'transactions'
                ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <ReceiptText className="w-4 h-4 mb-0.5" />
            <span>Transaksi</span>
          </button>

          <button
            onClick={() => setCurrentTab('reports')}
            className={`flex flex-col items-center py-1 px-2.5 rounded-lg text-xs font-semibold ${
              currentTab === 'reports'
                ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <FileText className="w-4 h-4 mb-0.5" />
            <span>Laporan</span>
          </button>

          <button
            onClick={() => setCurrentTab('settings')}
            className={`flex flex-col items-center py-1 px-2.5 rounded-lg text-xs font-semibold ${
              currentTab === 'settings'
                ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <SettingsIcon className="w-4 h-4 mb-0.5" />
            <span>Pengaturan</span>
          </button>
        </div>
      </div>
    </header>
  );
};

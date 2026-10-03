import React from 'react';
import {
  Wallet,
  LayoutDashboard,
  ReceiptText,
  FileText,
  Settings as SettingsIcon,
  Sparkles,
  Cloud,
  CloudOff,
  RefreshCw,
  Sun,
  Moon,
  Laptop,
  X,
  LogOut,
  ShieldCheck,
  Award,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { ThemeMode, EwsSeverity } from '../types';
import { SyncStatus } from '../services/firebase';

interface SidebarProps {
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
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  currentUser?: User | null;
  onGoogleSignIn?: () => void;
  onSignOut?: () => void;
  onOpenDeveloperCredits?: () => void;
}

const GoogleIcon = () => (
  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  themeMode,
  setThemeMode,
  ewsStatus,
  alertCount,
  syncStatus,
  onOpenAiAdvisor,
  isMobileOpen,
  setIsMobileOpen,
  currentUser,
  onGoogleSignIn,
  onSignOut,
  onOpenDeveloperCredits,
}) => {
  const navItems = [
    {
      id: 'dashboard' as const,
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
      badge:
        alertCount > 0 ? (
          <span
            className={`text-[10px] font-black px-2 py-0.5 rounded-full text-white tabular-nums ${
              ewsStatus === 'bahaya' ? 'bg-rose-500' : 'bg-amber-500'
            }`}
          >
            {alertCount}
          </span>
        ) : null,
    },
    {
      id: 'transactions' as const,
      label: 'Catat Transaksi',
      icon: <ReceiptText className="w-5 h-5" />,
    },
    {
      id: 'reports' as const,
      label: 'Laporan Bulanan',
      icon: <FileText className="w-5 h-5" />,
    },
    {
      id: 'settings' as const,
      label: 'Pengaturan',
      icon: <SettingsIcon className="w-5 h-5" />,
    },
  ];

  const getSyncBadge = () => {
    switch (syncStatus) {
      case 'synced':
        return {
          icon: <Cloud className="w-3.5 h-3.5 text-emerald-500" />,
          label: 'Firestore Terhubung',
          classes: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
        };
      case 'syncing':
        return {
          icon: <RefreshCw className="w-3.5 h-3.5 text-blue-500 animate-spin" />,
          label: 'Menyinkronkan...',
          classes: 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800',
        };
      case 'offline':
      default:
        return {
          icon: <CloudOff className="w-3.5 h-3.5 text-slate-400" />,
          label: 'Penyimpanan Lokal',
          classes: 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
        };
    }
  };

  const sync = getSyncBadge();
  const isGoogleUser = currentUser && !currentUser.isAnonymous;

  const handleNavClick = (tab: typeof currentTab) => {
    setCurrentTab(tab);
    setIsMobileOpen(false);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800/80">
      {/* Brand Header */}
      <div className="p-5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-600/25">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-black text-base tracking-tight text-slate-900 dark:text-white leading-none">
              Cash Flow Evan
            </h1>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
              Personal FinTech & EWS
            </span>
          </div>
        </div>

        {/* Close Button on Mobile Drawer */}
        <button
          onClick={() => setIsMobileOpen(false)}
          className="lg:hidden p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Tutup Menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Primary Navigation Menu */}
      <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Menu Utama
        </div>

        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-smooth ${
                isActive
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`${
                    isActive
                      ? 'text-indigo-600 dark:text-indigo-400'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>
              {item.badge}
            </button>
          );
        })}

        {/* AI Financial Advisor Banner Widget */}
        <div className="pt-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-white shadow-lg shadow-indigo-600/20 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
                <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
                Gemini
              </span>
            </div>
            <div>
              <h4 className="font-bold text-sm">AI Financial Advisor</h4>
              <p className="text-[11px] text-indigo-100 mt-0.5 leading-relaxed">
                Rekomendasi strategis 3 kartu berdasarkan data finansial real-time.
              </p>
            </div>
            <button
              onClick={() => {
                onOpenAiAdvisor();
                setIsMobileOpen(false);
              }}
              className="w-full py-2 px-3 rounded-xl bg-white hover:bg-indigo-50 text-indigo-700 text-xs font-bold transition-smooth active:scale-98 shadow-sm flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Buka Konsultasi AI</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Section: Account, Sync Status & Theme Switcher */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 space-y-3 bg-slate-50/50 dark:bg-slate-900/50">
        {/* Google Authentication Account Card */}
        {isGoogleUser ? (
          <div className="p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/60 bg-white/90 dark:bg-slate-800/80 backdrop-blur-xs flex items-center justify-between gap-2 shadow-2xs">
            <div className="flex items-center gap-2.5 min-w-0">
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt="Avatar"
                  className="w-8 h-8 rounded-full object-cover shrink-0 ring-2 ring-emerald-500/80 dark:ring-emerald-400"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-600 to-teal-600 text-white flex items-center justify-center font-bold text-xs shrink-0 ring-2 ring-emerald-500">
                  {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                  {currentUser.displayName || 'Pengguna'}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-500 dark:text-emerald-400 shrink-0" />
                  <span className="truncate">{currentUser.email}</span>
                </div>
              </div>
            </div>
            {onSignOut && (
              <button
                type="button"
                onClick={onSignOut}
                title="Keluar Akun Google"
                className="p-1.5 text-slate-400 hover:text-rose-600 dark:text-slate-300 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-700/60 rounded-lg transition-smooth shrink-0 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          onGoogleSignIn && (
            <button
              onClick={onGoogleSignIn}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-bold transition-smooth shadow-2xs active:scale-98"
            >
              <GoogleIcon />
              <span>Masuk dengan Google</span>
            </button>
          )
        )}

        {/* Firestore Connection Status */}
        <div
          className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-semibold ${sync.classes}`}
        >
          <div className="flex items-center gap-2">
            {sync.icon}
            <span>{sync.label}</span>
          </div>
          <span className="text-[10px] opacity-75 font-mono">Cloud</span>
        </div>

        {/* Segmented Theme Switcher */}
        <div className="p-1 rounded-xl bg-slate-200/70 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <button
            onClick={() => setThemeMode('light')}
            className={`flex-1 flex items-center justify-center py-1.5 rounded-lg text-xs font-bold transition-smooth ${
              themeMode === 'light'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Mode Terang"
          >
            <Sun className="w-3.5 h-3.5 mr-1 text-amber-500" />
            <span>Terang</span>
          </button>
          <button
            onClick={() => setThemeMode('dark')}
            className={`flex-1 flex items-center justify-center py-1.5 rounded-lg text-xs font-bold transition-smooth ${
              themeMode === 'dark'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Mode Gelap"
          >
            <Moon className="w-3.5 h-3.5 mr-1 text-indigo-400" />
            <span>Gelap</span>
          </button>
          <button
            onClick={() => setThemeMode('system')}
            className={`flex-1 flex items-center justify-center py-1.5 rounded-lg text-xs font-bold transition-smooth ${
              themeMode === 'system'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Ikuti Sistem"
          >
            <Laptop className="w-3.5 h-3.5 mr-1 text-slate-400" />
            <span>Sistem</span>
          </button>
        </div>

        {/* Developer Credits Trigger Button */}
        {onOpenDeveloperCredits && (
          <button
            type="button"
            onClick={() => {
              onOpenDeveloperCredits();
              setIsMobileOpen(false);
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white bg-slate-100/70 hover:bg-slate-200/70 dark:bg-slate-800/70 dark:hover:bg-slate-800 transition-smooth border border-slate-200/80 dark:border-slate-700"
          >
            <div className="flex items-center gap-2">
              <Award className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Info Pengembang</span>
            </div>
            <span className="text-[10px] bg-indigo-50 dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 font-bold px-1.5 py-0.5 rounded border border-indigo-200/60 dark:border-slate-600">
              Evan (LPJK 7)
            </span>
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Permanent) */}
      <aside className="hidden lg:block w-64 xl:w-72 shrink-0 h-screen sticky top-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (Slide-over with Backdrop) */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setIsMobileOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};

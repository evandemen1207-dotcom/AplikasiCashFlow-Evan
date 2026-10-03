import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Plus,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  LogOut,
  User as UserIcon,
  ShieldCheck,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { EwsSeverity } from '../types';

interface TopbarProps {
  currentTab: 'dashboard' | 'transactions' | 'reports' | 'settings';
  onOpenMobileMenu: () => void;
  onOpenAddModal: () => void;
  onOpenAiAdvisor: () => void;
  ewsStatus: EwsSeverity;
  alertCount: number;
  currentUser?: User | null;
  onGoogleSignIn?: () => void;
  onSignOut?: () => void;
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

export const Topbar: React.FC<TopbarProps> = ({
  currentTab,
  onOpenMobileMenu,
  onOpenAddModal,
  onOpenAiAdvisor,
  ewsStatus,
  alertCount,
  currentUser,
  onGoogleSignIn,
  onSignOut,
}) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState<boolean>(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Tutup dropdown jika klik di luar
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getPageMeta = () => {
    switch (currentTab) {
      case 'dashboard':
        return {
          title: 'Dashboard Finansial Evan',
          subtitle: 'Pemantauan Arus Kas, Kekayaan Bersih & Rekomendasi Investasi',
        };
      case 'transactions':
        return {
          title: 'Catat & Riwayat Transaksi',
          subtitle: 'Kelola seluruh pemasukan, pengeluaran, dan kontribusi aset',
        };
      case 'reports':
        return {
          title: 'Laporan Bulanan & Ekspor PDF',
          subtitle: 'Pratinjau laporan arus kas dan arsip dokumen standar cetak',
        };
      case 'settings':
        return {
          title: 'Pengaturan & Parameter EWS',
          subtitle: 'Konfigurasi target dana darurat, anggaran pos, dan ambang batas risiko',
        };
    }
  };

  const meta = getPageMeta();

  const getEwsPill = () => {
    switch (ewsStatus) {
      case 'bahaya':
        return {
          icon: <AlertOctagon className="w-3.5 h-3.5 text-rose-500 animate-pulse" />,
          label: alertCount > 0 ? `${alertCount} Bahaya` : 'EWS Bahaya',
          classes: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900',
        };
      case 'waspada':
        return {
          icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />,
          label: alertCount > 0 ? `${alertCount} Peringatan` : 'EWS Waspada',
          classes: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900',
        };
      case 'aman':
      default:
        return {
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />,
          label: 'EWS: Aman',
          classes: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900',
        };
    }
  };

  const ewsPill = getEwsPill();
  const isGoogleUser = currentUser && !currentUser.isAnonymous;

  return (
    <header className="sticky top-0 z-20 w-full border-b border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Left: Mobile Menu Toggle & Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenMobileMenu}
              className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-smooth border border-slate-200 dark:border-slate-700"
              aria-label="Buka Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight leading-none">
                {meta.title}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block mt-1">
                {meta.subtitle}
              </p>
            </div>
          </div>

          {/* Right: Compact EWS Pill, Auth & Quick Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Compact EWS Status Pill */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border transition-smooth ${ewsPill.classes}`}
            >
              {ewsPill.icon}
              <span className="tabular-nums">{ewsPill.label}</span>
            </div>

            {/* Quick AI Advisor Button */}
            <button
              onClick={onOpenAiAdvisor}
              title="Konsultasi Finansial dengan Google Gemini"
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold border border-indigo-200/70 dark:border-indigo-800/70 transition-smooth active:scale-98"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>AI Advisor</span>
            </button>

            {/* Google Sign-in / User Profile Section */}
            {isGoogleUser ? (
              <div className="relative" ref={profileMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                  className="flex items-center gap-2 p-1 pl-2 pr-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 transition-smooth"
                  aria-label="Profil Akun Google"
                >
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.displayName || 'User'}
                      className="w-6 h-6 rounded-full object-cover ring-1 ring-emerald-500"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-black">
                      {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <span className="hidden sm:inline text-xs font-bold text-slate-800 dark:text-slate-200 max-w-[100px] truncate">
                    {currentUser.displayName || currentUser.email?.split('@')[0]}
                  </span>
                </button>

                {/* Profile Popup Menu */}
                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 animate-in fade-in slide-in-from-top-2 duration-150 z-50">
                    <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
                      {currentUser.photoURL ? (
                        <img
                          src={currentUser.photoURL}
                          alt="Avatar"
                          className="w-9 h-9 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                          {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                          {currentUser.displayName || 'Pengguna Cash Flow'}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {currentUser.email}
                        </div>
                      </div>
                    </div>

                    <div className="py-2.5 space-y-1">
                      <div className="flex items-center gap-1.5 px-2 py-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/40 rounded-lg">
                        <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                        <span>Akun Google Terautentikasi</span>
                      </div>
                    </div>

                    {onSignOut && (
                      <button
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          onSignOut();
                        }}
                        className="w-full mt-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 text-xs font-bold transition-smooth"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Keluar Akun</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              onGoogleSignIn && (
                <button
                  onClick={onGoogleSignIn}
                  title="Masuk dengan Akun Google untuk Sinkronisasi Data"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-smooth shadow-2xs active:scale-98"
                >
                  <GoogleIcon />
                  <span className="hidden sm:inline">Masuk Google</span>
                </button>
              )
            )}

            {/* Primary Action Button: + Catat Transaksi */}
            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm shadow-indigo-600/25 transition-smooth active:scale-98"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Catat Transaksi</span>
              <span className="sm:hidden">Catat</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

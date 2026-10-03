import React from 'react';
import { User } from 'firebase/auth';
import {
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Database,
  Sliders,
  CheckCircle2,
  X,
} from 'lucide-react';

interface WelcomeLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

export const WelcomeLoginModal: React.FC<WelcomeLoginModalProps> = ({
  isOpen,
  onClose,
  user,
}) => {
  if (!isOpen || !user) return null;

  const displayName = user.displayName || user.email?.split('@')[0] || 'Pengguna';
  const initial = (displayName[0] || 'U').toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xl z-10 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Top Gradient Decorative Accent */}
        <div className="h-3 bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600" />

        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Tutup Selamat Datang"
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8 text-center space-y-6">
          {/* Avatar Profile dengan Layered Glow Effect */}
          <div className="relative inline-flex items-center justify-center mx-auto">
            <div className="absolute inset-0 rounded-full bg-emerald-500/25 blur-xl animate-pulse" />
            <div className="relative p-1.5 rounded-full bg-gradient-to-tr from-emerald-500 via-teal-400 to-indigo-500 shadow-lg shadow-emerald-500/30">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={displayName}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover ring-4 ring-white dark:ring-slate-900 shadow-inner"
                />
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-indigo-600 to-teal-600 text-white flex items-center justify-center font-black text-3xl ring-4 ring-white dark:ring-slate-900 shadow-inner">
                  {initial}
                </div>
              )}
            </div>
            {/* Status Ping Badge */}
            <div className="absolute bottom-1 right-1 p-1 bg-white dark:bg-slate-900 rounded-full shadow-md">
              <div className="w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
            </div>
          </div>

          {/* Heading & Greeting */}
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 mb-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Sesi Aktif &amp; Terhubung ke Firestore Cloud</span>
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Selamat Datang Kembali, {displayName}!
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              {user.email}
            </p>
          </div>

          {/* Pesan Sambutan & Readiness */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed text-left space-y-2.5">
            <p className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Seluruh preferensi finansial dan sistem EWS Anda telah siap.</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300 pt-1">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Cloud Sync Real-Time</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Parameter EWS Tersimpan</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Monitoring Limit Anggaran</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Analitik AI Advisor Siap</span>
              </div>
            </div>
          </div>

          {/* Tombol Aksi Utama */}
          <button
            type="button"
            onClick={onClose}
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 transition-smooth active:scale-98 cursor-pointer"
          >
            <span>Masuk ke Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { User } from 'firebase/auth';
import { CloudCheck, ShieldCheck, Sparkles, User as UserIcon, LogIn } from 'lucide-react';
import { SyncStatus } from '../services/firebase';

interface DashboardAuthBannerProps {
  currentUser?: User | null;
  syncStatus?: SyncStatus;
  onGoogleSignIn?: () => void;
}

export const DashboardAuthBanner: React.FC<DashboardAuthBannerProps> = ({
  currentUser,
  syncStatus = 'synced',
  onGoogleSignIn,
}) => {
  const isLoggedIn = Boolean(currentUser && !currentUser.isAnonymous);

  if (!isLoggedIn) {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-slate-100/80 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs transition-smooth">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 shrink-0">
            <UserIcon className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              Berjalan dalam Mode Tamu (Guest Mode)
            </span>
            <span className="text-slate-500 dark:text-slate-400 hidden sm:inline ml-1.5">
              · Data tersimpan di memori perangkat ini.
            </span>
          </div>
        </div>

        {onGoogleSignIn && (
          <button
            type="button"
            onClick={onGoogleSignIn}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 hover:text-indigo-700 dark:hover:text-white border border-slate-200 dark:border-slate-600 transition shadow-2xs self-start sm:self-auto cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Masuk dengan Google untuk Cloud Sync</span>
          </button>
        )}
      </div>
    );
  }

  const displayName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Pengguna';

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-white/90 dark:bg-slate-800/50 border border-slate-200/90 dark:border-slate-700 shadow-2xs backdrop-blur-xs transition-smooth">
      {/* Left: User Identity */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative shrink-0">
          {currentUser?.photoURL ? (
            <img
              src={currentUser.photoURL}
              alt={displayName}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-emerald-500/80 dark:ring-emerald-400 shadow-xs"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-600 to-teal-600 text-white flex items-center justify-center font-bold text-xs ring-2 ring-emerald-500 shadow-xs">
              {(displayName[0] || 'U').toUpperCase()}
            </div>
          )}
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
              Halo, {displayName}
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded-full border border-teal-200/70 dark:border-teal-800/60 shrink-0">
              <ShieldCheck className="w-3 h-3 text-teal-500" />
              <span>Akun Terverifikasi</span>
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
            {currentUser?.email}
          </p>
        </div>
      </div>

      {/* Right: Cloud Sync Status Indicator */}
      <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-200/80 dark:border-emerald-800/70 shadow-2xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>Cloud Sync: On</span>
          <span className="text-[10px] font-normal text-emerald-600 dark:text-emerald-400 hidden md:inline ml-1">
            · Firestore Cloud Aktif
          </span>
        </div>
      </div>
    </div>
  );
};

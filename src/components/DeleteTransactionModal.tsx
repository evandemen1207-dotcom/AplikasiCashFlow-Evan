import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Trash2,
  X,
  Eye,
  EyeOff,
  AlertCircle,
  Calendar,
  Tag,
  FileText,
  DollarSign,
  KeyRound,
} from 'lucide-react';
import { Transaction } from '../types';
import { formatDateIndo, formatRupiah } from '../utils/formatters';

interface DeleteTransactionModalProps {
  isOpen: boolean;
  item: Transaction | null;
  onClose: () => void;
  onConfirmDelete: (id: string) => void;
}

export const DeleteTransactionModal: React.FC<DeleteTransactionModalProps> = ({
  isOpen,
  item,
  onClose,
  onConfirmDelete,
}) => {
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState<boolean>(false);

  const REQUIRED_CODE = 'Evan123@';

  // Reset form ketika modal dibuka atau item berganti
  useEffect(() => {
    if (isOpen) {
      setVerificationCode('');
      setShowPassword(false);
      setErrorMessage(null);
      setIsShaking(false);
    }
  }, [isOpen, item]);

  if (!isOpen || !item) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (verificationCode.trim() !== REQUIRED_CODE) {
      setErrorMessage('Kode verifikasi salah! Data batal dihapus.');
      setIsShaking(true);
      setTimeout(() => {
        setIsShaking(false);
      }, 500);
      return;
    }

    // Kode cocok, jalankan penghapusan
    onConfirmDelete(item.id);
    setVerificationCode('');
    setErrorMessage(null);
    onClose();
  };

  const handleClose = () => {
    setVerificationCode('');
    setErrorMessage(null);
    setIsShaking(false);
    onClose();
  };

  const isIncome = item.type === 'income';
  const isInvest = item.type === 'investment';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      {/* Backdrop click to close */}
      <div
        className="fixed inset-0"
        onClick={handleClose}
        aria-hidden="true"
      />

      <div
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xl z-10 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Decorative Danger Bar */}
        <div className="h-2 bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500" />

        {/* Close Button */}
        <button
          onClick={handleClose}
          type="button"
          aria-label="Tutup modal konfirmasi"
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <form onSubmit={handleSubmit} className="p-6 sm:p-7 space-y-5">
          {/* Header & Ikon Peringatan */}
          <div className="flex items-center gap-3.5">
            <div className="text-rose-500 bg-rose-500/10 p-3 rounded-full ring-8 ring-rose-500/5 shrink-0 shadow-xs">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                Konfirmasi Penghapusan Transaksi
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Verifikasi keamanan data finansial pengguna
              </p>
            </div>
          </div>

          {/* Pesan Peringatan Bahaya */}
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/60 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <p className="text-xs text-rose-900 dark:text-rose-200 leading-relaxed font-medium">
              Tindakan ini tidak dapat dibatalkan. Untuk melanjutkan penghapusan data finansial ini, silakan masukkan kode verifikasi keamanan.
            </p>
          </div>

          {/* Detail Data yang Akan Dihapus (Ringkasan Transaksi) */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-700/60 pb-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <Calendar className="w-3.5 h-3.5" />
                <span>{formatDateIndo(item.date)}</span>
              </div>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isIncome
                    ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
                    : isInvest
                    ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300'
                    : 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300'
                }`}
              >
                {isIncome ? 'Pemasukan' : isInvest ? 'Investasi' : 'Pengeluaran'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-semibold">
                  Kategori
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1 mt-0.5 truncate">
                  <Tag className="w-3 h-3 text-slate-400 shrink-0" />
                  {item.category}
                </span>
              </div>

              <div>
                <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-semibold">
                  Nominal Transaksi
                </span>
                <span
                  className={`font-black tabular-nums mt-0.5 block ${
                    isIncome
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : isInvest
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {isIncome
                    ? `+${formatRupiah(item.amount)}`
                    : isInvest
                    ? formatRupiah(item.amount)
                    : `-${formatRupiah(item.amount)}`}
                </span>
              </div>
            </div>

            {item.note && (
              <div className="pt-1 text-xs border-t border-slate-200/60 dark:border-slate-700/60 flex items-start gap-1.5 text-slate-600 dark:text-slate-300">
                <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span className="truncate">{item.note}</span>
              </div>
            )}
          </div>

          {/* Form Input Kode Verifikasi */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="verification-input"
                className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5"
              >
                <KeyRound className="w-3.5 h-3.5 text-indigo-500" />
                <span>Kode Verifikasi Keamanan</span>
              </label>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Kode Keamanan Default: <strong className="font-mono text-rose-600 dark:text-rose-400">{REQUIRED_CODE}</strong>
              </span>
            </div>

            <div className={`relative ${isShaking ? 'animate-shake' : ''}`}>
              <input
                id="verification-input"
                type={showPassword ? 'text' : 'password'}
                autoFocus
                placeholder="Masukkan kode verifikasi..."
                value={verificationCode}
                onChange={(e) => {
                  setVerificationCode(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                className={`w-full pl-3.5 pr-10 py-2.5 text-sm rounded-xl font-mono bg-white dark:bg-slate-800 border transition-smooth text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden ${
                  errorMessage
                    ? 'border-rose-500 dark:border-rose-500 ring-2 ring-rose-500/20'
                    : 'border-slate-300 dark:border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
                }`}
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                title={showPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Pesan Error Validasi */}
            {errorMessage && (
              <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1 mt-1 animate-in fade-in duration-150">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorMessage}</span>
              </p>
            )}
          </div>

          {/* Tombol Aksi */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-rose-600 hover:bg-rose-500 active:scale-98 shadow-md shadow-rose-600/25 transition cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Hapus</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

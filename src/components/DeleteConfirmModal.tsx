import React, { useState } from 'react';
import { AlertOctagon, ShieldAlert, X, Trash2, KeyRound } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmSuccess: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirmSuccess,
}) => {
  const [securityCode, setSecurityCode] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const REQUIRED_CODE = 'Evan123@';

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (securityCode.trim() !== REQUIRED_CODE) {
      setErrorMessage('Kode verifikasi/sandi salah!');
      return;
    }

    setErrorMessage('');
    setIsDeleting(true);
    try {
      onConfirmSuccess();
      setSecurityCode('');
      onClose();
    } catch (err) {
      setErrorMessage('Gagal menghapus data. Silakan coba kembali.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    setSecurityCode('');
    setErrorMessage('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-rose-200 dark:border-rose-900/60 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-rose-600 to-rose-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center text-white">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg leading-tight">
                Verifikasi Keamanan
              </h3>
              <p className="text-xs text-rose-100 mt-0.5">
                Penghapusan Seluruh Data Permanen
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/50 flex items-start gap-3">
            <AlertOctagon className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-900 dark:text-rose-200 leading-relaxed font-medium">
              Tindakan ini akan <strong>menghapus seluruh riwayat transaksi</strong> di penyimpanan lokal dan Cloud Firestore secara permanen.
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Ketik kode verifikasi keamanan berikut untuk melanjutkan:
            </label>
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-sm font-bold text-slate-800 dark:text-slate-200">
              <span className="select-all tracking-wider text-rose-600 dark:text-rose-400">
                {REQUIRED_CODE}
              </span>
              <span className="text-[10px] uppercase font-sans text-slate-400">
                Kode Verifikasi
              </span>
            </div>

            <div className="relative mt-2">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="text"
                autoFocus
                placeholder="Ketik Evan123@"
                value={securityCode}
                onChange={(e) => {
                  setSecurityCode(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                className={`w-full pl-9 pr-4 py-2.5 rounded-xl text-sm font-semibold bg-slate-50 dark:bg-slate-800/80 border text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 ${
                  errorMessage
                    ? 'border-rose-500 focus:ring-rose-500 bg-rose-50/30'
                    : 'border-slate-200 dark:border-slate-700 focus:ring-rose-500'
                }`}
              />
            </div>

            {errorMessage && (
              <p className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5 animate-in fade-in">
                <AlertOctagon className="w-3.5 h-3.5" />
                <span>{errorMessage}</span>
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isDeleting || !securityCode.trim()}
              className={`flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white rounded-xl shadow-md transition active:scale-98 ${
                securityCode.trim()
                  ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/25'
                  : 'bg-rose-300 dark:bg-rose-950/60 cursor-not-allowed text-rose-200'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isDeleting ? 'Menghapus...' : 'Hapus Data Permanen'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

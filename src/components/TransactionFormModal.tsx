import React, { useState, useEffect } from 'react';
import {
  X,
  PlusCircle,
  Check,
  TrendingUp,
  TrendingDown,
  Calendar,
  Tag,
  DollarSign,
  FileText,
  Sparkles,
} from 'lucide-react';
import {
  Transaction,
  TransactionType,
  IncomeCategory,
  ExpenseCategory,
  InvestmentCategory,
  TransactionCategory,
} from '../types';
import { formatRupiah, parseRupiahInput } from '../utils/formatters';
import { detectCategory } from '../utils/categoryDetector';

interface TransactionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (transaction: Omit<Transaction, 'id' | 'createdAt'> & { id?: string }) => void;
  initialData?: Transaction | null;
}

const INCOME_CATEGORIES: IncomeCategory[] = ['Gaji', 'Usaha', 'Bonus', 'Lainnya'];

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Makanan & Minuman',
  'Transportasi',
  'Tagihan & Rutin',
  'Belanja & Gaya Hidup',
  'Hiburan',
  'Kesehatan',
  'Kebutuhan Pokok',
  'Tagihan',
  'Cicilan/Utang',
  'Pendidikan',
  'Lainnya',
];

const INVESTMENT_CATEGORIES: InvestmentCategory[] = [
  'Reksa Dana',
  'Saham',
  'Obligasi / SBN',
  'Emas',
  'Kripto',
  'Lainnya',
];

export const TransactionFormModal: React.FC<TransactionFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [type, setType] = useState<TransactionType>('expense');
  const [date, setDate] = useState<string>('');
  const [category, setCategory] = useState<TransactionCategory>('Makanan & Minuman');
  const [amountStr, setAmountStr] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [errors, setErrors] = useState<{ date?: string; amount?: string; category?: string }>({});

  // Auto-categorization state
  const [isAutoDetected, setIsAutoDetected] = useState<boolean>(false);
  const [isManualOverride, setIsManualOverride] = useState<boolean>(false);

  useEffect(() => {
    if (initialData) {
      setType(initialData.type);
      setDate(initialData.date);
      setCategory(initialData.category);
      setAmountStr(initialData.amount.toString());
      setNote(initialData.note || '');
    } else {
      // Default ke hari ini (format YYYY-MM-DD)
      const now = new Date();
      const localDate = now.toISOString().slice(0, 10);
      setDate(localDate);
      setType('expense');
      setCategory('Makanan & Minuman');
      setAmountStr('');
      setNote('');
    }
    setErrors({});
    setIsAutoDetected(false);
    setIsManualOverride(false);
  }, [initialData, isOpen]);

  // Debounced auto-categorization saat mengetik pada catatan
  useEffect(() => {
    // Hanya berlaku untuk transaksi pengeluaran dan belum di-override manual
    if (type !== 'expense' || isManualOverride) return;

    if (!note.trim()) {
      setIsAutoDetected(false);
      return;
    }

    const timer = setTimeout(() => {
      const detected = detectCategory(note);
      if (detected) {
        setCategory(detected as TransactionCategory);
        setIsAutoDetected(true);
        if (errors.category) setErrors((prev) => ({ ...prev, category: undefined }));
      } else {
        setIsAutoDetected(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [note, type, isManualOverride, errors.category]);

  // Update default category when type toggles
  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    setIsAutoDetected(false);
    if (newType === 'income') {
      if (!INCOME_CATEGORIES.includes(category as IncomeCategory)) {
        setCategory('Gaji');
      }
    } else if (newType === 'investment') {
      if (!INVESTMENT_CATEGORIES.includes(category as InvestmentCategory)) {
        setCategory('Reksa Dana');
      }
    } else {
      if (!EXPENSE_CATEGORIES.includes(category as ExpenseCategory)) {
        setCategory('Makanan & Minuman');
      }
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/[^0-9]/g, '');
    setAmountStr(rawVal);
    if (errors.amount) {
      setErrors((prev) => ({ ...prev, amount: undefined }));
    }
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCategory(e.target.value as TransactionCategory);
    // User mengubah secara manual: sembunyikan badge dan hentikan auto-update
    setIsManualOverride(true);
    setIsAutoDetected(false);
    if (errors.category) {
      setErrors((prev) => ({ ...prev, category: undefined }));
    }
  };

  const handleNoteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newNote = e.target.value;
    setNote(newNote);
    // Aktifkan kembali auto-detection jika kolom catatan dikosongkan
    if (!newNote.trim()) {
      setIsManualOverride(false);
      setIsAutoDetected(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { date?: string; amount?: string; category?: string } = {};

    if (!date) {
      newErrors.date = 'Tanggal transaksi wajib diisi.';
    }

    const numericAmount = parseRupiahInput(amountStr);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      newErrors.amount = 'Nominal harus lebih besar dari Rp 0.';
    }

    if (!category) {
      newErrors.category = 'Silakan pilih kategori.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({
      id: initialData?.id,
      date,
      type,
      category,
      amount: numericAmount,
      note: note.trim() || undefined,
    });

    // Reset state deteksi setelah transaksi disimpan
    setIsAutoDetected(false);
    setIsManualOverride(false);
    onClose();
  };

  if (!isOpen) return null;

  const currentCategories =
    type === 'income'
      ? INCOME_CATEGORIES
      : type === 'investment'
      ? INVESTMENT_CATEGORIES
      : EXPENSE_CATEGORIES;
  const numericAmount = parseRupiahInput(amountStr);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl ${
                type === 'income'
                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                  : type === 'investment'
                  ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                  : 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
              }`}
            >
              {type === 'income' || type === 'investment' ? (
                <TrendingUp className="w-5 h-5" />
              ) : (
                <TrendingDown className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">
                {initialData ? 'Edit Transaksi' : 'Catat Transaksi Baru'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pencatatan arus kas dengan validasi & update EWS instan
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Jenis Transaksi Toggle */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
              Jenis Transaksi
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => handleTypeChange('income')}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-lg font-bold text-xs sm:text-sm transition-smooth ${
                  type === 'income'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                <span>Pemasukan</span>
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('expense')}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-lg font-bold text-xs sm:text-sm transition-smooth ${
                  type === 'expense'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <TrendingDown className="w-4 h-4" />
                <span>Pengeluaran</span>
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('investment')}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-lg font-bold text-xs sm:text-sm transition-smooth ${
                  type === 'investment'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                <span>Investasi</span>
              </button>
            </div>
          </div>

          {/* Grid Tanggal & Kategori */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Tanggal */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Tanggal</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  if (errors.date) setErrors((p) => ({ ...p, date: undefined }));
                }}
                className={`w-full px-3.5 py-2 rounded-xl text-sm bg-slate-50 dark:bg-slate-800/80 border text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition ${
                  errors.date
                    ? 'border-rose-500 focus:ring-rose-500'
                    : 'border-slate-300 dark:border-slate-700'
                }`}
              />
              {errors.date && (
                <p className="text-xs text-rose-500 mt-1">{errors.date}</p>
              )}
            </div>

            {/* Kategori */}
            <div>
              <div className="flex items-center justify-between mb-1.5 min-h-[22px]">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-slate-400" />
                  <span>Kategori</span>
                </label>
                {isAutoDetected && type === 'expense' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 animate-in fade-in duration-200">
                    <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" />
                    <span>✨ Terdeteksi Otomatis</span>
                  </span>
                )}
              </div>
              <select
                value={category}
                onChange={handleCategoryChange}
                className="w-full px-3.5 py-2 rounded-xl text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition"
              >
                {currentCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="text-xs text-rose-500 mt-1">{errors.category}</p>
              )}
            </div>
          </div>

          {/* Nominal */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                <span>Nominal (Rp)</span>
              </span>
              {numericAmount > 0 && (
                <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                  {formatRupiah(numericAmount)}
                </span>
              )}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-semibold text-sm">
                Rp
              </div>
              <input
                type="text"
                inputMode="numeric"
                placeholder="Contoh: 1.500.000"
                value={amountStr ? parseInt(amountStr, 10).toLocaleString('id-ID') : ''}
                onChange={handleAmountChange}
                className={`w-full pl-11 pr-3.5 py-2.5 rounded-xl text-base font-semibold bg-slate-50 dark:bg-slate-800/80 border text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition ${
                  errors.amount
                    ? 'border-rose-500 focus:ring-rose-500'
                    : 'border-slate-300 dark:border-slate-700'
                }`}
              />
            </div>
            {errors.amount && (
              <p className="text-xs text-rose-500 mt-1">{errors.amount}</p>
            )}
          </div>

          {/* Catatan */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Catatan / Keterangan (Opsional)</span>
            </label>
            <input
              type="text"
              placeholder="Contoh: Beli kopi susu & makan siang"
              value={note}
              onChange={handleNoteChange}
              className="w-full px-3.5 py-2 rounded-xl text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition"
              maxLength={120}
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-98 rounded-xl shadow-md shadow-emerald-600/20 transition"
            >
              <Check className="w-4 h-4" />
              <span>{initialData ? 'Simpan Perubahan' : 'Catat Transaksi'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

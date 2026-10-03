import React, { useState, useMemo, useRef } from 'react';
import {
  Search,
  Filter,
  Plus,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Edit2,
  Trash2,
  Download,
  Upload,
  Calendar,
  AlertCircle,
  FileSpreadsheet,
  FileCode,
  CheckCircle,
  X,
} from 'lucide-react';
import {
  Transaction,
  TransactionType,
  TransactionCategory,
  UserSettings,
} from '../types';
import {
  formatRupiah,
  formatDateIndo,
  formatMonthYearIndo,
} from '../utils/formatters';
import {
  exportTransactionsToCSV,
  exportTransactionsToJSON,
  parseCSV,
} from '../utils/storage';
import { DeleteTransactionModal } from './DeleteTransactionModal';

interface TransactionHistoryProps {
  transactions: Transaction[];
  settings: UserSettings;
  onAddClick: () => void;
  onEditClick: (transaction: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onImportTransactions: (imported: Transaction[]) => void;
}

type SortField = 'date' | 'amount' | 'category' | 'type';
type SortOrder = 'asc' | 'desc';

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  transactions,
  settings,
  onAddClick,
  onEditClick,
  onDeleteTransaction,
  onImportTransactions,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Confirmation modal state for secure deletion
  const [itemToDelete, setItemToDelete] = useState<Transaction | null>(null);

  // File import ref & feedback
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importNotification, setImportNotification] = useState<string | null>(null);

  // Daftar bulan yang unik dari transaksi
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    transactions.forEach((t) => {
      months.add(t.date.slice(0, 7));
    });
    return Array.from(months).sort().reverse();
  }, [transactions]);

  // Daftar kategori yang unik dari data yang ada
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    transactions.forEach((t) => cats.add(t.category));
    return Array.from(cats).sort();
  }, [transactions]);

  // Handle Sort Toggle
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder(field === 'date' || field === 'amount' ? 'desc' : 'asc');
    }
  };

  // Filter & Search Logic
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      // Filter search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchNote = t.note?.toLowerCase().includes(query);
        const matchCat = t.category.toLowerCase().includes(query);
        if (!matchNote && !matchCat) return false;
      }

      // Filter month
      if (selectedMonth !== 'all' && t.date.slice(0, 7) !== selectedMonth) {
        return false;
      }

      // Filter type
      if (selectedType !== 'all' && t.type !== selectedType) {
        return false;
      }

      // Filter category
      if (selectedCategory !== 'all' && t.category !== selectedCategory) {
        return false;
      }

      return true;
    });
  }, [transactions, searchQuery, selectedMonth, selectedType, selectedCategory]);

  // Sorting
  const sortedTransactions = useMemo(() => {
    return [...filteredTransactions].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'date') {
        comparison = a.date.localeCompare(b.date);
      } else if (sortField === 'amount') {
        comparison = a.amount - b.amount;
      } else if (sortField === 'category') {
        comparison = a.category.localeCompare(b.category);
      } else if (sortField === 'type') {
        comparison = a.type.localeCompare(b.type);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [filteredTransactions, sortField, sortOrder]);

  // Summary counts for filtered data
  const filteredSummary = useMemo(() => {
    let income = 0;
    let expense = 0;
    let investment = 0;
    filteredTransactions.forEach((t) => {
      if (t.type === 'income') income += t.amount;
      else if (t.type === 'investment') investment += t.amount;
      else expense += t.amount;
    });
    return { income, expense, investment, net: income - expense };
  }, [filteredTransactions]);

  // Handle CSV/JSON Import
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(text);
          const importedTransactions = Array.isArray(parsed)
            ? parsed
            : parsed.transactions || [];
          if (importedTransactions.length > 0) {
            onImportTransactions(importedTransactions);
            setImportNotification(`Berhasil mengimpor ${importedTransactions.length} transaksi dari JSON!`);
          } else {
            alert('File JSON tidak memuat data transaksi yang valid.');
          }
        } else {
          // CSV Parse
          const parsed = parseCSV(text);
          if (parsed.length > 0) {
            onImportTransactions(parsed);
            setImportNotification(`Berhasil mengimpor ${parsed.length} transaksi dari CSV!`);
          } else {
            alert('Gagal membaca data dari CSV. Pastikan format kolom sesuai.');
          }
        }
      } catch (err) {
        alert('Terjadi kesalahan saat membaca file import: ' + err);
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };

    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            Riwayat & Pencatatan Transaksi
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Total {transactions.length} transaksi tercatat dalam sistem arus kas Anda.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Export Dropdown */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => exportTransactionsToCSV(transactions)}
              title="Unduh seluruh data dalam format CSV (Excel)"
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition border border-slate-200 dark:border-slate-700"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">Ekspor CSV</span>
            </button>

            <button
              onClick={() => exportTransactionsToJSON(transactions, settings)}
              title="Unduh file backup lengkap JSON"
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition border border-slate-200 dark:border-slate-700"
            >
              <FileCode className="w-4 h-4 text-blue-500" />
              <span className="hidden sm:inline">Ekspor JSON</span>
            </button>

            <label
              title="Impor data transaksi dari file CSV atau JSON"
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition border border-slate-200 dark:border-slate-700 cursor-pointer"
            >
              <Upload className="w-4 h-4 text-purple-500" />
              <span className="hidden sm:inline">Impor</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv, .json"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>
          </div>

          {/* Primary Add Button */}
          <button
            onClick={onAddClick}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-98 rounded-xl shadow-md shadow-emerald-600/25 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Catat Transaksi</span>
          </button>
        </div>
      </div>

      {/* Import Notification Banner */}
      {importNotification && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-emerald-800 dark:text-emerald-300 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <span>{importNotification}</span>
          </div>
          <button
            onClick={() => setImportNotification(null)}
            className="p-1 rounded-md hover:bg-emerald-200/50 dark:hover:bg-emerald-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search & Filters Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Cari catatan atau kategori..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Month Filter */}
          <div>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Semua Bulan</option>
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {formatMonthYearIndo(m)}
                </option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Semua Jenis</option>
              <option value="income">Pemasukan Saja</option>
              <option value="expense">Pengeluaran Saja</option>
              <option value="investment">Investasi Saja</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Semua Kategori</option>
              {availableCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter Quick Result Bar */}
        {(searchQuery || selectedMonth !== 'all' || selectedType !== 'all' || selectedCategory !== 'all') && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
            <span className="tabular-nums">
              Menampilkan {filteredTransactions.length} dari {transactions.length} transaksi
              (Pemasukan: <strong className="text-emerald-600">{formatRupiah(filteredSummary.income)}</strong> | Pengeluaran: <strong className="text-rose-600">{formatRupiah(filteredSummary.expense)}</strong> | Investasi: <strong className="text-blue-600">{formatRupiah(filteredSummary.investment)}</strong>)
            </span>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedMonth('all');
                setSelectedType('all');
                setSelectedCategory('all');
              }}
              className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
            >
              Reset Filter
            </button>
          </div>
        )}
      </div>

      {/* Transaction Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        {sortedTransactions.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-8 h-8" />
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white text-base">
              Tidak ada transaksi ditemukan
            </h4>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              {transactions.length === 0
                ? 'Belum ada transaksi yang dicatat. Klik tombol di bawah untuk mencatat transaksi pertama Anda atau muat data contoh.'
                : 'Tidak ada data yang cocok dengan kriteria pencarian dan filter saat ini.'}
            </p>
            {transactions.length === 0 && (
              <button
                onClick={onAddClick}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition"
              >
                <Plus className="w-4 h-4" />
                <span>Catat Transaksi Pertama</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50/80 dark:bg-slate-800/60 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  {/* Tanggal */}
                  <th
                    scope="col"
                    className="py-3.5 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white transition"
                    onClick={() => handleSort('date')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Tanggal</span>
                      {sortField === 'date' ? (
                        sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-emerald-600" /> : <ArrowDown className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 opacity-40" />
                      )}
                    </div>
                  </th>

                  {/* Jenis */}
                  <th
                    scope="col"
                    className="py-3.5 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white transition"
                    onClick={() => handleSort('type')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Jenis</span>
                      {sortField === 'type' ? (
                        sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-emerald-600" /> : <ArrowDown className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 opacity-40" />
                      )}
                    </div>
                  </th>

                  {/* Kategori */}
                  <th
                    scope="col"
                    className="py-3.5 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white transition"
                    onClick={() => handleSort('category')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Kategori</span>
                      {sortField === 'category' ? (
                        sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-emerald-600" /> : <ArrowDown className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 opacity-40" />
                      )}
                    </div>
                  </th>

                  {/* Catatan */}
                  <th scope="col" className="py-3.5 px-4">
                    Catatan
                  </th>

                  {/* Nominal */}
                  <th
                    scope="col"
                    className="py-3.5 px-4 text-right cursor-pointer hover:text-slate-900 dark:hover:text-white transition"
                    onClick={() => handleSort('amount')}
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Nominal</span>
                      {sortField === 'amount' ? (
                        sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-emerald-600" /> : <ArrowDown className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 opacity-40" />
                      )}
                    </div>
                  </th>

                  {/* Aksi */}
                  <th scope="col" className="py-3.5 px-4 text-center">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {sortedTransactions.map((tx) => {
                  const isIncome = tx.type === 'income';
                  const isInvest = tx.type === 'investment';
                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Tanggal */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200">
                        {formatDateIndo(tx.date)}
                      </td>

                      {/* Jenis */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            isIncome
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                              : isInvest
                              ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                              : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                          }`}
                        >
                          {isIncome ? 'Pemasukan' : isInvest ? 'Investasi' : 'Pengeluaran'}
                        </span>
                      </td>

                      {/* Kategori */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700">
                          {tx.category}
                        </span>
                      </td>

                      {/* Catatan */}
                      <td className="py-3.5 px-4 text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xs truncate">
                        {tx.note || <span className="text-slate-400 italic">-</span>}
                      </td>

                      {/* Nominal */}
                      <td
                        className={`py-3.5 px-4 whitespace-nowrap text-right font-bold text-xs sm:text-sm tabular-nums ${
                          isIncome
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : isInvest
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {isIncome
                          ? `+${formatRupiah(tx.amount)}`
                          : isInvest
                          ? formatRupiah(tx.amount)
                          : `-${formatRupiah(tx.amount)}`}
                      </td>

                      {/* Aksi */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onEditClick(tx)}
                            title="Edit transaksi"
                            className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setItemToDelete(tx)}
                            title="Hapus transaksi"
                            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Security Modal with Verification Code */}
      <DeleteTransactionModal
        isOpen={Boolean(itemToDelete)}
        item={itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirmDelete={(id) => {
          onDeleteTransaction(id);
          setItemToDelete(null);
        }}
      />
    </div>
  );
};

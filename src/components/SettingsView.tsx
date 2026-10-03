import React, { useState } from 'react';
import {
  Save,
  RotateCcw,
  Trash2,
  Shield,
  Sliders,
  AlertTriangle,
  Coins,
  TrendingUp,
  Percent,
  Layers,
  CheckCircle,
  FileSpreadsheet,
  FileCode,
  Cloud,
  CloudOff,
  LogOut,
  ShieldCheck,
  User as UserIcon,
  Award,
  Mail,
  ExternalLink,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { UserSettings, RiskProfile, ExpenseCategory, ThemeMode } from '../types';
import { SyncStatus } from '../services/firebase';
import { DEFAULT_USER_SETTINGS } from '../utils/seedData';
import { formatRupiah, parseRupiahInput } from '../utils/formatters';

interface SettingsViewProps {
  settings: UserSettings;
  onSaveSettings: (settings: UserSettings) => void;
  onClearData: () => void;
  onRestoreData: () => void;
  onResetAll: () => void;
  themeMode?: ThemeMode;
  setThemeMode?: (mode: ThemeMode) => void;
  currentUser?: User | null;
  onGoogleSignIn?: () => void;
  onSignOut?: () => void;
  syncStatus?: SyncStatus;
  onOpenDeveloperCredits?: () => void;
}

const ALL_EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Kebutuhan Pokok',
  'Transportasi',
  'Tagihan',
  'Cicilan/Utang',
  'Hiburan',
  'Pendidikan',
  'Kesehatan',
  'Lainnya',
];

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onSaveSettings,
  onClearData,
  onRestoreData,
  onResetAll,
  themeMode,
  setThemeMode,
  currentUser,
  onGoogleSignIn,
  onSignOut,
  syncStatus,
  onOpenDeveloperCredits,
}) => {
  const [formData, setFormData] = useState<UserSettings>(settings);
  const [saveFeedback, setSaveFeedback] = useState<boolean>(false);
  const isUserLoggedIn = Boolean(currentUser && !currentUser.isAnonymous);

  // Sync state if settings prop changes externally (e.g. from cloud or reset default)
  React.useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleInputChange = (field: keyof UserSettings, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleBudgetChange = (cat: ExpenseCategory, amount: number) => {
    setFormData((prev) => ({
      ...prev,
      categoryBudgets: {
        ...prev.categoryBudgets,
        [cat]: amount,
      },
    }));
  };

  const handleThresholdChange = (key: keyof UserSettings['ewsThresholds'], value: number) => {
    setFormData((prev) => ({
      ...prev,
      ewsThresholds: {
        ...prev.ewsThresholds,
        [key]: value,
      },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    setSaveFeedback(true);
    setTimeout(() => setSaveFeedback(false), 3000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            Pengaturan Parameter & Sistem EWS
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Sesuaikan preferensi dana darurat, anggaran kategori, dan ambang batas risiko
          </p>
        </div>

        <button
          type="submit"
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-98 rounded-xl shadow-md shadow-emerald-600/20 transition self-start sm:self-center"
        >
          <Save className="w-4 h-4" />
          <span>{saveFeedback ? 'Tersimpan!' : 'Simpan Perubahan'}</span>
        </button>
      </div>

      {saveFeedback && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-sm flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-600" />
          <span>Pengaturan dan ambang batas EWS berhasil diperbarui!</span>
        </div>
      )}

      {/* Section 1: Profil Risiko & Sasaran Keuangan */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Profil Risiko & Sasaran Finansial
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Menentukan alokasi aset dan target tabungan investasi
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Target Dana Darurat (Bulan) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Target Dana Darurat (Kelipatan Bulan)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="3"
                max="24"
                value={formData.emergencyFundMonthsTarget}
                onChange={(e) =>
                  handleInputChange(
                    'emergencyFundMonthsTarget',
                    Math.max(1, parseInt(e.target.value, 10) || 6)
                  )
                }
                className="w-full px-3.5 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
              <span className="text-xs font-semibold text-slate-500">Bulan</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Standar ideal perencana keuangan: 6 - 12 bulan.</p>
          </div>

          {/* Saldo Dana Darurat Saat Ini */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Saldo Dana Darurat Saat Ini (Rp)
            </label>
            <input
              type="text"
              value={formData.currentEmergencyFund ? formData.currentEmergencyFund.toLocaleString('id-ID') : '0'}
              onChange={(e) =>
                handleInputChange('currentEmergencyFund', parseRupiahInput(e.target.value))
              }
              className="w-full px-3.5 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              {formatRupiah(formData.currentEmergencyFund)}
            </p>
          </div>

          {/* Profil Risiko */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Profil Risiko Investor
            </label>
            <select
              value={formData.riskProfile}
              onChange={(e) => handleInputChange('riskProfile', e.target.value as RiskProfile)}
              className="w-full px-3.5 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white capitalize"
            >
              <option value="konservatif">Konservatif (Utamakan Keamanan Pokok)</option>
              <option value="moderat">Moderat (Seimbang Pertumbuhan)</option>
              <option value="agresif">Agresif (Maksimalkan Akumulasi Pertumbuhan)</option>
            </select>
          </div>

          {/* Target Investasi Bulanan */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Target Investasi Bulanan (Rp)
            </label>
            <input
              type="text"
              value={formData.monthlyInvestmentTarget ? formData.monthlyInvestmentTarget.toLocaleString('id-ID') : '0'}
              onChange={(e) =>
                handleInputChange('monthlyInvestmentTarget', parseRupiahInput(e.target.value))
              }
              className="w-full px-3.5 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              {formatRupiah(formData.monthlyInvestmentTarget)} /bulan
            </p>
          </div>

          {/* Nilai Portofolio Awal */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Nilai Portofolio Investasi Saat Ini (Rp)
            </label>
            <input
              type="text"
              value={formData.currentPortfolioValue ? formData.currentPortfolioValue.toLocaleString('id-ID') : '0'}
              onChange={(e) =>
                handleInputChange('currentPortfolioValue', parseRupiahInput(e.target.value))
              }
              className="w-full px-3.5 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              {formatRupiah(formData.currentPortfolioValue)}
            </p>
          </div>

          {/* Asumsi Return & Inflasi */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Return Thn (%)
              </label>
              <input
                type="number"
                step="0.5"
                value={formData.annualExpectedReturn}
                onChange={(e) =>
                  handleInputChange('annualExpectedReturn', parseFloat(e.target.value) || 0)
                }
                className="w-full px-3.5 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Inflasi Thn (%)
              </label>
              <input
                type="number"
                step="0.5"
                value={formData.annualInflation}
                onChange={(e) =>
                  handleInputChange('annualInflation', parseFloat(e.target.value) || 0)
                }
                className="w-full px-3.5 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Anggaran (Budget) per Kategori Pengeluaran */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Anggaran Bulanan per Kategori Pengeluaran
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Digunakan oleh Early Warning System untuk mendeteksi potensi pemborosan dan overbudget
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
          {ALL_EXPENSE_CATEGORIES.map((cat) => {
            const currentVal = formData.categoryBudgets[cat] || 0;
            return (
              <div
                key={cat}
                className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-1.5"
              >
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  {cat}
                </span>
                <input
                  type="text"
                  placeholder="0"
                  value={currentVal ? currentVal.toLocaleString('id-ID') : '0'}
                  onChange={(e) => handleBudgetChange(cat, parseRupiahInput(e.target.value))}
                  className="w-full px-3 py-1.5 text-xs font-bold rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
                <span className="text-[10px] text-slate-400 block text-right">
                  {formatRupiah(currentVal)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 3: Ambang Batas Early Warning System (EWS) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Konfigurasi Ambang Batas Early Warning System (EWS)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ubah kriteria pemicu status WASPADA (kuning) dan BAHAYA (merah)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1 text-xs">
          {/* 1. Rasio Pengeluaran / Pemasukan */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
            <span className="font-bold text-slate-800 dark:text-slate-200 block">
              1. Rasio Pengeluaran / Pemasukan
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[11px] text-amber-600 block">Waspada (&gt;%)</span>
                <input
                  type="number"
                  value={formData.ewsThresholds.expenseIncomeRatioWarning}
                  onChange={(e) =>
                    handleThresholdChange(
                      'expenseIncomeRatioWarning',
                      parseFloat(e.target.value) || 70
                    )
                  }
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>
              <div>
                <span className="text-[11px] text-rose-600 block">Bahaya (&gt;%)</span>
                <input
                  type="number"
                  value={formData.ewsThresholds.expenseIncomeRatioDanger}
                  onChange={(e) =>
                    handleThresholdChange(
                      'expenseIncomeRatioDanger',
                      parseFloat(e.target.value) || 90
                    )
                  }
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>
            </div>
          </div>

          {/* 2. Savings Rate */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
            <span className="font-bold text-slate-800 dark:text-slate-200 block">
              2. Savings Rate Minimal
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[11px] text-amber-600 block">Waspada (&lt;%)</span>
                <input
                  type="number"
                  value={formData.ewsThresholds.savingsRateWarning}
                  onChange={(e) =>
                    handleThresholdChange(
                      'savingsRateWarning',
                      parseFloat(e.target.value) || 20
                    )
                  }
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>
              <div>
                <span className="text-[11px] text-rose-600 block">Bahaya (&lt;%)</span>
                <input
                  type="number"
                  value={formData.ewsThresholds.savingsRateDanger}
                  onChange={(e) =>
                    handleThresholdChange(
                      'savingsRateDanger',
                      parseFloat(e.target.value) || 10
                    )
                  }
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>
            </div>
          </div>

          {/* 3. Cadangan Dana Darurat */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
            <span className="font-bold text-slate-800 dark:text-slate-200 block">
              3. Dana Darurat (Bulan)
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[11px] text-amber-600 block">Waspada (&lt; bln)</span>
                <input
                  type="number"
                  value={formData.ewsThresholds.emergencyFundWarningMonths}
                  onChange={(e) =>
                    handleThresholdChange(
                      'emergencyFundWarningMonths',
                      parseFloat(e.target.value) || 6
                    )
                  }
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>
              <div>
                <span className="text-[11px] text-rose-600 block">Bahaya (&lt; bln)</span>
                <input
                  type="number"
                  value={formData.ewsThresholds.emergencyFundDangerMonths}
                  onChange={(e) =>
                    handleThresholdChange(
                      'emergencyFundDangerMonths',
                      parseFloat(e.target.value) || 3
                    )
                  }
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>
            </div>
          </div>

          {/* 4. Pemakaian Anggaran Kategori */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
            <span className="font-bold text-slate-800 dark:text-slate-200 block">
              4. Terpakai Anggaran Kategori
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[11px] text-amber-600 block">Waspada (&gt;%)</span>
                <input
                  type="number"
                  value={formData.ewsThresholds.budgetUsageWarning}
                  onChange={(e) =>
                    handleThresholdChange(
                      'budgetUsageWarning',
                      parseFloat(e.target.value) || 80
                    )
                  }
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>
              <div>
                <span className="text-[11px] text-rose-600 block">Bahaya (&gt;%)</span>
                <input
                  type="number"
                  value={formData.ewsThresholds.budgetUsageDanger}
                  onChange={(e) =>
                    handleThresholdChange(
                      'budgetUsageDanger',
                      parseFloat(e.target.value) || 100
                    )
                  }
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>
            </div>
          </div>

          {/* 5. Lonjakan Kategori MoM */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
            <span className="font-bold text-slate-800 dark:text-slate-200 block">
              5. Lonjakan Pengeluaran Kategori
            </span>
            <div>
              <span className="text-[11px] text-amber-600 block">Waspada Naik MoM (&gt;%)</span>
              <input
                type="number"
                value={formData.ewsThresholds.categorySurgePercentage}
                onChange={(e) =>
                  handleThresholdChange(
                    'categorySurgePercentage',
                    parseFloat(e.target.value) || 20
                  )
                }
                className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 mt-1"
              />
            </div>
          </div>

          {/* 6. Porsi Cicilan/Utang */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
            <span className="font-bold text-slate-800 dark:text-slate-200 block">
              6. Rasio Cicilan / Penghasilan
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[11px] text-amber-600 block">Waspada (&gt;%)</span>
                <input
                  type="number"
                  value={formData.ewsThresholds.debtRatioWarning}
                  onChange={(e) =>
                    handleThresholdChange(
                      'debtRatioWarning',
                      parseFloat(e.target.value) || 30
                    )
                  }
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>
              <div>
                <span className="text-[11px] text-rose-600 block">Bahaya (&gt;%)</span>
                <input
                  type="number"
                  value={formData.ewsThresholds.debtRatioDanger}
                  onChange={(e) =>
                    handleThresholdChange(
                      'debtRatioDanger',
                      parseFloat(e.target.value) || 40
                    )
                  }
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 4: Tampilan & Tema Sistem */}
      {themeMode && setThemeMode && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Preferensi Tampilan & Tema
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Pilih mode tampilan aplikasi sesuai kenyamanan visual Anda
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { id: 'light' as const, label: 'Mode Terang (Light)', desc: 'Latar cerah & kontras standar' },
              { id: 'dark' as const, label: 'Mode Gelap (Dark)', desc: 'Latar gelap ramah mata malam hari' },
              { id: 'system' as const, label: 'Ikuti Sistem (Otomatis)', desc: 'Sesuai pengaturan OS/Browser' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setThemeMode(t.id)}
                className={`p-4 rounded-xl border text-left transition-smooth ${
                  themeMode === t.id
                    ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                <div className="font-bold text-xs sm:text-sm">{t.label}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{t.desc}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Section 5: Akun & Sinkronisasi Cloud Firestore */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base">
            Akun & Sinkronisasi Cloud Firestore
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Status koneksi penyimpanan real-time dan profil akun Google Anda
          </p>
        </div>

        {currentUser && !currentUser.isAnonymous ? (
          <div className="p-4 rounded-xl border border-emerald-200/80 dark:border-slate-700/60 bg-emerald-50/40 dark:bg-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt="Avatar"
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-500/80 dark:ring-emerald-400"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-600 to-teal-600 text-white flex items-center justify-center font-bold text-sm ring-2 ring-emerald-500">
                  {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                </div>
              )}
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span>{currentUser.displayName || 'Pengguna'}</span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/60">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    Terhubung
                  </span>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {currentUser.email} • UID: <code className="text-[10px] font-mono text-slate-600 dark:text-slate-300">{currentUser.uid.slice(0, 10)}...</code>
                </div>
              </div>
            </div>

            {onSignOut && (
              <button
                type="button"
                onClick={onSignOut}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-rose-600 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 rounded-xl transition border border-rose-200 dark:border-rose-800/60 self-start sm:self-auto cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Keluar Akun Google</span>
              </button>
            )}
          </div>
        ) : (
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CloudOff className="w-4 h-4 text-slate-400" />
                <span>Belum Terhubung ke Akun Google</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Masuk dengan Google untuk menyinkronkan transaksi ke database Cloud Firestore permanen di cloud.
              </p>
            </div>

            {onGoogleSignIn && (
              <button
                type="button"
                onClick={onGoogleSignIn}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-800 dark:text-white bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-xl transition border border-slate-300 dark:border-slate-600 shadow-2xs self-start sm:self-auto"
              >
                <Cloud className="w-4 h-4 text-indigo-500" />
                <span>Masuk dengan Google</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Section 6: Manajemen Data & Reset Cloud */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base">
            Manajemen Data & Reset
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Kelola riwayat transaksi atau muat data simulasi contoh (hanya sebagai opsi pengujian manual saat dibutuhkan).
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap pt-2">
          <button
            type="button"
            onClick={onClearData}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 rounded-xl transition border border-rose-200 dark:border-rose-900/60"
          >
            <Trash2 className="w-4 h-4" />
            <span>Hapus Seluruh Data</span>
          </button>

          {/* Hanya tampilkan saat pengguna BELUM LOGIN (Unauthenticated) untuk demo/simulasi awal */}
          {!isUserLoggedIn && (
            <button
              type="button"
              onClick={onRestoreData}
              title="Muat data contoh 3 bulan hanya sebagai simulasi pengujian manual (Hanya saat Belum Login)"
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 rounded-xl transition border border-emerald-200 dark:border-emerald-900/60"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Muat Data Contoh (Simulasi Manual 3 Bulan)</span>
            </button>
          )}

          <button
            type="button"
            onClick={onResetAll}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl transition border border-slate-200 dark:border-slate-700"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Kembalikan Semua Pengaturan ke Default</span>
          </button>
        </div>
      </div>

      {/* Section 7: Informasi Pengembang & Kredensial (Author / Developer Credits) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-slate-700">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Informasi & Kredensial Pengembang
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Latar belakang profesional pembuat aplikasi Cash Flow & Early Warning System
              </p>
            </div>
          </div>

          {onOpenDeveloperCredits && (
            <button
              type="button"
              onClick={onOpenDeveloperCredits}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition shadow-2xs"
            >
              <span>Lihat Detail Modal</span>
              <ExternalLink className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
            </button>
          )}
        </div>

        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-600 text-white flex items-center justify-center font-black text-base shadow-sm shrink-0">
                E
              </div>
              <div>
                <span className="font-black text-base text-slate-900 dark:text-white block">
                  Dikembangkan oleh Evan
                </span>
                <span className="block text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                  Ahli Muda Perencanaan Wilayah dan Kota (Sertifikasi LPJK/BNSP Level 7)
                </span>
                <span className="block text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                  Fokus Teknis: GIS, Pemodelan Spasial, dan Analitik Big Data Strategis
                </span>
              </div>
            </div>

            <a
              href="mailto:dermanevan@gmail.com"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50 text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-bold self-start sm:self-auto shadow-2xs"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>dermanevan@gmail.com</span>
            </a>
          </div>

          <div className="space-y-3 text-xs sm:text-sm leading-relaxed">
            <div className="p-4 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/50 text-slate-700 dark:text-slate-200 shadow-2xs">
              Perencana Wilayah dan Kota Tersertifikasi (Ahli Muda Perencanaan Wilayah dan Kota, Sertifikasi LPJK/BNSP Level 7) dengan keahlian teknis dalam GIS, pemodelan spasial, dan analitik big data untuk mendukung perencanaan spasial strategis. Menerapkan pengambilan keputusan berbasis data serta logika finansial personal dalam merancang dan mengembangkan aplikasi Cash Flow &amp; Early Warning System ini.
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/50 text-slate-700 dark:text-slate-200 shadow-2xs">
              Saat tidak sedang menganalisis data spasial, Evan menikmati aktivitas menjelajahi tempat-tempat baru dengan kameranya, memancing, serta mempelajari hal-hal baru di bidang musik dan bidang lainnya.
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};

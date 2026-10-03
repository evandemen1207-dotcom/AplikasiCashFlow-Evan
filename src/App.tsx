import React, { useState, useEffect, useMemo } from 'react';
import {
  Transaction,
  UserSettings,
  FilterPeriod,
  ThemeMode,
} from './types';
import {
  loadTransactions,
  saveTransactions,
  loadSettings,
  saveSettings,
  clearSampleData,
  restoreSampleData,
  loadThemeMode,
  saveThemeMode,
  getEffectiveTheme,
} from './utils/storage';
import { evaluateEWS } from './utils/ews';
import { DEFAULT_USER_SETTINGS, generateSeedTransactions } from './utils/seedData';
import { User } from 'firebase/auth';
import {
  initFirebaseAuth,
  signInWithGoogle,
  logoutUser,
  subscribeTransactionsFromFirestore,
  addTransactionToFirestore,
  updateTransactionInFirestore,
  deleteTransactionFromFirestore,
  seedTransactionsToFirestore,
  clearAllTransactionsInFirestore,
  saveSettingsToFirestore,
  getSettingsFromFirestore,
  getLatestAiInsightFromFirestore,
  SyncStatus,
} from './services/firebase';
import {
  AiFinancialReport,
  AiAdvisorInput,
} from './services/aiAdvisor';
import {
  calculateCashFlowSummary,
  calculateInvestmentCapacity,
  calculate50_30_20,
  calculateEmergencyFundStatus,
  filterTransactionsByPeriod,
} from './utils/calculations';
import { formatRupiah } from './utils/formatters';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { DashboardView } from './components/DashboardView';
import { TransactionHistory } from './components/TransactionHistory';
import { MonthlyReportView } from './components/MonthlyReportView';
import { TransactionFormModal } from './components/TransactionFormModal';
import { SettingsView } from './components/SettingsView';
import { AiAdvisorModal } from './components/AiAdvisorModal';
import { ToastContainer, ToastMessage } from './components/Toast';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { DeveloperCreditsModal } from './components/DeveloperCreditsModal';
import { WelcomeLoginModal } from './components/WelcomeLoginModal';
import { LogoutConfirmModal } from './components/LogoutConfirmModal';
import { useBudgetMonitor } from './hooks/useBudgetMonitor';

export default function App() {
  // Theme state: 'light' | 'dark' | 'system'
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => loadThemeMode());
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => getEffectiveTheme(loadThemeMode()) === 'dark');

  // Navigation tab: 'dashboard' | 'transactions' | 'reports' | 'settings'
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'transactions' | 'reports' | 'settings'>('dashboard');

  // Mobile sidebar state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // Security delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);

  // Welcoming Login Modal & Logout Confirmation Modal state
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState<boolean>(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState<boolean>(false);

  // Dashboard filter period
  const [period, setPeriod] = useState<FilterPeriod>('3_months');

  // Transactions & settings state: default empty on unauthenticated load
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [settings, setSettings] = useState<UserSettings>(() => loadSettings());

  // Firebase integration state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('offline');

  // Toast Notification state
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (
    type: 'success' | 'warning' | 'error' | 'info',
    title: string,
    message?: string,
    badge?: string,
    duration?: number
  ) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setToasts((prev) => [...prev, { id, type, title, message, badge, duration }]);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Background Real-Time Budget Monitor Listener
  useBudgetMonitor({
    transactions,
    settings,
    onAlert: (alert) => {
      if (alert.level === 'danger') {
        addToast(
          'error',
          'Batas Anggaran Terlampaui!',
          `Pengeluaran "${alert.category}" telah melebihi kuota anggaran sebesar ${alert.ratio.toFixed(1)}% (${formatRupiah(alert.spent)} dari ${formatRupiah(alert.budget)}).`,
          `${alert.ratio.toFixed(0)}%`
        );
      } else {
        addToast(
          'warning',
          'Peringatan Limit Anggaran',
          `Kategori "${alert.category}" telah mencapai ${alert.ratio.toFixed(1)}% dari kuota anggaran (${formatRupiah(alert.spent)} dari ${formatRupiah(alert.budget)}).`,
          `${alert.ratio.toFixed(0)}%`
        );
      }
    },
  });

  // Modal form state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // AI Financial Advisor state
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
  const [savedAiReport, setSavedAiReport] = useState<AiFinancialReport | null>(null);

  // EWS dismissed alerts state
  const [dismissedAlertIds, setDismissedAlertIds] = useState<string[]>([]);

  // Developer Credits Modal state
  const [isDeveloperModalOpen, setIsDeveloperModalOpen] = useState<boolean>(false);

  // 1. Inisialisasi Firebase Auth & Firestore Listener
  useEffect(() => {
    let unsubscribeFirestore: (() => void) | null = null;

    initFirebaseAuth(
      async (user) => {
        if (!user) {
          // State unauthenticated: kosongkan transaksi dan reset sync
          if (unsubscribeFirestore) {
            unsubscribeFirestore();
            unsubscribeFirestore = null;
          }
          setCurrentUser(null);
          setUserId(null);
          setTransactions([]);
          setSyncStatus('offline');
          return;
        }

        // State authenticated (pengguna login):
        setCurrentUser(user);
        setUserId(user.uid);
        setSyncStatus('syncing');

        // Tampilkan welcoming overlay 1x jika belum pernah dilihat pada sesi browser ini
        try {
          const shown = sessionStorage.getItem(`welcome_shown_${user.uid}`);
          if (!shown) {
            setIsWelcomeModalOpen(true);
            sessionStorage.setItem(`welcome_shown_${user.uid}`, 'true');
          }
        } catch (e) {}

        try {
          // Subscribe real-time transaksi asli milik user dari Firestore
          unsubscribeFirestore = subscribeTransactionsFromFirestore(
            user.uid,
            async (firestoreTxs) => {
              // Muat transaksi pengguna dari database tanpa auto-seed dummy
              setTransactions(firestoreTxs);
              saveTransactions(firestoreTxs);
              setSyncStatus('synced');
            },
            (err) => {
              console.warn('Firestore subscription fallback to local cache:', err);
              setTransactions(loadTransactions());
              setSyncStatus('offline');
            }
          );

          // Ambil pengaturan dari Firestore jika ada
          const remoteSettings = await getSettingsFromFirestore(user.uid);
          if (remoteSettings) {
            setSettings(remoteSettings);
            saveSettings(remoteSettings);
          } else {
            // Simpan pengaturan awal ke Firestore
            await saveSettingsToFirestore(user.uid, DEFAULT_USER_SETTINGS);
          }

          // Ambil insight AI terakhir
          const latestInsight = await getLatestAiInsightFromFirestore(user.uid);
          if (latestInsight) {
            setSavedAiReport({
              financialScore: latestInsight.financialScore,
              scoreCategory:
                latestInsight.financialScore >= 80
                  ? 'Sangat Sehat'
                  : latestInsight.financialScore >= 60
                  ? 'Stabil'
                  : 'Perlu Perhatian',
              executiveSummary: latestInsight.executiveSummary,
              cashFlowAnalysis: latestInsight.cashFlowAnalysis,
              spendingLeaks: latestInsight.spendingLeaks || [],
              investmentStrategy: latestInsight.investmentStrategy,
              fireRecommendation: 'Patuhi rencana alokasi aset untuk menjaga laju compounding.',
              actionChecklist: latestInsight.actionChecklist || [],
              generatedAt: latestInsight.createdAt,
            });
          }
        } catch (err) {
          console.warn('Firebase initial sync warning, continuing in offline/cached mode:', err);
          setSyncStatus('offline');
        }
      },
      (err) => {
        console.warn('Firebase Auth failed, fallback to local storage:', err);
        setSyncStatus('offline');
      }
    );

    return () => {
      if (unsubscribeFirestore) unsubscribeFirestore();
    };
  }, []);

  // 2. Terapkan kelas tema dark/light tanpa kedipan
  useEffect(() => {
    const applyTheme = () => {
      const effective = getEffectiveTheme(themeMode);
      const isDark = effective === 'dark';
      setIsDarkMode(isDark);
      if (isDark) {
        document.documentElement.classList.add('dark');
        document.body.classList.add('dark');
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.body.classList.remove('dark');
        document.documentElement.setAttribute('data-theme', 'light');
      }
    };

    applyTheme();
    saveThemeMode(themeMode);

    if (themeMode === 'system' && typeof window !== 'undefined' && window.matchMedia) {
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => applyTheme();
      media.addEventListener('change', listener);
      return () => media.removeEventListener('change', listener);
    }
  }, [themeMode]);

  // Evaluasi Early Warning System (EWS)
  const ewsEvaluation = useMemo(() => {
    return evaluateEWS(transactions, settings);
  }, [transactions, settings]);

  // Alert count untuk badge notifikasi
  const activeAlertCount = useMemo(() => {
    return ewsEvaluation.alerts.filter((a) => !dismissedAlertIds.includes(a.id)).length;
  }, [ewsEvaluation.alerts, dismissedAlertIds]);

  // Siapkan data ringkasan untuk AI Financial Advisor
  const filteredTxs = useMemo(() => {
    return filterTransactionsByPeriod(transactions, period);
  }, [transactions, period]);

  const summary = useMemo(() => {
    return calculateCashFlowSummary(filteredTxs);
  }, [filteredTxs]);

  const rule50_30_20 = useMemo(() => {
    return calculate50_30_20(filteredTxs);
  }, [filteredTxs]);

  const emergencyFundStatus = useMemo(() => {
    return calculateEmergencyFundStatus(
      settings.currentEmergencyFund,
      settings.emergencyFundMonthsTarget,
      summary.avgMonthlyExpense,
      summary.netCashFlow / Math.max(1, summary.monthsCount)
    );
  }, [settings, summary]);

  const investmentCapacity = useMemo(() => {
    return calculateInvestmentCapacity(summary, filteredTxs, emergencyFundStatus);
  }, [summary, filteredTxs, emergencyFundStatus]);

  const advisorInput: AiAdvisorInput = {
    summary,
    capacity: investmentCapacity,
    rule50_30_20,
    emergencyFundStatus,
    ewsStatus: ewsEvaluation.overallStatus,
    alerts: ewsEvaluation.alerts,
    transactions,
    settings,
  };

  // CRUD Handlers dengan sinkronisasi Firestore & Local Storage
  const handleSaveTransaction = async (
    data: Omit<Transaction, 'id' | 'createdAt'> & { id?: string }
  ) => {
    setSyncStatus('syncing');

    if (data.id) {
      // Edit existing
      const updated = transactions.map((t) =>
        t.id === data.id
          ? {
              ...t,
              date: data.date,
              type: data.type,
              category: data.category,
              amount: data.amount,
              note: data.note,
            }
          : t
      );
      setTransactions(updated);
      saveTransactions(updated);
      addToast('success', 'Transaksi Diperbarui', 'Perubahan transaksi berhasil disimpan ke Cloud.');

      if (userId) {
        try {
          await updateTransactionInFirestore(userId, data.id, {
            date: data.date,
            type: data.type,
            category: data.category,
            amount: data.amount,
            note: data.note || '',
          });
          setSyncStatus('synced');
        } catch (e) {
          console.warn('Update Firestore failed:', e);
          setSyncStatus('offline');
        }
      }
    } else {
      // Create new
      const newId = `tx-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      const newTx: Transaction = {
        id: newId,
        date: data.date,
        type: data.type,
        category: data.category,
        amount: data.amount,
        note: data.note,
        createdAt: new Date().toISOString(),
      };
      const updated = [newTx, ...transactions];
      setTransactions(updated);
      saveTransactions(updated);
      addToast('success', 'Transaksi Tercatat', `Berhasil mencatat ${data.type === 'income' ? 'pemasukan' : data.type === 'investment' ? 'investasi' : 'pengeluaran'} ${formatRupiah(data.amount)}.`);

      if (userId) {
        try {
          await addTransactionToFirestore(userId, newTx);
          setSyncStatus('synced');
        } catch (e) {
          console.warn('Add to Firestore failed:', e);
          setSyncStatus('offline');
        }
      }
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    setSyncStatus('syncing');
    const updated = transactions.filter((t) => t.id !== id);
    setTransactions(updated);
    saveTransactions(updated);
    addToast('success', 'Transaksi Dihapus', 'Transaksi berhasil dihapus secara permanen.');

    if (userId) {
      try {
        await deleteTransactionFromFirestore(userId, id);
        setSyncStatus('synced');
      } catch (e) {
        console.warn('Delete from Firestore failed:', e);
        setSyncStatus('offline');
      }
    }
  };

  const handleImportTransactions = async (imported: Transaction[]) => {
    setSyncStatus('syncing');
    const merged = [...imported, ...transactions];
    setTransactions(merged);
    saveTransactions(merged);
    addToast('success', 'Import Berhasil', `${imported.length} transaksi baru berhasil diimpor.`);

    if (userId) {
      try {
        await seedTransactionsToFirestore(userId, imported);
        setSyncStatus('synced');
      } catch (e) {
        console.warn('Batch import to Firestore failed:', e);
        setSyncStatus('offline');
      }
    }
  };

  const handleClearData = () => {
    setIsDeleteModalOpen(true);
  };

  const handleExecuteClearData = async () => {
    setSyncStatus('syncing');
    clearSampleData();
    setTransactions([]);
    setDismissedAlertIds([]);
    addToast('success', 'Data Dihapus', 'Data berhasil dihapus secara permanen.');

    if (userId) {
      try {
        await clearAllTransactionsInFirestore(userId);
        setSyncStatus('synced');
      } catch (e) {
        console.warn('Clear Firestore failed:', e);
        setSyncStatus('offline');
      }
    } else {
      setSyncStatus('synced');
    }
  };

  const handleRestoreData = async () => {
    // Tombol ini hanya boleh diakses saat pengguna BELUM LOGIN untuk demo/simulasi awal
    if (currentUser && !currentUser.isAnonymous) {
      addToast('info', 'Hanya Mode Demo', 'Data contoh simulasi hanya dapat dimuat saat belum masuk akun Google.');
      return;
    }

    const seed = restoreSampleData();
    setTransactions(seed);
    setSettings(DEFAULT_USER_SETTINGS);
    setDismissedAlertIds([]);
    addToast('success', 'Data Contoh Dimuat', 'Data simulasi 3 bulan berhasil dimuat untuk pengujian awal.');
  };

  const handleResetAllSettings = async () => {
    setSettings(DEFAULT_USER_SETTINGS);
    saveSettings(DEFAULT_USER_SETTINGS);
    addToast('info', 'Pengaturan Direset', 'Seluruh parameter dan batas EWS dikembalikan ke nilai default.');
    if (userId) {
      try {
        await saveSettingsToFirestore(userId, DEFAULT_USER_SETTINGS);
      } catch (e) {
        console.warn('Reset settings to Firestore failed:', e);
      }
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setSyncStatus('syncing');
      const user = await signInWithGoogle();
      setCurrentUser(user);
      setUserId(user.uid);
      setIsWelcomeModalOpen(true);
      try {
        sessionStorage.setItem(`welcome_shown_${user.uid}`, 'true');
      } catch (e) {}
      addToast(
        'success',
        'Berhasil Masuk',
        `Selamat datang, ${user.displayName || user.email || 'Pengguna'}! Akun Anda terhubung dan disinkronkan ke Cloud Firestore.`
      );
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        console.warn('Google Sign-in failed:', err);
        addToast('error', 'Gagal Masuk', 'Terjadi kendala saat login Google. Silakan coba kembali.');
      }
      setSyncStatus(userId ? 'synced' : 'offline');
    }
  };

  // Pemicu buka modal konfirmasi keluar akun
  const handlePromptSignOut = () => {
    setIsLogoutModalOpen(true);
  };

  // Eksekusi keluar akun setelah konfirmasi pengguna
  const handleExecuteSignOut = async () => {
    try {
      await logoutUser();
      setCurrentUser(null);
      setUserId(null);
      setTransactions([]);
      saveTransactions([]);
      setSettings(DEFAULT_USER_SETTINGS);
      saveSettings(DEFAULT_USER_SETTINGS);
      setSyncStatus('offline');
      addToast(
        'info',
        'Telah Keluar',
        'Anda telah keluar dari akun. Berjalan dalam Mode Tamu (Guest Mode).',
        undefined,
        4000
      );
    } catch (err) {
      console.warn('Logout failed:', err);
    }
  };

  const handleSaveSettings = async (newSettings: UserSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
    addToast('success', 'Pengaturan Disimpan', 'Konfigurasi target dan batas anggaran berhasil diperbarui.');
    if (userId) {
      try {
        await saveSettingsToFirestore(userId, newSettings);
      } catch (e) {
        console.warn('Save settings to Firestore failed:', e);
      }
    }
  };

  const handleUpdateSettingsPartial = async (partial: Partial<UserSettings>) => {
    const updated = { ...settings, ...partial };
    setSettings(updated);
    saveSettings(updated);
    if (userId) {
      try {
        await saveSettingsToFirestore(userId, updated);
      } catch (e) {
        console.warn('Update partial settings to Firestore failed:', e);
      }
    }
  };

  const handleDismissAlert = (alertId: string) => {
    setDismissedAlertIds((prev) => (prev.includes(alertId) ? prev : [...prev, alertId]));
  };

  const handleRestoreDismissedAlerts = () => {
    setDismissedAlertIds([]);
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* 1. Dedicated Sidebar (Desktop Permanent / Mobile Slide-over Drawer) */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        themeMode={themeMode}
        setThemeMode={setThemeMode}
        ewsStatus={ewsEvaluation.overallStatus}
        alertCount={activeAlertCount}
        hasTransactions={transactions.length > 0}
        onClearData={handleClearData}
        onRestoreData={handleRestoreData}
        syncStatus={syncStatus}
        onOpenAiAdvisor={() => setIsAiModalOpen(true)}
        isMobileOpen={isMobileSidebarOpen}
        setIsMobileOpen={setIsMobileSidebarOpen}
        currentUser={currentUser}
        onGoogleSignIn={handleGoogleSignIn}
        onSignOut={handlePromptSignOut}
        onOpenDeveloperCredits={() => setIsDeveloperModalOpen(true)}
      />

      {/* 2. Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar: Clean, uncrowded with title, compact EWS pill, and action triggers */}
        <Topbar
          currentTab={currentTab}
          onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
          onOpenAddModal={() => {
            setEditingTransaction(null);
            setIsModalOpen(true);
          }}
          onOpenAiAdvisor={() => setIsAiModalOpen(true)}
          ewsStatus={ewsEvaluation.overallStatus}
          alertCount={activeAlertCount}
          currentUser={currentUser}
          onGoogleSignIn={handleGoogleSignIn}
          onSignOut={handlePromptSignOut}
        />

        {/* Viewport Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 sm:pb-20">
          {currentTab === 'dashboard' && (
            <DashboardView
              transactions={transactions}
              settings={settings}
              period={period}
              setPeriod={setPeriod}
              evaluation={ewsEvaluation}
              ewsStatus={ewsEvaluation.overallStatus}
              statusBadgeText={ewsEvaluation.statusBadgeText}
              statusHeadline={ewsEvaluation.statusHeadline}
              alerts={ewsEvaluation.alerts}
              dismissedAlertIds={dismissedAlertIds}
              onDismissAlert={handleDismissAlert}
              onRestoreDismissedAlerts={handleRestoreDismissedAlerts}
              onUpdateSettings={handleUpdateSettingsPartial}
              isDarkMode={isDarkMode}
              currentUser={currentUser}
              syncStatus={syncStatus}
              onOpenAddModal={() => {
                setEditingTransaction(null);
                setIsModalOpen(true);
              }}
              onGoogleSignIn={handleGoogleSignIn}
            />
          )}

          {currentTab === 'transactions' && (
            <TransactionHistory
              transactions={transactions}
              settings={settings}
              onAddClick={() => {
                setEditingTransaction(null);
                setIsModalOpen(true);
              }}
              onEditClick={(tx) => {
                setEditingTransaction(tx);
                setIsModalOpen(true);
              }}
              onDeleteTransaction={handleDeleteTransaction}
              onImportTransactions={handleImportTransactions}
            />
          )}

          {currentTab === 'reports' && (
            <MonthlyReportView
              transactions={transactions}
              settings={settings}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsView
              settings={settings}
              onSaveSettings={handleSaveSettings}
              onClearData={handleClearData}
              onRestoreData={handleRestoreData}
              onResetAll={handleResetAllSettings}
              themeMode={themeMode}
              setThemeMode={setThemeMode}
              currentUser={currentUser}
              onGoogleSignIn={handleGoogleSignIn}
              onSignOut={handlePromptSignOut}
              syncStatus={syncStatus}
              onOpenDeveloperCredits={() => setIsDeveloperModalOpen(true)}
            />
          )}
        </main>
      </div>

      {/* Modal Catat / Edit Transaksi */}
      <TransactionFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTransaction(null);
        }}
        onSubmit={handleSaveTransaction}
        initialData={editingTransaction}
      />

      {/* Modal AI Financial Advisor (Google Gemini Powered) */}
      <AiAdvisorModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        transactions={transactions}
        advisorInput={advisorInput}
        userId={userId}
        savedReport={savedAiReport}
        onReportGenerated={(newReport) => setSavedAiReport(newReport)}
        onOpenAddModal={() => {
          setIsAiModalOpen(false);
          setEditingTransaction(null);
          setIsModalOpen(true);
        }}
      />

      {/* Modal Konfirmasi Keamanan Hapus Data */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirmSuccess={handleExecuteClearData}
      />

      {/* Modal Kredensial & Profil Pengembang (Evan) */}
      <DeveloperCreditsModal
        isOpen={isDeveloperModalOpen}
        onClose={() => setIsDeveloperModalOpen(false)}
      />

      {/* Modal Welcoming Overlay saat Login Berhasil */}
      <WelcomeLoginModal
        isOpen={isWelcomeModalOpen}
        onClose={() => setIsWelcomeModalOpen(false)}
        user={currentUser}
      />

      {/* Modal Konfirmasi Keluar Akun (Logout) */}
      <LogoutConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleExecuteSignOut}
        userName={currentUser?.displayName || currentUser?.email}
      />

      {/* Fixed Footer */}
      <footer className="fixed bottom-0 left-0 right-0 z-20 border-t border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md py-2.5 text-center text-xs text-slate-500 dark:text-slate-400 transition-colors">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setIsDeveloperModalOpen(true)}
            className="inline-flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors group cursor-pointer"
            title="Klik untuk melihat profil & kredensial pengembang"
          >
            <span>Dikembangkan oleh <span className="underline decoration-indigo-400 underline-offset-2 font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">Evan</span></span>
            <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-slate-700">
              Ahli Muda PWK (LPJK 7)
            </span>
          </button>
          <span>·</span>
          <a
            href="mailto:dermanevan@gmail.com"
            className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline transition-colors"
          >
            dermanevan@gmail.com
          </a>
        </div>
      </footer>
    </div>
  );
}

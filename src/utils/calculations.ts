import {
  Transaction,
  UserSettings,
  RiskProfile,
  FilterPeriod,
  ExpenseCategory,
  NetWorthTrendItem,
  NetWorthSummary,
} from '../types';

export interface CashFlowSummary {
  totalIncome: number;
  totalExpense: number;
  totalInvestment: number;
  netCashFlow: number;
  savingsRate: number; // Persentase 0-100
  avgMonthlyIncome: number;
  avgMonthlyExpense: number;
  monthsCount: number;
}

export interface MonthlyTrendItem {
  monthKey: string;      // "2026-07"
  monthLabel: string;    // "Jul 26"
  income: number;
  expense: number;
  net: number;
  cumulativeNet: number;
}

export interface CategoryExpenseBreakdown {
  category: ExpenseCategory;
  total: number;
  percentage: number;
  budget: number;
  budgetUsagePercent: number;
}

export interface Rule50_30_20Analysis {
  needsActual: number;
  needsPercent: number;
  needsTarget: number; // 50% of income

  wantsActual: number;
  wantsPercent: number;
  wantsTarget: number; // 30% of income

  savingsActual: number;
  savingsPercent: number;
  savingsTarget: number; // 20% of income
}

export interface InvestmentCapacityResult {
  monthlyIncome: number;
  mandatoryExpenses: number; // Kebutuhan pokok, tagihan, cicilan
  discretionaryExpenses: number;
  emergencyFundMonthlyContribution: number;
  investmentCapacity: number; // Pemasukan - pengeluaran wajib - alokasi dana darurat
}

export interface EmergencyFundStatus {
  currentFund: number;
  targetMonths: number;
  avgMonthlyExpense: number;
  targetFundAmount: number;
  fundedMonths: number;
  progressPercent: number;
  deficit: number;
  estimatedMonthsToTarget: number;
}

export interface AssetAllocationItem {
  assetClass: string;
  percentage: number;
  description: string;
  recommendedAmount: number;
  color: string;
}

export interface FireProjectionYear {
  year: number;
  ageOffset: number;
  nominalPortfolio: number;
  realPortfolio: number; // Disesuaikan inflasi
  targetFireAmount: number;
  passiveIncomeAnnual: number; // 4% Rule
}

export interface FireProjectionResult {
  annualExpense: number;
  fireTargetNumber: number; // 25x pengeluaran tahunan
  yearsToFire: number | null; // null jika tidak tercapai dalam 40 tahun
  projectedTimeline: FireProjectionYear[];
}

/**
 * Filter transaksi berdasarkan pilihan periode
 */
export function filterTransactionsByPeriod(
  transactions: Transaction[],
  period: FilterPeriod
): Transaction[] {
  if (transactions.length === 0) return [];
  if (period === 'all') return [...transactions];

  // Gunakan tanggal transaksi paling mutakhir sebagai acuan relatif
  const sortedDates = transactions.map((t) => t.date).sort();
  const latestDateStr = sortedDates[sortedDates.length - 1];
  const [refYear, refMonth] = latestDateStr.split('-').map(Number);

  return transactions.filter((t) => {
    const [year, month] = t.date.split('-').map(Number);
    const monthDiff = (refYear - year) * 12 + (refMonth - month);

    switch (period) {
      case 'this_month':
        return monthDiff === 0;
      case '3_months':
        return monthDiff >= 0 && monthDiff < 3;
      case '6_months':
        return monthDiff >= 0 && monthDiff < 6;
      case 'this_year':
        return year === refYear;
      default:
        return true;
    }
  });
}

/**
 * Hitung ringkasan arus kas (Pemasukan, Pengeluaran, Investasi, Arus Kas Bersih, Savings Rate)
 */
export function calculateCashFlowSummary(
  transactions: Transaction[]
): CashFlowSummary {
  let totalIncome = 0;
  let totalExpense = 0;
  let totalInvestment = 0;
  const uniqueMonths = new Set<string>();

  for (const t of transactions) {
    uniqueMonths.add(t.date.slice(0, 7));
    if (t.type === 'income') {
      totalIncome += t.amount;
    } else if (t.type === 'expense') {
      totalExpense += t.amount;
    } else if (t.type === 'investment') {
      totalInvestment += t.amount;
    }
  }

  const netCashFlow = totalIncome - totalExpense;
  // Savings rate: ((Pemasukan - Pengeluaran) / Pemasukan) * 100
  const savingsRate =
    totalIncome > 0 ? Math.max(0, (netCashFlow / totalIncome) * 100) : 0;

  const monthsCount = Math.max(1, uniqueMonths.size);
  const avgMonthlyIncome = totalIncome / monthsCount;
  const avgMonthlyExpense = totalExpense / monthsCount;

  return {
    totalIncome,
    totalExpense,
    totalInvestment,
    netCashFlow,
    savingsRate,
    avgMonthlyIncome,
    avgMonthlyExpense,
    monthsCount,
  };
}

/**
 * Rekap tren bulanan untuk grafik Bar (Pemasukan vs Pengeluaran)
 * dan grafik Line/Area (Arus Kas Bersih Kumulatif)
 */
export function calculateMonthlyTrends(
  transactions: Transaction[]
): MonthlyTrendItem[] {
  const monthMap: Record<string, { income: number; expense: number }> = {};

  for (const t of transactions) {
    const key = t.date.slice(0, 7); // YYYY-MM
    if (!monthMap[key]) {
      monthMap[key] = { income: 0, expense: 0 };
    }
    if (t.type === 'income') {
      monthMap[key].income += t.amount;
    } else {
      monthMap[key].expense += t.amount;
    }
  }

  const sortedKeys = Object.keys(monthMap).sort();
  let runningCumulative = 0;

  return sortedKeys.map((key) => {
    const { income, expense } = monthMap[key];
    const net = income - expense;
    runningCumulative += net;

    const [year, month] = key.split('-');
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
      'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'
    ];
    const monthLabel = `${monthNames[parseInt(month, 10) - 1]} '${year.slice(2)}`;

    return {
      monthKey: key,
      monthLabel,
      income,
      expense,
      net,
      cumulativeNet: runningCumulative,
    };
  });
}

/**
 * Hitung pengeluaran per kategori untuk diagram Donut
 */
export function calculateCategoryExpenses(
  transactions: Transaction[],
  settings: UserSettings
): CategoryExpenseBreakdown[] {
  const expenseMap: Record<string, number> = {};
  let totalExpense = 0;

  for (const t of transactions) {
    if (t.type === 'expense') {
      expenseMap[t.category] = (expenseMap[t.category] || 0) + t.amount;
      totalExpense += t.amount;
    }
  }

  const allExpenseCategories: ExpenseCategory[] = [
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

  return allExpenseCategories
    .map((category) => {
      const total = expenseMap[category] || 0;
      const percentage = totalExpense > 0 ? (total / totalExpense) * 100 : 0;
      const budget = settings.categoryBudgets[category] || 0;
      const budgetUsagePercent = budget > 0 ? (total / budget) * 100 : 0;

      return {
        category,
        total,
        percentage,
        budget,
        budgetUsagePercent,
      };
    })
    .sort((a, b) => b.total - a.total);
}

/**
 * Klasifikasi dan analisis aturan 50/30/20:
 * - Kebutuhan (Needs 50%): Kebutuhan Pokok, Tagihan, Cicilan/Utang, Kesehatan, Pendidikan
 * - Keinginan (Wants 30%): Hiburan, Transportasi (sebagian fleksibel), Lainnya
 * - Tabungan & Investasi (Savings 20%): Arus kas bersih (surplus yang dapat diinvestasikan)
 */
export function calculate50_30_20(
  transactions: Transaction[]
): Rule50_30_20Analysis {
  let totalIncome = 0;
  let needsActual = 0;
  let wantsActual = 0;

  const needsCategories = new Set([
    'Kebutuhan Pokok',
    'Tagihan',
    'Cicilan/Utang',
    'Kesehatan',
    'Pendidikan',
  ]);

  for (const t of transactions) {
    if (t.type === 'income') {
      totalIncome += t.amount;
    } else if (t.type === 'expense') {
      if (needsCategories.has(t.category)) {
        needsActual += t.amount;
      } else {
        wantsActual += t.amount;
      }
    }
  }

  // Savings adalah sisa pemasukan dikurangi seluruh pengeluaran
  const savingsActual = Math.max(0, totalIncome - (needsActual + wantsActual));

  const needsPercent = totalIncome > 0 ? (needsActual / totalIncome) * 100 : 0;
  const wantsPercent = totalIncome > 0 ? (wantsActual / totalIncome) * 100 : 0;
  const savingsPercent = totalIncome > 0 ? (savingsActual / totalIncome) * 100 : 0;

  return {
    needsActual,
    needsPercent,
    needsTarget: totalIncome * 0.5,
    wantsActual,
    wantsPercent,
    wantsTarget: totalIncome * 0.3,
    savingsActual,
    savingsPercent,
    savingsTarget: totalIncome * 0.2,
  };
}

/**
 * Hitung kapasitas investasi:
 * Kapasitas Investasi = Pemasukan - Pengeluaran Wajib - Target Alokasi Dana Darurat Bulanan
 */
export function calculateInvestmentCapacity(
  summary: CashFlowSummary,
  transactions: Transaction[],
  emergencyFundStatus: EmergencyFundStatus
): InvestmentCapacityResult {
  const monthlyIncome = summary.avgMonthlyIncome;

  // Pengeluaran wajib: Kebutuhan Pokok + Tagihan + Cicilan/Utang
  const mandatoryCategories = new Set(['Kebutuhan Pokok', 'Tagihan', 'Cicilan/Utang']);
  let mandatorySum = 0;
  let discretionarySum = 0;

  for (const t of transactions) {
    if (t.type === 'expense') {
      if (mandatoryCategories.has(t.category)) {
        mandatorySum += t.amount;
      } else {
        discretionarySum += t.amount;
      }
    }
  }

  const months = Math.max(1, summary.monthsCount);
  const mandatoryExpenses = mandatorySum / months;
  const discretionaryExpenses = discretionarySum / months;

  // Jika dana darurat belum cukup, alokasikan 10% dari pemasukan atau sisa defisit / 12
  let emergencyFundMonthlyContribution = 0;
  if (emergencyFundStatus.deficit > 0) {
    // Sisihkan maksimal 15% pemasukan untuk mengejar dana darurat
    emergencyFundMonthlyContribution = Math.min(
      monthlyIncome * 0.15,
      emergencyFundStatus.deficit / 6
    );
  }

  const investmentCapacity = Math.max(
    0,
    monthlyIncome - mandatoryExpenses - discretionaryExpenses - emergencyFundMonthlyContribution
  );

  return {
    monthlyIncome,
    mandatoryExpenses,
    discretionaryExpenses,
    emergencyFundMonthlyContribution,
    investmentCapacity,
  };
}

/**
 * Status dana darurat:
 * Target = Target Bulan * Rata-rata pengeluaran bulanan
 */
export function calculateEmergencyFundStatus(
  currentFund: number,
  targetMonths: number,
  avgMonthlyExpense: number,
  monthlySurplus: number
): EmergencyFundStatus {
  const targetFundAmount = Math.max(1, avgMonthlyExpense * targetMonths);
  const fundedMonths = avgMonthlyExpense > 0 ? currentFund / avgMonthlyExpense : 0;
  const progressPercent = Math.min(100, (currentFund / targetFundAmount) * 100);
  const deficit = Math.max(0, targetFundAmount - currentFund);

  // Estimasi bulan tercapai jika surplus bulanan disisihkan
  let estimatedMonthsToTarget = 0;
  if (deficit > 0) {
    const monthlyAllocation = monthlySurplus > 0 ? monthlySurplus * 0.5 : 500000;
    estimatedMonthsToTarget = Math.ceil(deficit / monthlyAllocation);
  }

  return {
    currentFund,
    targetMonths,
    avgMonthlyExpense,
    targetFundAmount,
    fundedMonths,
    progressPercent,
    deficit,
    estimatedMonthsToTarget,
  };
}

/**
 * Alokasi aset investasi berdasarkan profil risiko
 */
export function getAssetAllocationByRiskProfile(
  profile: RiskProfile,
  monthlyCapacity: number
): AssetAllocationItem[] {
  switch (profile) {
    case 'konservatif':
      return [
        {
          assetClass: 'Pasar Uang & Deposito',
          percentage: 50,
          description: 'Sangat likuid dan risiko modal mendekati nol.',
          recommendedAmount: monthlyCapacity * 0.5,
          color: '#10B981', // emerald
        },
        {
          assetClass: 'SBN / Obligasi Negara',
          percentage: 30,
          description: 'Kupon tetap dengan jaminan negara.',
          recommendedAmount: monthlyCapacity * 0.3,
          color: '#3B82F6', // blue
        },
        {
          assetClass: 'Emas Fisik / Digital',
          percentage: 15,
          description: 'Lindung nilai terhadap depresiasi mata uang.',
          recommendedAmount: monthlyCapacity * 0.15,
          color: '#F59E0B', // amber
        },
        {
          assetClass: 'Reksa Dana Saham / Indeks',
          percentage: 5,
          description: 'Porsi kecil untuk pertumbuhan jangka panjang.',
          recommendedAmount: monthlyCapacity * 0.05,
          color: '#8B5CF6', // purple
        },
      ];

    case 'moderat':
      return [
        {
          assetClass: 'Reksa Dana Saham & Indeks IDX30',
          percentage: 35,
          description: 'Pertumbuhan modal jangka menengah-panjang.',
          recommendedAmount: monthlyCapacity * 0.35,
          color: '#8B5CF6', // purple
        },
        {
          assetClass: 'SBN / Obligasi Korporasi AAA',
          percentage: 35,
          description: 'Penyeimbang volatilitas dengan imbal hasil stabil.',
          recommendedAmount: monthlyCapacity * 0.35,
          color: '#3B82F6', // blue
        },
        {
          assetClass: 'Pasar Uang',
          percentage: 15,
          description: 'Likuiditas dan cadangan taktis pasar.',
          recommendedAmount: monthlyCapacity * 0.15,
          color: '#10B981', // emerald
        },
        {
          assetClass: 'Emas',
          percentage: 15,
          description: 'Hedge inflasi dan diversifikasi aset.',
          recommendedAmount: monthlyCapacity * 0.15,
          color: '#F59E0B', // amber
        },
      ];

    case 'agresif':
      return [
        {
          assetClass: 'Saham & Reksa Dana Indeks',
          percentage: 60,
          description: 'Fokus akumulasi pertumbuhan maksimal (high risk high return).',
          recommendedAmount: monthlyCapacity * 0.6,
          color: '#EC4899', // pink
        },
        {
          assetClass: 'SBN / Obligasi',
          percentage: 20,
          description: 'Jangkar stabilitas portofolio.',
          recommendedAmount: monthlyCapacity * 0.2,
          color: '#3B82F6', // blue
        },
        {
          assetClass: 'Emas',
          percentage: 10,
          description: 'Aset safe-haven pelindung krisis.',
          recommendedAmount: monthlyCapacity * 0.1,
          color: '#F59E0B', // amber
        },
        {
          assetClass: 'Pasar Uang / Alternatif',
          percentage: 10,
          description: 'Alat serap likuiditas & peluang pasar agresif.',
          recommendedAmount: monthlyCapacity * 0.1,
          color: '#10B981', // emerald
        },
      ];
  }
}

/**
 * Proyeksi Kemandirian Finansial (FIRE):
 * - Target Angka FIRE = 25 x Pengeluaran Tahunan (Rule of 25 / Safe Withdrawal Rate 4%)
 * - Simulasi pertumbuhan portofolio kompon dengan kontribusi bulanan
 */
export function calculateFireProjection(
  avgMonthlyExpense: number,
  monthlyInvestment: number,
  currentPortfolio: number,
  annualReturnPercent: number,
  annualInflationPercent: number
): FireProjectionResult {
  const annualExpense = avgMonthlyExpense * 12;
  const fireTargetNumber = annualExpense * 25; // 25x pengeluaran tahunan

  const monthlyReturn = annualReturnPercent / 100 / 12;
  const realAnnualReturn =
    ((1 + annualReturnPercent / 100) / (1 + annualInflationPercent / 100) - 1);
  const realMonthlyReturn = realAnnualReturn / 12;

  let currentNominal = currentPortfolio;
  let currentReal = currentPortfolio;
  let reachedYear: number | null = null;

  const timeline: FireProjectionYear[] = [];
  const maxYears = 30;

  timeline.push({
    year: 0,
    ageOffset: 0,
    nominalPortfolio: Math.round(currentNominal),
    realPortfolio: Math.round(currentReal),
    targetFireAmount: Math.round(fireTargetNumber),
    passiveIncomeAnnual: Math.round(currentReal * 0.04),
  });

  for (let y = 1; y <= maxYears; y++) {
    // 12 bulan per tahun
    for (let m = 0; m < 12; m++) {
      currentNominal = currentNominal * (1 + monthlyReturn) + monthlyInvestment;
      currentReal = currentReal * (1 + realMonthlyReturn) + monthlyInvestment;
    }

    if (reachedYear === null && currentReal >= fireTargetNumber) {
      reachedYear = y;
    }

    timeline.push({
      year: y,
      ageOffset: y,
      nominalPortfolio: Math.round(currentNominal),
      realPortfolio: Math.round(currentReal),
      targetFireAmount: Math.round(fireTargetNumber),
      passiveIncomeAnnual: Math.round(currentReal * 0.04),
    });
  }

  return {
    annualExpense,
    fireTargetNumber,
    yearsToFire: reachedYear,
    projectedTimeline: timeline,
  };
}

/**
 * Hitung perkembangan nilai bersih (Net Worth) per bulan:
 * Nilai Bersih = saldo awal + akumulasi (pemasukan - pengeluaran) + akumulasi kontribusi investasi - utang (jika ada).
 * Transaksi berjenis Investasi dihitung sebagai aset, bukan pengeluaran.
 */
export function calculateNetWorthTrends(
  transactions: Transaction[],
  settings: UserSettings
): NetWorthSummary {
  if (transactions.length === 0) {
    const baseInitial = (settings.currentEmergencyFund || 0) + (settings.currentPortfolioValue || 0);
    return {
      currentNetWorth: baseInitial,
      previousNetWorth: baseInitial,
      differenceNominal: 0,
      differencePercentage: 0,
      isPositive: true,
      history: [],
    };
  }

  // Kelompokkan data per bulan YYYY-MM
  const monthMap: Record<
    string,
    { income: number; expense: number; investment: number; debt: number }
  > = {};

  for (const t of transactions) {
    const key = t.date.slice(0, 7);
    if (!monthMap[key]) {
      monthMap[key] = { income: 0, expense: 0, investment: 0, debt: 0 };
    }
    if (t.type === 'income') {
      monthMap[key].income += t.amount;
    } else if (t.type === 'expense') {
      monthMap[key].expense += t.amount;
      if (t.category === 'Cicilan/Utang') {
        monthMap[key].debt += t.amount;
      }
    } else if (t.type === 'investment') {
      monthMap[key].investment += t.amount;
    }
  }

  const sortedKeys = Object.keys(monthMap).sort();

  // Saldo awal awal
  let runningCash = settings.currentEmergencyFund || 0;
  let runningInvestments = settings.currentPortfolioValue || 0;

  const history: NetWorthTrendItem[] = [];

  for (const key of sortedKeys) {
    const m = monthMap[key];
    // Kas/Tabungan bertambah dari surplus arus kas (pemasukan - pengeluaran operasional)
    runningCash += (m.income - m.expense);
    // Aset investasi bertambah dari kontribusi investasi
    runningInvestments += m.investment;

    // Nilai bersih = Kas + Aset Investasi - Beban Utang
    const netWorth = runningCash + runningInvestments - m.debt;

    const [year, month] = key.split('-');
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
      'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'
    ];
    const monthLabel = `${monthNames[parseInt(month, 10) - 1]} '${year.slice(2)}`;

    history.push({
      monthKey: key,
      monthLabel,
      cashSavings: Math.max(0, Math.round(runningCash)),
      investmentAssets: Math.max(0, Math.round(runningInvestments)),
      debt: Math.round(m.debt),
      netWorth: Math.round(netWorth),
    });
  }

  const currentItem = history[history.length - 1];
  const previousItem = history.length >= 2 ? history[history.length - 2] : null;

  const currentNetWorth = currentItem ? currentItem.netWorth : 0;
  const previousNetWorth = previousItem
    ? previousItem.netWorth
    : (settings.currentEmergencyFund || 0) + (settings.currentPortfolioValue || 0);

  const differenceNominal = currentNetWorth - previousNetWorth;
  const differencePercentage =
    previousNetWorth !== 0 ? (differenceNominal / Math.abs(previousNetWorth)) * 100 : 0;

  return {
    currentNetWorth,
    previousNetWorth,
    differenceNominal,
    differencePercentage,
    isPositive: differenceNominal >= 0,
    history,
  };
}

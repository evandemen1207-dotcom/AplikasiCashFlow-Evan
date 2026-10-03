export type TransactionType = 'income' | 'expense' | 'investment';

export type IncomeCategory = 'Gaji' | 'Usaha' | 'Bonus' | 'Lainnya';

export type ExpenseCategory =
  | 'Makanan & Minuman'
  | 'Transportasi'
  | 'Tagihan & Rutin'
  | 'Belanja & Gaya Hidup'
  | 'Hiburan'
  | 'Kesehatan'
  | 'Kebutuhan Pokok'
  | 'Tagihan'
  | 'Cicilan/Utang'
  | 'Pendidikan'
  | 'Lainnya';

export type InvestmentCategory =
  | 'Reksa Dana'
  | 'Saham'
  | 'Obligasi / SBN'
  | 'Emas'
  | 'Kripto'
  | 'Lainnya';

export type TransactionCategory = IncomeCategory | ExpenseCategory | InvestmentCategory;

export type ThemeMode = 'light' | 'dark' | 'system';

export interface NetWorthTrendItem {
  monthKey: string;      // "2026-07"
  monthLabel: string;    // "Jul '26"
  cashSavings: number;   // Akumulasi kas/tabungan
  investmentAssets: number; // Akumulasi aset investasi
  debt: number;          // Utang tercatat
  netWorth: number;      // Total Nilai Bersih
}

export interface NetWorthSummary {
  currentNetWorth: number;
  previousNetWorth: number;
  differenceNominal: number;
  differencePercentage: number;
  isPositive: boolean;
  history: NetWorthTrendItem[];
}

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  type: TransactionType;
  category: TransactionCategory;
  amount: number;
  note?: string;
  createdAt: string;
}

export type RiskProfile = 'konservatif' | 'moderat' | 'agresif';

export interface CategoryBudget {
  category: ExpenseCategory;
  monthlyBudget: number;
}

export interface EwsThresholds {
  expenseIncomeRatioWarning: number; // e.g. 70
  expenseIncomeRatioDanger: number;  // e.g. 90
  savingsRateWarning: number;        // e.g. 20 (bila < 20)
  savingsRateDanger: number;         // e.g. 10 (bila < 10)
  emergencyFundWarningMonths: number;// e.g. 6 (bila < 6)
  emergencyFundDangerMonths: number; // e.g. 3 (bila < 3)
  budgetUsageWarning: number;        // e.g. 80 (bila > 80%)
  budgetUsageDanger: number;         // e.g. 100 (bila > 100%)
  categorySurgePercentage: number;   // e.g. 20 (bila naik > 20% MoM)
  debtRatioWarning: number;          // e.g. 30 (bila > 30%)
  debtRatioDanger: number;           // e.g. 40 (bila > 40%)
}

export interface UserSettings {
  emergencyFundMonthsTarget: number;
  currentEmergencyFund: number;
  riskProfile: RiskProfile;
  monthlyInvestmentTarget: number;
  annualExpectedReturn: number; // e.g. 8%
  annualInflation: number;      // e.g. 4%
  currentPortfolioValue: number;
  categoryBudgets: Record<ExpenseCategory, number>;
  ewsThresholds: EwsThresholds;
}

export type EwsSeverity = 'aman' | 'waspada' | 'bahaya';

export interface EwsAlert {
  id: string;
  conditionKey: string;
  title: string;
  severity: EwsSeverity;
  cause: string;
  currentValue: string;
  thresholdValue: string;
  actionableAdvice: string;
  category?: string;
}

export type FilterPeriod = 'this_month' | '3_months' | '6_months' | 'this_year' | 'all';

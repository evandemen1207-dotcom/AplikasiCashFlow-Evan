import {
  Transaction,
  UserSettings,
  EwsAlert,
  EwsSeverity,
} from '../types';
import {
  CashFlowSummary,
  InvestmentCapacityResult,
  Rule50_30_20Analysis,
  EmergencyFundStatus,
} from '../utils/calculations';
import { formatRupiah, formatPercentage } from '../utils/formatters';

export interface FinancialSummaryTopKategori {
  nama: string;
  nominal: number;
  persen: number;
}

export interface FinancialSummary {
  currentMonthKey: string;
  totalPemasukan: number;
  totalPengeluaran: number;
  selisih: number;
  rasioPengeluaran: number;
  savingRate: number;
  topKategori: FinancialSummaryTopKategori[];
  perubahanVsBulanLalu: {
    pengeluaran: number;
    pemasukan: number;
  };
  rataPengeluaranBulanan: number;
  saldoTotal: number;
  bulanDanaDarurat: number;
  jumlahTransaksi: number;
}

export interface StrategicRecommendation {
  analisis: string;
  tindakan: string[];
  target: string;
  isFallback?: boolean;
}

// In-memory cache untuk mencegah pemanggilan ganda
const recommendationCache = new Map<string, StrategicRecommendation>();

export function getSummaryHash(summary: FinancialSummary): string {
  const topKatStr = summary.topKategori.map((k) => `${k.nama}:${k.nominal}`).join('|');
  return `${summary.currentMonthKey}_${summary.totalPemasukan}_${summary.totalPengeluaran}_${summary.jumlahTransaksi}_${summary.saldoTotal}_${topKatStr}`;
}

/**
 * 1) Fungsi buildFinancialSummary(transactions)
 * Murni menghitung seluruh angka statistik keuangan di kode (bukan oleh LLM).
 */
export function buildFinancialSummary(transactions: Transaction[]): FinancialSummary {
  const jumlahTransaksi = transactions.length;

  if (jumlahTransaksi === 0) {
    const currentMonthKey = new Date().toISOString().slice(0, 7);
    return {
      currentMonthKey,
      totalPemasukan: 0,
      totalPengeluaran: 0,
      selisih: 0,
      rasioPengeluaran: 0,
      savingRate: 0,
      topKategori: [],
      perubahanVsBulanLalu: { pengeluaran: 0, pemasukan: 0 },
      rataPengeluaranBulanan: 0,
      saldoTotal: 0,
      bulanDanaDarurat: 0,
      jumlahTransaksi: 0,
    };
  }

  // Tentukan bulan berjalan berdasarkan transaksi paling mutakhir
  const sortedByDateDesc = [...transactions].sort((a, b) => b.date.localeCompare(a.date));
  const currentMonthKey = sortedByDateDesc[0].date.slice(0, 7); // Format: "YYYY-MM"

  // Transaksi bulan berjalan
  const currentMonthTxs = transactions.filter((t) => t.date.slice(0, 7) === currentMonthKey);

  const totalPemasukan = currentMonthTxs
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalPengeluaran = currentMonthTxs
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const selisih = totalPemasukan - totalPengeluaran;

  // Tangani pembagian nol
  const rasioPengeluaran =
    totalPemasukan > 0
      ? totalPengeluaran / totalPemasukan
      : totalPengeluaran > 0
      ? 1
      : 0;

  const savingRate =
    totalPemasukan > 0
      ? (totalPemasukan - totalPengeluaran) / totalPemasukan
      : 0;

  // Top 3 kategori pengeluaran terbesar bulan berjalan
  const categoryMap: Record<string, number> = {};
  currentMonthTxs
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
    });

  const topKategori: FinancialSummaryTopKategori[] = Object.entries(categoryMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([nama, nominal]) => ({
      nama,
      nominal,
      persen: totalPengeluaran > 0 ? (nominal / totalPengeluaran) * 100 : 0,
    }));

  // Perubahan vs bulan lalu (kalender bulan sebelumnya)
  const [currYear, currMonth] = currentMonthKey.split('-').map(Number);
  const prevDate = new Date(currYear, currMonth - 2, 1);
  const prevMonthKey = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

  const prevMonthTxs = transactions.filter((t) => t.date.slice(0, 7) === prevMonthKey);
  const prevIncome = prevMonthTxs
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const prevExpense = prevMonthTxs
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const perubahanPengeluaran =
    prevExpense > 0 ? ((totalPengeluaran - prevExpense) / prevExpense) * 100 : 0;
  const perubahanPemasukan =
    prevIncome > 0 ? ((totalPemasukan - prevIncome) / prevIncome) * 100 : 0;

  // Rata-rata pengeluaran bulanan (beberapa bulan terakhir yang tersedia, maks 3)
  const monthExpenseMap: Record<string, number> = {};
  transactions
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      const mKey = t.date.slice(0, 7);
      monthExpenseMap[mKey] = (monthExpenseMap[mKey] || 0) + t.amount;
    });

  const sortedMonthKeys = Object.keys(monthExpenseMap).sort().reverse().slice(0, 3);
  const totalMonthsCount = Math.max(1, sortedMonthKeys.length);
  const sumRecentExpenses = sortedMonthKeys.reduce((sum, k) => sum + monthExpenseMap[k], 0);
  const rataPengeluaranBulanan = Math.round(sumRecentExpenses / totalMonthsCount);

  // Saldo akumulatif kas
  const totalAllIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalAllExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalAllInvestment = transactions
    .filter((t) => t.type === 'investment')
    .reduce((sum, t) => sum + t.amount, 0);

  const saldoTotal = totalAllIncome - totalAllExpense - totalAllInvestment;
  const bulanDanaDarurat =
    rataPengeluaranBulanan > 0
      ? Math.max(0, saldoTotal) / rataPengeluaranBulanan
      : 0;

  return {
    currentMonthKey,
    totalPemasukan,
    totalPengeluaran,
    selisih,
    rasioPengeluaran,
    savingRate,
    topKategori,
    perubahanVsBulanLalu: {
      pengeluaran: perubahanPengeluaran,
      pemasukan: perubahanPemasukan,
    },
    rataPengeluaranBulanan,
    saldoTotal,
    bulanDanaDarurat,
    jumlahTransaksi,
  };
}

/**
 * Fallback rule-based rekomendasi deterministik jika model AI tidak tersedia / respons tidak valid
 */
export function generateRuleBasedRecommendation(
  summary: FinancialSummary
): StrategicRecommendation {
  const {
    totalPemasukan,
    totalPengeluaran,
    selisih,
    rasioPengeluaran,
    savingRate,
    topKategori,
    bulanDanaDarurat,
    rataPengeluaranBulanan,
  } = summary;

  const top1 = topKategori[0] || { nama: 'Pengeluaran Umum', nominal: 0, persen: 0 };
  const savingRatePct = (savingRate * 100).toFixed(0);
  const rasioPengeluaranPct = (rasioPengeluaran * 100).toFixed(0);

  let analisis = '';
  if (rasioPengeluaran > 0.9) {
    analisis = `Rasio pengeluaran Anda saat ini mencapai ${rasioPengeluaranPct}% dari total pemasukan (${formatRupiah(totalPengeluaran)} dari ${formatRupiah(totalPemasukan)}), dengan beban terbesar pada pos ${top1.nama} sebesar ${formatRupiah(top1.nominal)}. Kondisi ini menyisakan ruang tabungan yang sangat tipis (${savingRatePct}%).`;
  } else if (bulanDanaDarurat < 3) {
    analisis = `Meskipun arus kas surplus ${formatRupiah(selisih)} dengan tingkat tabungan ${savingRatePct}%, cadangan dana darurat Anda baru mencukupi ${bulanDanaDarurat.toFixed(1)} bulan dari standar aman 3–6 bulan pengeluaran (${formatRupiah(rataPengeluaranBulanan)}/bulan).`;
  } else {
    analisis = `Kinerja keuangan Anda sehat dengan tingkat tabungan ${savingRatePct}% dan dana darurat telah mencakup ${bulanDanaDarurat.toFixed(1)} bulan pengeluaran. Pengeluaran terkonsentrasi pada ${top1.nama} sebesar ${formatRupiah(top1.nominal)} (${top1.persen.toFixed(0)}%).`;
  }

  const tindakan: string[] = [];
  if (bulanDanaDarurat < 3) {
    tindakan.push(
      `Prioritaskan 100% surplus bulanan (${formatRupiah(Math.max(0, selisih))}) ke instrumen kas likuid untuk mencapai batas aman minimal 3 bulan dana darurat.`
    );
    if (top1.nominal > 0) {
      tindakan.push(
        `Kendalikan pos ${top1.nama} dengan memotong 10% (hemat ${formatRupiah(Math.round(top1.nominal * 0.1))}) guna mempercepat akumulasi bantalan kas darurat.`
      );
    }
    tindakan.push(
      `Tunda alokasi aset investasi berisiko sampai cadangan dana darurat mencapai batas minimum 3 bulan pengeluaran.`
    );
  } else {
    tindakan.push(
      `Pertahankan batas aman dana darurat dan alokasikan 50–70% surplus bulanan (${formatRupiah(Math.round(Math.max(0, selisih) * 0.6))}) secara konsisten ke tabungan/investasi.`
    );
    if (top1.nominal > 0) {
      tindakan.push(
        `Jaga efisiensi pos ${top1.nama} maksimal ${formatRupiah(Math.round(top1.nominal * 0.9))} agar rasio pengeluaran pokok tetap berada di bawah 50%.`
      );
    }
    tindakan.push(
      `Lakukan evaluasi alokasi 50/30/20 di akhir setiap bulan untuk mencegah lonjakan pengeluaran diskresioner.`
    );
  }

  const target =
    bulanDanaDarurat < 3
      ? `Dalam 1–3 bulan, akumulasi surplus ${formatRupiah(Math.max(0, selisih) * 3)} diproyeksikan menambah ketahanan dana darurat hingga ${(bulanDanaDarurat + (rataPengeluaranBulanan > 0 ? (Math.max(0, selisih) * 3) / rataPengeluaranBulanan : 0)).toFixed(1)} bulan pengeluaran.`
      : `Dalam 1–3 bulan, disiplin alokasi surplus akan mengumpulkan tambahan akumulasi aset ${formatRupiah(Math.max(0, selisih) * 3)} dengan rasio pengeluaran stabil di bawah 70%.`;

  return {
    analisis,
    tindakan: tindakan.slice(0, 3),
    target,
    isFallback: true,
  };
}

/**
 * 2) Fungsi getAdvisorRecommendation(summary)
 * Mengirim ringkasan data finansial ke model Gemini via endpoint server /api/ai-advisor/recommendation.
 * Melakukan parsing aman, validasi skema, retry 1 kali bila gagal, dan fallback rule-based bila perlu.
 */
export async function getAdvisorRecommendation(
  summary: FinancialSummary,
  forceRefresh: boolean = false
): Promise<StrategicRecommendation> {
  const hash = getSummaryHash(summary);

  // Cek cache untuk menghindari panggilan ganda jika data tidak berubah
  if (!forceRefresh && recommendationCache.has(hash)) {
    return recommendationCache.get(hash)!;
  }

  // Fungsi internal untuk memanggil endpoint dan validasi skema
  const executeCall = async (): Promise<StrategicRecommendation | null> => {
    const response = await fetch('/api/ai-advisor/recommendation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ summary }),
    });

    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }

    const data = await response.json();
    if (data.usingFallback) {
      return null;
    }

    const rawText = data.text || '';
    // Bersihkan pagar markdown json jika ada
    const cleaned = rawText
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();

    const parsed = JSON.parse(cleaned);

    // Validasi bentuk skema
    if (
      typeof parsed.analisis === 'string' &&
      Array.isArray(parsed.tindakan) &&
      parsed.tindakan.length >= 2 &&
      typeof parsed.target === 'string'
    ) {
      return {
        analisis: parsed.analisis.trim(),
        tindakan: parsed.tindakan.slice(0, 3).map((t: string) => String(t).trim()),
        target: parsed.target.trim(),
        isFallback: false,
      };
    }

    return null;
  };

  try {
    // Percobaan 1
    const result1 = await executeCall();
    if (result1) {
      recommendationCache.set(hash, result1);
      return result1;
    }
  } catch (err) {
    console.warn('Percobaan pertama rekomendasi AI gagal, mencoba retry...', err);
  }

  try {
    // Retry sekali jika percobaan pertama gagal
    const result2 = await executeCall();
    if (result2) {
      recommendationCache.set(hash, result2);
      return result2;
    }
  } catch (err) {
    console.warn('Percobaan kedua rekomendasi AI gagal, beralih ke rule-based fallback:', err);
  }

  // Jika gagal parse / validasi / offline: gunakan fallback rule-based
  const fallback = generateRuleBasedRecommendation(summary);
  recommendationCache.set(hash, fallback);
  return fallback;
}

export interface AiFinancialReport {
  financialScore: number; // 0 - 100
  scoreCategory: 'Sangat Sehat' | 'Stabil' | 'Perlu Perhatian' | 'Kritis';
  executiveSummary: string;
  cashFlowAnalysis: string;
  spendingLeaks: string[];
  investmentStrategy: string;
  fireRecommendation: string;
  actionChecklist: {
    task: string;
    priority: 'high' | 'medium' | 'low';
    impact: string;
  }[];
  generatedAt: string;
}

export interface AiAdvisorInput {
  summary: CashFlowSummary;
  capacity: InvestmentCapacityResult;
  rule50_30_20: Rule50_30_20Analysis;
  emergencyFundStatus: EmergencyFundStatus;
  ewsStatus: EwsSeverity;
  alerts: EwsAlert[];
  transactions: Transaction[];
  settings: UserSettings;
  customQuestion?: string;
}

/**
 * Panggil AI Financial Advisor (via server API proxy Google Gemini atau engine analisa cerdas)
 */
export async function generateAiFinancialAdvice(
  input: AiAdvisorInput
): Promise<AiFinancialReport> {
  try {
    const response = await fetch('/api/ai-advisor', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    if (response.ok) {
      const data = await response.json();
      if (data && data.financialScore !== undefined) {
        return data as AiFinancialReport;
      }
    }
  } catch (err) {
    console.warn('Backend Gemini proxy unavailable, running local financial intelligence engine:', err);
  }

  return calculateLocalAiFinancialReport(input);
}

/**
 * Engine analisa finansial lokal presisi tinggi untuk fallback offline
 */
export function calculateLocalAiFinancialReport(
  input: AiAdvisorInput
): AiFinancialReport {
  const {
    summary,
    capacity,
    rule50_30_20,
    emergencyFundStatus,
    ewsStatus,
    alerts,
    settings,
  } = input;

  let score = 50;

  if (summary.savingsRate >= 30) score += 25;
  else if (summary.savingsRate >= 20) score += 20;
  else if (summary.savingsRate >= 10) score += 10;
  else score -= 15;

  if (emergencyFundStatus.fundedMonths >= settings.emergencyFundMonthsTarget) score += 25;
  else if (emergencyFundStatus.fundedMonths >= 3) score += 15;
  else score -= 10;

  if (ewsStatus === 'aman') score += 10;
  else if (ewsStatus === 'waspada') score -= 10;
  else if (ewsStatus === 'bahaya') score -= 25;

  if (rule50_30_20.needsPercent <= 50) score += 10;
  else if (rule50_30_20.needsPercent > 70) score -= 15;

  score = Math.max(10, Math.min(100, Math.round(score)));

  let scoreCategory: AiFinancialReport['scoreCategory'] = 'Stabil';
  if (score >= 80) scoreCategory = 'Sangat Sehat';
  else if (score >= 60) scoreCategory = 'Stabil';
  else if (score >= 40) scoreCategory = 'Perlu Perhatian';
  else scoreCategory = 'Kritis';

  let executiveSummary = '';
  if (score >= 80) {
    executiveSummary = `Pondasi keuangan Anda berada dalam kondisi prima dengan tingkat tabungan ${formatPercentage(summary.savingsRate)} dan surplus bulanan ${formatRupiah(summary.netCashFlow)}. Portofolio Anda siap diakselerasi menuju fase pertumbuhan kekayaan mandiri.`;
  } else if (score >= 60) {
    executiveSummary = `Arus kas Anda secara umum seimbang dengan surplus positif, namun masih terdapat pos pengeluaran yang dapat dioptimalkan untuk memperkuat bantalan dana darurat dan kapasitas investasi bulanan.`;
  } else {
    executiveSummary = `Terdeteksi tekanan pada arus kas Anda. Rasio pengeluaran wajib atau cicilan membutuhkan penataan ulang segera agar tidak membebani ketahanan finansial jangka menengah.`;
  }

  const cashFlowAnalysis = `Rata-rata pemasukan tercatat ${formatRupiah(summary.avgMonthlyIncome)}/bulan dengan beban pengeluaran ${formatRupiah(summary.avgMonthlyExpense)}/bulan. Realisasi acuan 50/30/20 menunjukkan pos Kebutuhan memakan ${formatPercentage(rule50_30_20.needsPercent)} (target maks 50%), Keinginan ${formatPercentage(rule50_30_20.wantsPercent)} (target maks 30%), dan Tabungan/Investasi ${formatPercentage(rule50_30_20.savingsPercent)} (target min 20%).`;

  const spendingLeaks: string[] = [];
  if (rule50_30_20.wantsPercent > 30) {
    spendingLeaks.push(
      `Pengeluaran gaya hidup & hiburan (${formatPercentage(rule50_30_20.wantsPercent)}) melampaui batas acuan 30% dari penghasilan bulanan.`
    );
  }

  alerts.forEach((alert) => {
    if (alert.conditionKey.startsWith('budget_')) {
      spendingLeaks.push(`Pos ${alert.category || 'kategori'}: ${alert.cause}`);
    } else if (alert.conditionKey.startsWith('surge_')) {
      spendingLeaks.push(`Lonjakan MoM: ${alert.title} — ${alert.cause}`);
    }
  });

  if (spendingLeaks.length === 0) {
    spendingLeaks.push(
      'Tidak ditemukan kebocoran anggaran signifikan pada bulan evaluasi ini. Pertahankan disiplin pencatatan transaksi!'
    );
  }

  const investmentStrategy = `Dengan kapasitas investasi ${formatRupiah(capacity.investmentCapacity)}/bulan dan profil risiko ${settings.riskProfile.toUpperCase()}, alokasi ideal Anda mencakup instrumen pasar uang untuk likuiditas taktis, SBN/obligasi untuk pendapatan berkala, serta reksa dana indeks saham untuk memaksimalkan compounding.`;

  const fireRecommendation = `Target 25x pengeluaran tahunan membutuhkan akumulasi konsisten. Dengan surplus saat ini dan asumsi return riil ${settings.annualExpectedReturn - settings.annualInflation}% di atas inflasi, percepatan kontribusi otomatis di awal bulan (pay-yourself-first) akan mempersingkat waktu pencapaian kebebasan finansial.`;

  const actionChecklist: AiFinancialReport['actionChecklist'] = [];

  if (emergencyFundStatus.deficit > 0) {
    actionChecklist.push({
      task: `Alokasikan minimal ${formatRupiah(Math.min(capacity.monthlyIncome * 0.15, emergencyFundStatus.deficit / 6))}/bulan ke reksa dana pasar uang hingga target dana darurat ${emergencyFundStatus.targetMonths} bulan terpenuhi.`,
      priority: 'high',
      impact: 'Mencegah pencairan darurat aset investasi saat terjadi risiko tak terduga.',
    });
  }

  if (rule50_30_20.wantsPercent > 30) {
    actionChecklist.push({
      task: 'Batasi frekuensi nongkrong dan langganan digital berulang maksimal 15-20% dari total pengeluaran.',
      priority: 'medium',
      impact: `Menyelamatkan potensi kas surplus hingga ${formatRupiah(summary.avgMonthlyIncome * 0.05)} setiap bulan.`,
    });
  }

  actionChecklist.push({
    task: `Aktifkan autodebet investasi rutin ${formatRupiah(capacity.investmentCapacity > 0 ? capacity.investmentCapacity : settings.monthlyInvestmentTarget)} tepat pada hari gajian (H+1).`,
    priority: 'high',
    impact: 'Menghilangkan godaan membelanjakan uang sisa di akhir bulan.',
  });

  actionChecklist.push({
    task: 'Lakukan tinjauan mingguan pada Early Warning System (EWS) untuk memastikan tidak ada pos belanja yang overbudget.',
    priority: 'low',
    impact: 'Menjaga kepatuhan rencana anggaran keluarga secara berkesinambungan.',
  });

  return {
    financialScore: score,
    scoreCategory,
    executiveSummary,
    cashFlowAnalysis,
    spendingLeaks,
    investmentStrategy,
    fireRecommendation,
    actionChecklist,
    generatedAt: new Date().toISOString(),
  };
}

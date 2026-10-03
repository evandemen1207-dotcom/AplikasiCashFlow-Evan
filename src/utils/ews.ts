import {
  Transaction,
  UserSettings,
  EwsAlert,
  EwsSeverity,
} from '../types';
import { formatPercentage, formatRupiah } from './formatters';
import {
  FinancialSummary,
  buildFinancialSummary,
} from '../services/aiAdvisor';

export type EwsIndicatorStatus = 'AMAN' | 'WASPADA' | 'BAHAYA' | 'NETRAL';
export type EwsOverallStatus = 'AMAN' | 'WASPADA' | 'BAHAYA' | 'Data belum cukup';

export interface EwsIndicator {
  nama: string;
  nilai: string;
  ambang: string;
  status: EwsIndicatorStatus;
  persentase: number; // 0 - 100 untuk progress bar
}

export interface RedesignedEwsResult {
  status: EwsOverallStatus;
  ringkasan: string;
  daftarIndikator: EwsIndicator[];
  penyebabUtama: string;
  saranCepat: string;
  detailPeringatan: string[];

  // Backward compatibility fields so existing components don't break
  overallStatus: EwsSeverity;
  statusBadgeText: string;
  statusHeadline: string;
  alerts: EwsAlert[];
  metricsSnapshot?: {
    latestExpenseIncomeRatio: number;
    latestSavingsRate: number;
    emergencyFundMonths: number;
    debtToIncomeRatio: number;
    negativeMonthsStreak: number;
    investmentAchievementRatio: number;
  };
}

export type EwsEvaluationResult = RedesignedEwsResult;

// Ambang batas Early Warning System (konstanta terpisah agar mudah dikonfigurasi)
export const EWS_THRESHOLDS = {
  // Rasio pengeluaran/pemasukan: < 70% AMAN, 70-90% WASPADA, > 90% BAHAYA
  expenseRatio: {
    safeMax: 70,
    warningMax: 90,
  },
  // Dana darurat: >= 3 bulan AMAN, 1-3 WASPADA, < 1 BAHAYA
  emergencyFundMonths: {
    safeMin: 3,
    dangerMin: 1,
  },
  // Porsi pengeluaran kategori terbesar
  topCategoryRatio: {
    safeMax: 35,
    warningMax: 50,
  },
};

/**
 * Fungsi murni evaluateEWS(summary)
 * Mengevaluasi kesehatan keuangan berdasarkan indikator risiko utama
 */
export function evaluateEWS(
  summaryOrTransactions: FinancialSummary | Transaction[],
  settings?: UserSettings
): RedesignedEwsResult {
  const summary: FinancialSummary = Array.isArray(summaryOrTransactions)
    ? buildFinancialSummary(summaryOrTransactions)
    : summaryOrTransactions;

  // Kasus jika transaksi terlalu sedikit (< 5): status "Data belum cukup", netral tanpa peringatan merah
  if (summary.jumlahTransaksi < 5) {
    const defaultIndicators: EwsIndicator[] = [
      {
        nama: 'Rasio Pengeluaran',
        nilai: `${Math.round(summary.rasioPengeluaran * 100)}%`,
        ambang: '< 70% AMAN · 70–90% WASPADA · > 90% BAHAYA',
        status: 'NETRAL',
        persentase: Math.min(100, Math.round(summary.rasioPengeluaran * 100)),
      },
      {
        nama: 'Dana Darurat',
        nilai: `${summary.bulanDanaDarurat.toFixed(1)} Bulan`,
        ambang: '≥ 3 Bulan AMAN · 1–3 Bulan WASPADA · < 1 Bulan BAHAYA',
        status: 'NETRAL',
        persentase: Math.min(100, Math.round((summary.bulanDanaDarurat / 6) * 100)),
      },
      {
        nama: 'Beban Belanja Terbesar',
        nilai: summary.topKategori[0]
          ? `${summary.topKategori[0].nama} (${summary.topKategori[0].persen.toFixed(0)}%)`
          : 'Belum Ada Data',
        ambang: '< 35% Sehat · 35–50% Waspada · > 50% Dominan',
        status: 'NETRAL',
        persentase: summary.topKategori[0] ? Math.round(summary.topKategori[0].persen) : 0,
      },
    ];

    return {
      status: 'Data belum cukup',
      ringkasan: `Data transaksi belum memadai (tercatat ${summary.jumlahTransaksi} transaksi). Catat minimal 5 transaksi untuk evaluasi risiko otomatis.`,
      daftarIndikator: defaultIndicators,
      penyebabUtama: `Jumlah transaksi saat ini (${summary.jumlahTransaksi}) belum memenuhi syarat batas minimum 5 transaksi.`,
      saranCepat: 'Catat minimal 5 transaksi untuk mengaktifkan pemantauan Early Warning System (EWS).',
      detailPeringatan: [
        'Sistem membutuhkan minimal 5 transaksi untuk mengevaluasi parameter risiko keuangan secara objektif.',
      ],
      overallStatus: 'aman',
      statusBadgeText: 'Data belum cukup',
      statusHeadline: `Data transaksi belum memadai (${summary.jumlahTransaksi}/5 transaksi).`,
      alerts: [],
      metricsSnapshot: {
        latestExpenseIncomeRatio: summary.rasioPengeluaran * 100,
        latestSavingsRate: summary.savingRate * 100,
        emergencyFundMonths: summary.bulanDanaDarurat,
        debtToIncomeRatio: 0,
        negativeMonthsStreak: 0,
        investmentAchievementRatio: 100,
      },
    };
  }

  // 1. Evaluasi Indikator 1: Rasio Pengeluaran / Pemasukan
  // < 70% AMAN, 70-90% WASPADA, > 90% BAHAYA
  const expenseRatioPct = Math.round(summary.rasioPengeluaran * 100);
  let statusExpenseRatio: EwsIndicatorStatus = 'AMAN';
  if (expenseRatioPct > EWS_THRESHOLDS.expenseRatio.warningMax) {
    statusExpenseRatio = 'BAHAYA';
  } else if (expenseRatioPct >= EWS_THRESHOLDS.expenseRatio.safeMax) {
    statusExpenseRatio = 'WASPADA';
  }

  // 2. Evaluasi Indikator 2: Dana Darurat
  // >= 3 bulan AMAN, 1-3 WASPADA, < 1 BAHAYA
  const efMonths = summary.bulanDanaDarurat;
  let statusEmergencyFund: EwsIndicatorStatus = 'AMAN';
  if (efMonths < EWS_THRESHOLDS.emergencyFundMonths.dangerMin) {
    statusEmergencyFund = 'BAHAYA';
  } else if (efMonths < EWS_THRESHOLDS.emergencyFundMonths.safeMin) {
    statusEmergencyFund = 'WASPADA';
  }

  // 3. Evaluasi Indikator 3: Beban Pengeluaran Terbesar
  const top1 = summary.topKategori[0] || { nama: 'Pengeluaran Umum', nominal: 0, persen: 0 };
  let statusTopCategory: EwsIndicatorStatus = 'AMAN';
  if (top1.persen > EWS_THRESHOLDS.topCategoryRatio.warningMax) {
    statusTopCategory = 'BAHAYA';
  } else if (top1.persen >= EWS_THRESHOLDS.topCategoryRatio.safeMax) {
    statusTopCategory = 'WASPADA';
  }

  // Daftar Indikator terstruktur
  const daftarIndikator: EwsIndicator[] = [
    {
      nama: 'Rasio Pengeluaran',
      nilai: `${expenseRatioPct}%`,
      ambang: '< 70% AMAN · 70–90% WASPADA · > 90% BAHAYA',
      status: statusExpenseRatio,
      persentase: Math.min(100, Math.max(0, expenseRatioPct)),
    },
    {
      nama: 'Dana Darurat',
      nilai: `${efMonths.toFixed(1)} Bulan`,
      ambang: '≥ 3 Bulan AMAN · 1–3 Bulan WASPADA · < 1 Bulan BAHAYA',
      status: statusEmergencyFund,
      persentase: Math.min(100, Math.round((efMonths / 6) * 100)),
    },
    {
      nama: 'Beban Belanja Terbesar',
      nilai: `${top1.nama} (${top1.persen.toFixed(0)}%)`,
      ambang: '< 35% Sehat · 35–50% Waspada · > 50% Dominan',
      status: statusTopCategory,
      persentase: Math.min(100, Math.round(top1.persen)),
    },
  ];

  // Status keseluruhan = yang terburuk dari semua indikator
  const allStatuses = [statusExpenseRatio, statusEmergencyFund, statusTopCategory];
  let overallStatus: EwsOverallStatus = 'AMAN';
  if (allStatuses.includes('BAHAYA')) {
    overallStatus = 'BAHAYA';
  } else if (allStatuses.includes('WASPADA')) {
    overallStatus = 'WASPADA';
  }

  // Tentukan Penyebab Utama (indikator terburuk, satu baris)
  let penyebabUtama = '';
  if (statusExpenseRatio === 'BAHAYA') {
    penyebabUtama = `Pengeluaran bulan berjalan menyerap ${expenseRatioPct}% dari total pemasukan (${formatRupiah(summary.totalPengeluaran)} dari ${formatRupiah(summary.totalPemasukan)}).`;
  } else if (statusEmergencyFund === 'BAHAYA') {
    penyebabUtama = `Cadangan kas likuid hanya mencukupi ${efMonths.toFixed(1)} bulan pengeluaran (di bawah batas kritis 1 bulan).`;
  } else if (statusTopCategory === 'BAHAYA') {
    penyebabUtama = `Pos belanja '${top1.nama}' sangat mendominasi dengan menyerap ${top1.persen.toFixed(0)}% dari total pengeluaran bulanan.`;
  } else if (statusExpenseRatio === 'WASPADA') {
    penyebabUtama = `Rasio pengeluaran berada di level waspada (${expenseRatioPct}%), mendekati batas kritis 90%.`;
  } else if (statusEmergencyFund === 'WASPADA') {
    penyebabUtama = `Bantalan dana darurat baru mencapai ${efMonths.toFixed(1)} bulan pengeluaran (disarankan minimal 3 bulan).`;
  } else if (statusTopCategory === 'WASPADA') {
    penyebabUtama = `Pos '${top1.nama}' memakan porsi cukup signifikan (${top1.persen.toFixed(0)}% dari total pengeluaran).`;
  } else {
    penyebabUtama = 'Seluruh indikator arus kas, cadangan dana darurat, dan alokasi berada dalam zona aman.';
  }

  // Tentukan Saran Cepat (satu kalimat tindakan paling berdampak)
  let saranCepat = '';
  if (statusExpenseRatio === 'BAHAYA') {
    saranCepat = 'Segera batasi pos non-esensial dan tunda belanja sekunder hingga rasio pengeluaran kembali di bawah 70%.';
  } else if (statusEmergencyFund === 'BAHAYA') {
    saranCepat = 'Alokasikan 100% sisa surplus kas ke rekening likuid untuk mengejar batas aman minimal 3 bulan dana darurat.';
  } else if (statusTopCategory === 'BAHAYA' || statusTopCategory === 'WASPADA') {
    saranCepat = `Lakukan efisiensi pada pos '${top1.nama}' guna memulihkan ruang tabungan bulanan.`;
  } else if (statusExpenseRatio === 'WASPADA') {
    saranCepat = 'Kendalikan belanja diskresioner agar porsi tabungan tetap berada di atas 20%.';
  } else if (statusEmergencyFund === 'WASPADA') {
    saranCepat = 'Prioritaskan surplus bulanan untuk menambah bantalan kas darurat hingga mencapai minimal 3 bulan pengeluaran.';
  } else {
    saranCepat = 'Pertahankan disiplin anggaran dan alokasikan kelebihan surplus bulanan ke instrumen investasi rutin.';
  }

  // Ringkasan 1 kalimat
  let ringkasan = '';
  if (overallStatus === 'BAHAYA') {
    ringkasan = 'Peringatan risiko tinggi: Terdeteksi tekanan likuiditas atau pengeluaran berlebih yang memerlukan tindakan segera.';
  } else if (overallStatus === 'WASPADA') {
    ringkasan = 'Kondisi keuangan memerlukan kehati-hatian: Beberapa indikator mendekati ambang batas toleransi risiko.';
  } else {
    ringkasan = 'Kondisi keuangan sehat: Arus kas surplus dan cadangan kas berada dalam parameter aman.';
  }

  // Detail peringatan: array baris; satu penyebab = satu baris, tanpa duplikasi
  const detailPeringatan: string[] = [];
  if (statusExpenseRatio === 'BAHAYA') {
    detailPeringatan.push(
      `[Rasio Pengeluaran] Pengeluaran menyerap ${expenseRatioPct}% pemasukan (ambang bahaya > 90%).`
    );
  } else if (statusExpenseRatio === 'WASPADA') {
    detailPeringatan.push(
      `[Rasio Pengeluaran] Pengeluaran mencapai ${expenseRatioPct}% pemasukan (ambang waspada 70–90%).`
    );
  }

  if (statusEmergencyFund === 'BAHAYA') {
    detailPeringatan.push(
      `[Dana Darurat] Cadangan kas likuid hanya bertahan ${efMonths.toFixed(1)} bulan (ambang kritis < 1 bulan).`
    );
  } else if (statusEmergencyFund === 'WASPADA') {
    detailPeringatan.push(
      `[Dana Darurat] Cadangan kas likuid bertahan ${efMonths.toFixed(1)} bulan (ambang waspada 1–3 bulan).`
    );
  }

  if (statusTopCategory === 'BAHAYA') {
    detailPeringatan.push(
      `[Konsentrasi Beban] Pos '${top1.nama}' mendominasi ${top1.persen.toFixed(0)}% pengeluaran (${formatRupiah(top1.nominal)}).`
    );
  } else if (statusTopCategory === 'WASPADA') {
    detailPeringatan.push(
      `[Konsentrasi Beban] Pos '${top1.nama}' menyerap ${top1.persen.toFixed(0)}% pengeluaran (${formatRupiah(top1.nominal)}).`
    );
  }

  if (detailPeringatan.length === 0) {
    detailPeringatan.push('Semua indikator arus kas dan bantalan dana darurat memenuhi standar kesehatan finansial.');
  }

  // Backward compatibility fields
  const mappedSeverity: EwsSeverity =
    overallStatus === 'BAHAYA' ? 'bahaya' : overallStatus === 'WASPADA' ? 'waspada' : 'aman';

  const alerts: EwsAlert[] = detailPeringatan.map((text, i) => ({
    id: `ews-alert-${i}-${summary.currentMonthKey}`,
    conditionKey: `risk_${i}`,
    title: text.split(']')[0]?.replace('[', '') || 'Peringatan EWS',
    severity: mappedSeverity,
    cause: text,
    currentValue: `${expenseRatioPct}%`,
    thresholdValue: '< 70%',
    actionableAdvice: saranCepat,
  }));

  return {
    status: overallStatus,
    ringkasan,
    daftarIndikator,
    penyebabUtama,
    saranCepat,
    detailPeringatan,
    overallStatus: mappedSeverity,
    statusBadgeText: overallStatus,
    statusHeadline: ringkasan,
    alerts,
    metricsSnapshot: {
      latestExpenseIncomeRatio: expenseRatioPct,
      latestSavingsRate: summary.savingRate * 100,
      emergencyFundMonths: efMonths,
      debtToIncomeRatio: 0,
      negativeMonthsStreak: 0,
      investmentAchievementRatio: 100,
    },
  };
}

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transaction, UserSettings, ExpenseCategory } from '../types';
import {
  formatRupiah,
  formatPercentage,
  formatDateIndo,
  formatMonthYearIndo,
} from './formatters';
import { calculateNetWorthTrends } from './calculations';

export interface MonthlyReportData {
  monthKey: string; // YYYY-MM
  monthName: string; // "September 2026"
  incomeTotal: number;
  expenseTotal: number;
  investmentTotal: number;
  netCashFlow: number;
  savingsRate: number;
  endingNetWorth: number;
  categoryExpenses: {
    category: ExpenseCategory;
    total: number;
    percentage: number;
    budget?: number;
    budgetRatio?: number;
  }[];
  transactions: Transaction[];
}

export function generateMonthlyPDF(
  reportData: MonthlyReportData,
  settings: UserSettings
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const {
    monthKey,
    monthName,
    incomeTotal,
    expenseTotal,
    investmentTotal,
    netCashFlow,
    savingsRate,
    endingNetWorth,
    categoryExpenses,
    transactions,
  } = reportData;

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // === 1. HEADER DOKUMEN ===
  // Primary brand bar
  doc.setFillColor(79, 70, 229); // Indigo 600
  doc.rect(0, 0, pageWidth, 18, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('CASH FLOW PRIBADI', 14, 12);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Laporan Keuangan & Arus Kas Bulanan', pageWidth - 14, 12, { align: 'right' });

  // Judul Laporan
  doc.setTextColor(15, 23, 42); // Slate 900
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(`Laporan Cash Flow – ${monthName}`, 14, 30);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Diekspor pada: ${new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })} WIB`,
    14,
    36
  );

  // === 2. RINGKASAN METRIK KINERJA (BOXES) ===
  let currentY = 42;
  const colWidth = (pageWidth - 28 - 10) / 3; // 3 kolom
  const boxHeight = 18;

  const summaryBoxes = [
    { label: 'Total Pemasukan', val: formatRupiah(incomeTotal), color: [16, 185, 129] }, // Green
    { label: 'Total Pengeluaran', val: formatRupiah(expenseTotal), color: [239, 68, 68] }, // Red
    { label: 'Total Investasi', val: formatRupiah(investmentTotal), color: [59, 130, 246] }, // Blue
    {
      label: 'Arus Kas Bersih',
      val: formatRupiah(netCashFlow),
      color: netCashFlow >= 0 ? [16, 185, 129] : [239, 68, 68],
    },
    { label: 'Savings Rate', val: formatPercentage(savingsRate), color: [79, 70, 229] },
    { label: 'Nilai Bersih Akhir Bulan', val: formatRupiah(endingNetWorth), color: [79, 70, 229] },
  ];

  summaryBoxes.forEach((item, index) => {
    const row = Math.floor(index / 3);
    const col = index % 3;
    const x = 14 + col * (colWidth + 5);
    const y = currentY + row * (boxHeight + 4);

    // Box background
    doc.setFillColor(248, 250, 252); // Slate 50
    doc.setDrawColor(226, 232, 240); // Slate 200
    doc.roundedRect(x, y, colWidth, boxHeight, 2, 2, 'FD');

    // Left accent bar
    doc.setFillColor(item.color[0], item.color[1], item.color[2]);
    doc.rect(x, y, 2.5, boxHeight, 'F');

    // Label
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(item.label, x + 5, y + 6);

    // Value
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(item.val, x + 5, y + 13);
  });

  currentY += boxHeight * 2 + 12;

  // === 3. TABEL PENGELUARAN PER KATEGORI ===
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Distribusi Pengeluaran per Kategori', 14, currentY);
  currentY += 4;

  const categoryRows = categoryExpenses
    .filter((c) => c.total > 0)
    .map((c) => [c.category, formatPercentage(c.percentage), formatRupiah(c.total)]);

  if (categoryRows.length === 0) {
    categoryRows.push(['Tidak ada pengeluaran di bulan ini', '-', 'Rp 0']);
  }

  autoTable(doc, {
    startY: currentY,
    head: [['Kategori Pengeluaran', 'Porsi (%)', 'Nominal']],
    body: categoryRows,
    theme: 'striped',
    headStyles: {
      fillColor: [79, 70, 229], // Indigo 600
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    styles: {
      fontSize: 8.5,
      textColor: [15, 23, 42],
      cellPadding: 2.5,
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { halign: 'center', cellWidth: 35 },
      2: { halign: 'right', cellWidth: 50, fontStyle: 'bold' },
    },
    margin: { left: 14, right: 14 },
  });

  // @ts-ignore
  currentY = doc.lastAutoTable.finalY + 10;

  // Check if we need page break before transaction table
  if (currentY > pageHeight - 60) {
    doc.addPage();
    currentY = 20;
  }

  // === 4. TABEL SELURUH TRANSAKSI BULAN TERSEBUT ===
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Rincian Seluruh Transaksi', 14, currentY);
  currentY += 4;

  const sortedTransactions = [...transactions].sort((a, b) => a.date.localeCompare(b.date));

  const transactionRows = sortedTransactions.map((tx) => {
    let typeLabel = 'Pengeluaran';
    if (tx.type === 'income') typeLabel = 'Pemasukan';
    if (tx.type === 'investment') typeLabel = 'Investasi';

    const formattedAmount =
      tx.type === 'income'
        ? `+${formatRupiah(tx.amount)}`
        : tx.type === 'investment'
        ? formatRupiah(tx.amount)
        : `-${formatRupiah(tx.amount)}`;

    return [
      formatDateIndo(tx.date),
      typeLabel,
      tx.category,
      tx.note || '-',
      formattedAmount,
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: [['Tanggal', 'Jenis', 'Kategori', 'Catatan', 'Nominal (Rp)']],
    body: transactionRows,
    foot: [
      [
        'Total Arus Kas Masuk & Keluar',
        '',
        '',
        `Pemasukan: ${formatRupiah(incomeTotal)} | Pengeluaran: ${formatRupiah(expenseTotal)}`,
        `Net: ${formatRupiah(netCashFlow)}`,
      ],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [79, 70, 229], // Indigo 600
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    footStyles: {
      fillColor: [241, 245, 249], // Slate 100
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    styles: {
      fontSize: 8,
      textColor: [15, 23, 42],
      cellPadding: 2.2,
    },
    columnStyles: {
      0: { cellWidth: 26 },
      1: { cellWidth: 24, halign: 'center' },
      2: { cellWidth: 32 },
      3: { cellWidth: 'auto' },
      4: { cellWidth: 38, halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: 14, right: 14, bottom: 20 },
  });

  // === 5. FOOTER & PENOMORAN HALAMAN DI SETIAP HALAMAN ===
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Separator line
    doc.setDrawColor(226, 232, 240);
    doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);

    // Footer text
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184); // Slate 400

    doc.text('Evan · dermanevan@gmail.com', 14, pageHeight - 7);
    doc.text(`Halaman ${i} dari ${totalPages}`, pageWidth - 14, pageHeight - 7, {
      align: 'right',
    });
  }

  // Simpan file PDF dengan format cashflow-YYYY-MM.pdf
  doc.save(`cashflow-${monthKey}.pdf`);
}

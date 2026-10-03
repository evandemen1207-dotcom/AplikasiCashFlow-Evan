/**
 * Format angka ke format Rupiah standar Indonesia:
 * Contoh: Rp 1.500.000 atau -Rp 500.000
 */
export function formatRupiah(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return 'Rp 0';
  }

  const isNegative = amount < 0;
  const absAmount = Math.round(Math.abs(amount));
  const formatted = absAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  return isNegative ? `-Rp ${formatted}` : `Rp ${formatted}`;
}

/**
 * Format persentase dengan 1 desimal
 * Contoh: 24,5%
 */
export function formatPercentage(value: number): string {
  if (isNaN(value) || value === null || value === undefined) {
    return '0%';
  }
  return `${value.toFixed(1).replace('.', ',')}%`;
}

/**
 * Format tanggal YYYY-MM-DD ke Bahasa Indonesia
 * Contoh: 25 Sep 2026
 */
export function formatDateIndo(dateStr: string): string {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;

  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'
  ];

  return `${day} ${monthNames[monthIdx] || parts[1]} ${year}`;
}

/**
 * Dapatkan nama bulan & tahun Indonesia dari YYYY-MM
 * Contoh: "September 2026"
 */
export function formatMonthYearIndo(yearMonthStr: string): string {
  if (!yearMonthStr) return '-';
  const parts = yearMonthStr.split('-');
  if (parts.length < 2) return yearMonthStr;

  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;

  const fullMonthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  return `${fullMonthNames[monthIdx] || parts[1]} ${year}`;
}

/**
 * Parse input string Rupiah ke angka
 * Misal "Rp 1.500.000" atau "1.500.000" -> 1500000
 */
export function parseRupiahInput(value: string): number {
  if (!value) return 0;
  const cleaned = value.replace(/[^0-9]/g, '');
  const parsed = parseInt(cleaned, 10);
  return isNaN(parsed) ? 0 : parsed;
}

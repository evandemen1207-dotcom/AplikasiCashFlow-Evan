/**
 * Helper murni untuk auto-kategorisasi transaksi pengeluaran berdasarkan catatan / keterangan
 */

export const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'Makanan & Minuman': [
    'kopi',
    'makan',
    'resto',
    'warmindo',
    'sate',
    'bakso',
    'mie',
    'cafe',
    'snack',
  ],
  'Transportasi': [
    'bensin',
    'pertalite',
    'pertamax',
    'gojek',
    'grab',
    'parkir',
    'tol',
    'servis',
    'cuci',
  ],
  'Tagihan & Rutin': [
    'listrik',
    'pln',
    'air',
    'pdam',
    'wifi',
    'indihome',
    'pulsa',
    'kuota',
    'sewa',
    'kos',
  ],
  'Belanja & Gaya Hidup': [
    'shopee',
    'tokopedia',
    'baju',
    'sepatu',
    'skincare',
    'indomaret',
    'alfamart',
  ],
  'Hiburan': [
    'bioskop',
    'xxi',
    'cgv',
    'game',
    'steam',
    'spotify',
    'netflix',
  ],
  'Kesehatan': [
    'obat',
    'apotek',
    'dokter',
    'vitamin',
    'gym',
  ],
};

// Urutan prioritas jika posisi kata kunci seri (tie-break):
// Tagihan & Rutin > Transportasi > Kesehatan > Makanan & Minuman > Belanja & Gaya Hidup > Hiburan
export const CATEGORY_PRIORITY: string[] = [
  'Tagihan & Rutin',
  'Transportasi',
  'Kesehatan',
  'Makanan & Minuman',
  'Belanja & Gaya Hidup',
  'Hiburan',
];

/**
 * Mendeteksi kategori pengeluaran berdasarkan teks catatan.
 * - Normalisasi: lowercase, trim, hapus tanda baca, pecah menjadi token kata.
 * - Cocok per kata utuh (bukan substring), agar "kos" tidak cocok dengan "kosong".
 * - Memilih kategori yang kata kuncinya muncul paling awal.
 * - Jika seri, gunakan urutan prioritas.
 * - Jika tidak ada yang cocok, kembalikan null.
 */
export function detectCategory(note: string): string | null {
  if (!note || typeof note !== 'string') return null;

  // 1. Normalisasi: lowercase, trim, hapus tanda baca menjadi spasi
  const normalized = note
    .toLowerCase()
    .trim()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'’]/g, ' ');

  // 2. Pecah menjadi token kata utuh
  const tokens = normalized.split(/\s+/).filter((token) => token.length > 0);
  if (tokens.length === 0) return null;

  // 3. Cari kemunculan kata kunci untuk setiap kategori
  interface CategoryMatch {
    category: string;
    earliestIndex: number;
    priorityIndex: number;
  }

  const matches: CategoryMatch[] = [];

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    // Buat Set kata kunci untuk pencocokan cepat
    const keywordSet = new Set(keywords);
    let earliest = -1;

    for (let i = 0; i < tokens.length; i++) {
      if (keywordSet.has(tokens[i])) {
        earliest = i;
        break; // Ditemukan kemunculan paling awal untuk kategori ini
      }
    }

    if (earliest !== -1) {
      const priorityIdx = CATEGORY_PRIORITY.indexOf(category);
      matches.push({
        category,
        earliestIndex: earliest,
        priorityIndex: priorityIdx !== -1 ? priorityIdx : 999,
      });
    }
  }

  if (matches.length === 0) return null;

  // 4. Urutkan berdasarkan kemunculan paling awal (earliestIndex terkecil),
  // jika seri gunakan urutan prioritas (priorityIndex terkecil)
  matches.sort((a, b) => {
    if (a.earliestIndex !== b.earliestIndex) {
      return a.earliestIndex - b.earliestIndex;
    }
    return a.priorityIndex - b.priorityIndex;
  });

  return matches[0].category;
}

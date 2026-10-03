import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// API: AI Financial Advisor menggunakan Google Gemini API
app.post('/api/ai-advisor', async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(200).json({
        usingFallback: true,
        message: 'No GEMINI_API_KEY configured, using local advisor engine.',
      });
    }

    const {
      summary,
      capacity,
      rule50_30_20,
      emergencyFundStatus,
      ewsStatus,
      alerts,
      settings,
      customQuestion,
    } = req.body;

    const ai = new GoogleGenAI({});

    const systemInstruction = `Anda adalah seorang Perencana Keuangan Bersertifikat (Certified Financial Planner / CFP) dan FinTech Advisor profesional berbahasa Indonesia.
Tugas Anda adalah menganalisis data arus kas, rasio keuangan 50/30/20, dana darurat, kapasitas investasi, dan indikator Early Warning System (EWS) dari pengguna, lalu menghasilkan laporan rekomendasi finansial yang ramah, objektif, dan sangat terukur dalam format JSON.`;

    const prompt = `Analisis data finansial pengguna berikut:
1. Pemasukan bulanan rata-rata: Rp ${summary?.avgMonthlyIncome || 0}
2. Pengeluaran bulanan rata-rata: Rp ${summary?.avgMonthlyExpense || 0}
3. Arus kas bersih (surplus/defisit): Rp ${summary?.netCashFlow || 0}
4. Savings rate: ${summary?.savingsRate?.toFixed(1) || 0}%
5. Realisasi 50/30/20: Kebutuhan ${rule50_30_20?.needsPercent?.toFixed(1) || 0}%, Keinginan ${rule50_30_20?.wantsPercent?.toFixed(1) || 0}%, Tabungan ${rule50_30_20?.savingsPercent?.toFixed(1) || 0}%
6. Dana darurat saat ini: ${emergencyFundStatus?.fundedMonths?.toFixed(1) || 0} bulan dari target ${settings?.emergencyFundMonthsTarget || 6} bulan
7. Status Early Warning System (EWS): ${ewsStatus} dengan ${alerts?.length || 0} peringatan aktif: ${JSON.stringify(alerts?.map((a: any) => a.title) || [])}
8. Kapasitas investasi bulanan: Rp ${capacity?.investmentCapacity || 0}
9. Profil risiko investor: ${settings?.riskProfile || 'moderat'}
${customQuestion ? `Pertanyaan khusus pengguna: "${customQuestion}"` : ''}

Hasilkan JSON dengan properti persis:
{
  "financialScore": <angka 0-100>,
  "scoreCategory": <"Sangat Sehat" | "Stabil" | "Perlu Perhatian" | "Kritis">,
  "executiveSummary": <string ringkasan eksekutif 2-3 kalimat>,
  "cashFlowAnalysis": <string analisis arus kas mendalam>,
  "spendingLeaks": [<string deteksi pos bocor 1>, <string deteksi pos bocor 2>],
  "investmentStrategy": <string strategi alokasi portofolio & aset>,
  "fireRecommendation": <string strategi kemandirian finansial 25x>,
  "actionChecklist": [
    { "task": <string tindakan spesifik>, "priority": <"high"|"medium"|"low">, "impact": <string dampak keuangan> }
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '';
    const parsed = JSON.parse(text);
    return res.json({
      ...parsed,
      generatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error generating AI advice:', error);
    return res.status(200).json({
      usingFallback: true,
      error: error?.message || 'Error executing Gemini API, using client fallback.',
    });
  }
});

// API: AI Advisor Strategis Rekomendasi (Fitur 2)
app.post('/api/ai-advisor/recommendation', async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(200).json({
        usingFallback: true,
        message: 'No GEMINI_API_KEY configured, will use rule-based fallback.',
      });
    }

    const { summary } = req.body;
    if (!summary) {
      return res.status(400).json({ error: 'Summary is required' });
    }

    const ai = new GoogleGenAI({});

    const systemInstruction = `Anda adalah Financial Advisor Strategis profesional berbahasa Indonesia.
Tugas Anda adalah memberikan rekomendasi keuangan strategis, kontekstual, dan actionable berdasarkan ringkasan data keuangan (summary) pengguna.
ATURAN WAJIB:
1. Gunakan HANYA angka dari summary dan DILARANG MENGARANG angka.
2. Nada profesional, suportif, analitis.
3. Bahasa Indonesia sederhana.
4. Total maksimal ±120 kata.
5. Kerangka acuan: alokasi 50/30/20 dan dana darurat 3-6 bulan pengeluaran.
6. Urutan prioritas saran: amankan dana darurat dulu, baru investasi.
7. JANGAN menyebut produk atau instrumen investasi spesifik.
8. Output HANYA JSON valid tanpa teks lain atau format markdown.`;

    const prompt = `Berikut adalah data ringkasan keuangan pengguna:
${JSON.stringify(summary, null, 2)}

Hasilkan JSON valid persis dengan skema:
{
  "analisis": "maks 2 kalimat; sebut pola atau masalah utama dengan angka dari summary",
  "tindakan": [
    "2-3 langkah spesifik, berurutan prioritas, sebut nominal/persentase"
  ],
  "target": "dampak konkret dalam 1-3 bulan, dengan angka yang dapat dihitung dari summary"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '';
    return res.json({ text });
  } catch (error: any) {
    console.error('Error generating advisor recommendation:', error);
    return res.status(500).json({
      error: error?.message || 'Error generating recommendation',
    });
  }
});

// Mount Vite or static server
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static('dist'));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve('dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: Number(port),
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(Number(port), '0.0.0.0', () => {
    console.log(`Cash Flow Pribadi Server running on http://0.0.0.0:${port}`);
  });
}

startServer();

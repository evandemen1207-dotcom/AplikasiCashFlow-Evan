import React from 'react';
import { X, Award, Mail, Compass, Camera, Fish, Music, ExternalLink, ShieldCheck } from 'lucide-react';

interface DeveloperCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeveloperCreditsModal: React.FC<DeveloperCreditsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl z-10 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Decorative Top Accent */}
        <div className="h-2.5 bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500" />

        {/* Header */}
        <div className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-600 text-white flex items-center justify-center font-black text-xl shadow-md shadow-indigo-600/20 shrink-0">
              E
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  Dikembangkan oleh Evan
                </h3>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-slate-800 px-2.5 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-500/40">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  Kredensial Resmi
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                Profil & Kredensial Pengembang Aplikasi Cash Flow & Early Warning System
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Tutup Modal"
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto bg-slate-50/50 dark:bg-slate-900">
          {/* Badge & Certification Card */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/50 shadow-sm space-y-2">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-wide">
              <Award className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>Sertifikasi Profesional Perencanaan Wilayah & Kota</span>
            </div>
            <div className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              Ahli Muda Perencanaan Wilayah dan Kota (Sertifikasi LPJK / BNSP Level 7)
            </div>
            <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              Fokus: GIS, Pemodelan Spasial, dan Analitik Big Data Strategis
            </div>
          </div>

          {/* Biografi Utama (Paragraph 1 & 2 dari User Brief) */}
          <div className="space-y-3.5 text-sm leading-relaxed">
            <div className="p-4.5 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/50 shadow-xs text-slate-700 dark:text-slate-200">
              Perencana Wilayah dan Kota Tersertifikasi (Ahli Muda Perencanaan Wilayah dan Kota, Sertifikasi LPJK/BNSP Level 7) dengan keahlian teknis dalam GIS, pemodelan spasial, dan analitik big data untuk mendukung perencanaan spasial strategis. Menerapkan pengambilan keputusan berbasis data serta logika finansial personal dalam merancang dan mengembangkan aplikasi Cash Flow &amp; Early Warning System ini.
            </div>

            <div className="p-4.5 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/50 shadow-xs text-slate-700 dark:text-slate-200">
              Saat tidak sedang menganalisis data spasial, Evan menikmati aktivitas menjelajahi tempat-tempat baru dengan kameranya, memancing, serta mempelajari hal-hal baru di bidang musik dan bidang lainnya.
            </div>
          </div>

          {/* Interest & Technical Tags */}
          <div className="pt-1">
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2.5">
              Keahlian Teknis &amp; Minat
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/50 text-slate-800 dark:text-slate-200 text-xs font-semibold shadow-2xs">
                <Compass className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                GIS &amp; Pemodelan Spasial
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/50 text-slate-800 dark:text-slate-200 text-xs font-semibold shadow-2xs">
                <Award className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                LPJK / BNSP Level 7
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/50 text-slate-800 dark:text-slate-200 text-xs font-semibold shadow-2xs">
                <Camera className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                Fotografi &amp; Eksplorasi
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/50 text-slate-800 dark:text-slate-200 text-xs font-semibold shadow-2xs">
                <Fish className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                Memancing
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/50 text-slate-800 dark:text-slate-200 text-xs font-semibold shadow-2xs">
                <Music className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
                Eksplorasi Musik
              </span>
            </div>
          </div>

          {/* Contact & Email */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-indigo-50/80 dark:bg-slate-800/60 border border-indigo-200 dark:border-slate-700/50 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-100 dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs text-slate-600 dark:text-slate-300 font-medium">Kontak Resmi Pengembang:</div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">dermanevan@gmail.com</div>
              </div>
            </div>
            <a
              href="mailto:dermanevan@gmail.com"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm inline-flex items-center gap-1.5 self-start sm:self-auto"
            >
              <span>Kirim Pesan</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-white dark:bg-slate-850 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 border border-slate-300 dark:border-slate-700 rounded-xl transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

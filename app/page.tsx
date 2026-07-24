// File: app/page.tsx
'use client';
import { useState } from 'react';

// 1. Data Dummy Master Reference (Golden Reference SSOT)
const SAMPLE_MASTER = [
  { customer_name_standard: "PLN" },
  { customer_name_standard: "TELKOM INDONESIA" },
  { customer_name_standard: "PERTAMINA" },
  { customer_name_standard: "BANK MANDIRI" },
  { customer_name_standard: "KRAKATAU STEEL" }
];

// 2. Data Raw Contoh untuk Simulasi Batch
const SAMPLE_RAW_BATCH = [
  { customer_name_raw: "PT. PLN (Persero) Tbk" },
  { customer_name_raw: "PT TELKOM INDO" },
  { customer_name_raw: "PERTAMINA, PT PERSERO" },
  { customer_name_raw: "MANDIRI BANK PT" },
  { customer_name_raw: "PT WARUNG SEJAHTERA" } // Contoh data no match / anomali
];

export default function Home() {
  const [singleInput, setSingleInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const processAI = async (rawDataToProcess: any[]) => {
    setLoading(true);
    try {
      const response = await fetch('/api/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          masterData: SAMPLE_MASTER,
          rawData: rawDataToProcess
        }),
      });

      const resData = await response.json();
      if (resData.success) {
        setResults(resData.data);
      } else {
        alert('Gagal memproses: ' + resData.error);
      }
    } catch (err) {
      alert('Terjadi kesalahan jaringan.');
    }
    setLoading(false);
  };

  const handleSingleTest = () => {
    if (!singleInput.trim()) return;
    processAI([{ customer_name_raw: singleInput }]);
  };

  const handleBatchTest = () => {
    processAI(SAMPLE_RAW_BATCH);
  };

  const getStatusBadge = (status: string) => {
    if (status === 'AUTO_APPROVE') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          AUTO APPROVE (SSOT Clean)
        </span>
      );
    }
    if (status === 'REVIEW') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-amber-400"></span>
          STEWARD REVIEW
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-sm">
        <span className="w-2 h-2 rounded-full bg-rose-400"></span>
        NO MATCH (Anomali)
      </span>
    );
  };

  // Hitung Metrik Ringkasan (Before vs After)
  const totalCount = results.length;
  const autoApproveCount = results.filter(r => r.ai_status === 'AUTO_APPROVE').length;
  const reviewCount = results.filter(r => r.ai_status === 'REVIEW').length;
  const cleanRate = totalCount > 0 ? Math.round((autoApproveCount / totalCount) * 100) : 0;

  return (
    <main className="min-h-screen p-3 sm:p-6 md:p-10 bg-slate-900 text-slate-100 font-sans">
      <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">

        {/* Header Demo & Badge SSOT */}
        <header className="text-center space-y-2.5 sm:space-y-3 pt-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-[11px] sm:text-xs font-medium tracking-wide uppercase">
            ⚡ AI Data Quality & Cleansing Engine • SSOT Standard
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent px-2">
            Simulasi Data Cleansing Before ➔ After
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto text-xs sm:text-sm md:text-base px-2">
            Mencocokkan data mentah berantakan (RAW) ke Golden Reference Master Data (SSOT) menggunakan Gemini AI & Decision Threshold.
          </p>
        </header>

        {/* Info Master Data SSOT */}
        <div className="bg-slate-800/70 backdrop-blur p-4 sm:p-6 rounded-2xl border border-slate-700/60 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-400"></span>
              Golden Reference Master Data (SSOT)
            </h2>
            <span className="text-[11px] sm:text-xs text-slate-500">{SAMPLE_MASTER.length} Entitas</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_MASTER.map((m, i) => (
              <span key={i} className="px-3 py-1.5 bg-blue-500/10 text-blue-300 rounded-lg text-xs sm:text-sm font-semibold border border-blue-500/20 flex items-center gap-1.5">
                <span className="text-[10px] text-blue-400 font-mono">#0{i+1}</span>
                {m.customer_name_standard}
              </span>
            ))}
          </div>
        </div>

        {/* Area Interaksi Control Panel */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">

          {/* Opsi 1: Test Ketik Single */}
          <div className="bg-slate-800/70 backdrop-blur p-4 sm:p-6 rounded-2xl border border-slate-700/60 shadow-xl space-y-4 flex flex-col justify-between">
            <div>
              <h2 className="font-bold text-base sm:text-lg text-slate-100 flex items-center gap-2">
                ✍️ Uji Coba Single Input (Interactive)
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Masukkan contoh nama debitur mentah (contoh: <code className="text-amber-300">PT. PLN (Persero) Tbk</code>)
              </p>
            </div>
            <div className="space-y-3 pt-2">
              <input
                type="text"
                value={singleInput}
                onChange={(e) => setSingleInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSingleTest()}
                placeholder="Contoh: PT TELKOM INDONESIA TBK..."
                className="w-full px-4 py-3 bg-slate-900/80 border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-100 placeholder-slate-500 text-sm focus:outline-none transition"
              />
              <button
                onClick={handleSingleTest}
                disabled={loading || !singleInput.trim()}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 active:scale-[0.98] disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition flex items-center justify-center gap-2 text-sm"
              >
                {loading ? 'AI Memproses...' : 'Uji Cleansing Data Ini ➔'}
              </button>
            </div>
          </div>

          {/* Opsi 2: Simulasi Batch */}
          <div className="bg-slate-800/70 backdrop-blur p-4 sm:p-6 rounded-2xl border border-slate-700/60 shadow-xl space-y-4 flex flex-col justify-between">
            <div>
              <h2 className="font-bold text-base sm:text-lg text-slate-100 flex items-center gap-2">
                ⚡ Simulasi Batch Cleansing (5 Data)
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Jalankan simulasi otomatis untuk melihat transformasi data mentah dari berbagai sumber sistem sekaligus.
              </p>
            </div>
            <div className="space-y-3 pt-2">
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-[11px] sm:text-xs text-slate-400 space-y-1">
                <div>• PT. PLN (Persero) Tbk</div>
                <div>• PT TELKOM INDO</div>
                <div>• PERTAMINA, PT PERSERO</div>
                <div>• PT WARUNG SEJAHTERA (Anomali Test)</div>
              </div>
              <button
                onClick={handleBatchTest}
                disabled={loading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] disabled:bg-slate-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition flex items-center justify-center gap-2 text-sm"
              >
                {loading ? 'Sistem AI Sedang Berjalan...' : '🚀 Jalankan Simulasi Batch Engine'}
              </button>
            </div>
          </div>

        </div>

        {/* METRIK RESULT / BEFORE vs AFTER DASHBOARD */}
        {results.length > 0 && (
          <div className="space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* KPI Cards Ringkasan Dashboard */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
              <div className="bg-slate-800/80 p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-700/80">
                <div className="text-[11px] sm:text-xs font-medium text-slate-400">Total Raw (Before)</div>
                <div className="text-xl sm:text-2xl font-black text-slate-100 mt-1">{totalCount} Record</div>
                <div className="text-[10px] text-slate-500 mt-0.5 hidden sm:block">Data mentah Staging</div>
              </div>
              
              <div className="bg-emerald-950/40 p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border border-emerald-800/40">
                <div className="text-[11px] sm:text-xs font-medium text-emerald-400">SSOT Clean</div>
                <div className="text-xl sm:text-2xl font-black text-emerald-300 mt-1">{autoApproveCount} Record</div>
                <div className="text-[10px] text-emerald-500 mt-0.5 hidden sm:block">Score ≥ 95%</div>
              </div>

              <div className="bg-amber-950/40 p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border border-amber-800/40">
                <div className="text-[11px] sm:text-xs font-medium text-amber-400">Steward Review</div>
                <div className="text-xl sm:text-2xl font-black text-amber-300 mt-1">{reviewCount} Record</div>
                <div className="text-[10px] text-amber-500 mt-0.5 hidden sm:block">Score 85% - 94.9%</div>
              </div>

              <div className="bg-blue-950/40 p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border border-blue-800/40">
                <div className="text-[11px] sm:text-xs font-medium text-blue-400">Clean Rate</div>
                <div className="text-xl sm:text-2xl font-black text-blue-300 mt-1">{cleanRate}%</div>
                <div className="text-[10px] text-blue-500 mt-0.5 hidden sm:block">Tingkat Otomasi AI</div>
              </div>
            </div>

            {/* TABEL / CARDS AUDIT TRAIL BEFORE VS AFTER */}
            <div className="bg-slate-800/80 backdrop-blur rounded-2xl border border-slate-700/80 overflow-hidden shadow-2xl">
              <div className="p-4 sm:p-5 bg-slate-800/90 border-b border-slate-700 flex justify-between items-center gap-2">
                <div>
                  <h2 className="font-bold text-base sm:text-lg text-slate-100 flex items-center gap-2">
                    📋 Transformasi Cleansing (Before ➔ After)
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5 hidden sm:block">
                    Hasil perbandingan data mentah staging terhadap standar Golden Record SSOT
                  </p>
                </div>
                <button 
                  onClick={() => setResults([])} 
                  className="px-3 py-1.5 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 text-xs font-semibold rounded-lg border border-rose-500/20 transition whitespace-nowrap"
                >
                  Bersihkan
                </button>
              </div>

              {/* TAMPILAN MOBILE (Card View untuk < md screen) */}
              <div className="block md:hidden divide-y divide-slate-700/60 p-3 space-y-3">
                {results.map((row, idx) => (
                  <div key={idx} className="bg-slate-900/70 p-4 rounded-xl border border-slate-800 space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">🔴 BEFORE (Raw Data)</span>
                        <div className="font-mono text-xs text-rose-300 bg-rose-950/40 px-2.5 py-1 rounded border border-rose-800/40 inline-block break-all">
                          {row.original_value}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 font-bold block">CONFIDENCE</span>
                        <span className={`font-mono font-bold text-xs ${
                          row.confidence_score >= 95 ? 'text-emerald-400' :
                          row.confidence_score >= 85 ? 'text-amber-400' : 'text-rose-400'
                        }`}>
                          {row.confidence_score}%
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">⚙️ PRE-CLEANSING</span>
                      <div className="font-mono text-xs text-slate-300 bg-slate-800/80 px-2.5 py-1 rounded border border-slate-700/50 inline-block break-all">
                        {row.cleansed_value}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">🟢 AFTER (SSOT Master)</span>
                      {row.suggested_master !== 'TIDAK DITEMUKAN' ? (
                        <div className="font-bold text-xs text-emerald-400 bg-emerald-950/40 px-2.5 py-1 rounded border border-emerald-800/50 inline-flex items-center gap-1.5">
                          <span>✓</span>
                          {row.suggested_master}
                        </div>
                      ) : (
                        <div className="font-semibold text-xs text-rose-400 bg-rose-950/40 px-2.5 py-1 rounded border border-rose-800/50 inline-block">
                          ✕ TIDAK DITEMUKAN
                        </div>
                      )}
                    </div>

                    <div className="pt-1">
                      {getStatusBadge(row.ai_status)}
                    </div>
                  </div>
                ))}
              </div>

              {/* TAMPILAN DESKTOP (Table View untuk >= md screen) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-900/60 text-slate-400 border-b border-slate-700 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4 font-semibold">🔴 BEFORE (Raw Data)</th>
                      <th className="px-6 py-4 font-semibold">⚙️ PRE-CLEANSING</th>
                      <th className="px-6 py-4 font-semibold">🟢 AFTER (SSOT Golden Master)</th>
                      <th className="px-6 py-4 font-semibold text-center">CONFIDENCE</th>
                      <th className="px-6 py-4 font-semibold">STATUS & AKSI SISTEM</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {results.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-700/30 transition-colors">
                        {/* BEFORE */}
                        <td className="px-6 py-4">
                          <div className="font-mono text-xs text-rose-300 bg-rose-950/30 px-2.5 py-1.5 rounded-md border border-rose-800/30 inline-block">
                            {row.original_value}
                          </div>
                        </td>

                        {/* PRE-CLEANSING */}
                        <td className="px-6 py-4">
                          <div className="font-mono text-xs text-slate-300 bg-slate-900/60 px-2.5 py-1.5 rounded-md border border-slate-700/50 inline-block">
                            {row.cleansed_value}
                          </div>
                        </td>

                        {/* AFTER */}
                        <td className="px-6 py-4">
                          {row.suggested_master !== 'TIDAK DITEMUKAN' ? (
                            <div className="font-bold text-emerald-400 bg-emerald-950/40 px-3 py-1.5 rounded-lg border border-emerald-800/50 inline-flex items-center gap-2">
                              <span>✓</span>
                              {row.suggested_master}
                            </div>
                          ) : (
                            <div className="font-semibold text-rose-400 bg-rose-950/40 px-3 py-1.5 rounded-lg border border-rose-800/50 inline-block">
                              ✕ TIDAK DITEMUKAN
                            </div>
                          )}
                        </td>

                        {/* CONFIDENCE */}
                        <td className="px-6 py-4 text-center">
                          <span className={`font-mono font-bold text-sm ${
                            row.confidence_score >= 95 ? 'text-emerald-400' :
                            row.confidence_score >= 85 ? 'text-amber-400' : 'text-rose-400'
                          }`}>
                            {row.confidence_score}%
                          </span>
                        </td>

                        {/* STATUS */}
                        <td className="px-6 py-4">
                          {getStatusBadge(row.ai_status)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>

          </div>
        )}

      </div>
    </main>
  );
}
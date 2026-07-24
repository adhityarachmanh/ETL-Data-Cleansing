// File: app/page.tsx
'use client';
import { useState } from 'react';

// Data Default Golden Reference Master (SSOT)
const INITIAL_MASTER = [
  { customer_name_standard: "PLN" },
  { customer_name_standard: "TELKOM INDONESIA" },
  { customer_name_standard: "PERTAMINA" },
  { customer_name_standard: "BANK MANDIRI" },
  { customer_name_standard: "KRAKATAU STEEL" }
];

// Data Default Raw Contoh untuk Simulasi Batch
const INITIAL_RAW_BATCH = [
  { customer_name_raw: "PT. PLN (Persero) Tbk" },
  { customer_name_raw: "PT TELKOM INDO" },
  { customer_name_raw: "PERTAMINA, PT PERSERO" },
  { customer_name_raw: "MANDIRI BANK PT" },
  { customer_name_raw: "PT WARUNG SEJAHTERA" } // Contoh data no match / anomali
];

export default function Home() {
  // State Master Data Referensi (Dapat ditambah/dihapus oleh user)
  const [masterList, setMasterList] = useState<any[]>(INITIAL_MASTER);
  const [newMasterInput, setNewMasterInput] = useState('');
  const [showMasterManager, setShowMasterManager] = useState(false);

  // State Batch Data Mentah (Dapat ditambah/dihapus oleh user)
  const [rawBatchList, setRawBatchList] = useState<any[]>(INITIAL_RAW_BATCH);
  const [newRawInput, setNewRawInput] = useState('');
  const [showBatchManager, setShowBatchManager] = useState(false);

  // State Input Single & Hasil AI
  const [singleInput, setSingleInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  // --- FUNGSI PENGELOLA MASTER DATA ---
  const handleAddMaster = () => {
    if (!newMasterInput.trim()) return;
    const cleanName = newMasterInput.trim().toUpperCase();
    if (masterList.some(m => m.customer_name_standard === cleanName)) {
      alert('Nama master entitas ini sudah ada!');
      return;
    }
    setMasterList([...masterList, { customer_name_standard: cleanName }]);
    setNewMasterInput('');
  };

  const handleDeleteMaster = (indexToDelete: number) => {
    setMasterList(masterList.filter((_, idx) => idx !== indexToDelete));
  };

  const handleResetMaster = () => {
    setMasterList(INITIAL_MASTER);
  };

  // --- FUNGSI PENGELOLA BATCH DATA MENTAH ---
  const handleAddRawToBatch = () => {
    if (!newRawInput.trim()) return;
    setRawBatchList([...rawBatchList, { customer_name_raw: newRawInput.trim() }]);
    setNewRawInput('');
  };

  const handleDeleteRawFromBatch = (indexToDelete: number) => {
    setRawBatchList(rawBatchList.filter((_, idx) => idx !== indexToDelete));
  };

  const handleResetBatch = () => {
    setRawBatchList(INITIAL_RAW_BATCH);
  };

  // --- EXECUTE PROCESS AI ---
  const processAI = async (rawDataToProcess: any[]) => {
    if (masterList.length === 0) {
      alert('Master Data Referensi (SSOT) kosong! Harap tambahkan minimal 1 entitas master.');
      return;
    }

    if (rawDataToProcess.length === 0) {
      alert('Data Batch Mentah kosong! Harap tambahkan minimal 1 data raw.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          masterData: masterList,
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
    processAI(rawBatchList);
  };

  const getStatusBadge = (status: string) => {
    if (status === 'AUTO_APPROVE') {
      return (
        <span className="px-2.5 py-1 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
          AUTO APPROVE (SSOT Clean)
        </span>
      );
    }
    if (status === 'REVIEW') {
      return (
        <span className="px-2.5 py-1 rounded text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
          STEWARD REVIEW
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded text-xs font-semibold bg-red-100 text-red-800 border border-red-300">
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
    <main className="min-h-screen p-4 sm:p-6 md:p-10 bg-gray-100 text-gray-900 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header Flat Light */}
        <header className="bg-white p-5 sm:p-6 rounded-lg border border-gray-300 space-y-2">
          <div className="text-xs font-bold text-blue-700 uppercase tracking-wider">
            AI Data Quality & Cleansing Engine • SSOT Standard
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Simulasi Data Cleansing (Before ➔ After)
          </h1>
          <p className="text-sm text-gray-600">
            Mencocokkan data mentah berantakan (RAW) ke Master Data Referensi (SSOT) menggunakan Gemini AI.
          </p>
        </header>

        {/* Kelola Master Data Referensi SSOT (Interactive Manager) */}
        <div className="bg-white p-4 sm:p-5 rounded-lg border border-gray-300 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 pb-3">
            <div>
              <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Golden Reference Master Data (SSOT)
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Daftar entitas standar resmi yang menjadi acuan pencocokan data mentah.
              </p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button 
                onClick={() => setShowMasterManager(!showMasterManager)}
                className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-semibold rounded transition"
              >
                {showMasterManager ? 'Tutup Pengelola' : '+ Kelola Master'}
              </button>
              {masterList.length !== INITIAL_MASTER.length && (
                <button 
                  onClick={handleResetMaster}
                  className="px-2.5 py-1 text-xs text-gray-500 hover:text-gray-700 underline"
                >
                  Reset Default
                </button>
              )}
            </div>
          </div>

          {/* Form Tambah Master Data */}
          {showMasterManager && (
            <div className="bg-gray-50 p-3 sm:p-3.5 rounded border border-gray-200 space-y-2.5">
              <label className="text-xs font-bold text-gray-700 block">
                Tambah Entitas Master Standar Baru:
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={newMasterInput}
                  onChange={(e) => setNewMasterInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddMaster()}
                  placeholder="Contoh: BANK BCA, PERUSAHAAN GAS NEGARA..."
                  className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded text-xs text-gray-900 focus:outline-none focus:border-blue-600"
                />
                <button
                  onClick={handleAddMaster}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded transition w-full sm:w-auto whitespace-nowrap"
                >
                  + Tambah Master
                </button>
              </div>
            </div>
          )}

          {/* List Master Data Badges */}
          <div className="flex flex-wrap gap-2">
            {masterList.map((m, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-900 rounded border border-blue-200 text-xs font-semibold">
                <span className="text-blue-500 font-mono">#0{i+1}</span>
                {m.customer_name_standard}
                {showMasterManager && (
                  <button 
                    onClick={() => handleDeleteMaster(i)}
                    className="ml-1 text-red-500 hover:text-red-700 font-bold px-1 rounded hover:bg-red-50"
                    title="Hapus entitas master ini"
                  >
                    ×
                  </button>
                )}
              </span>
            ))}
          </div>
        </div>

        {/* Control Panel Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* Opsi 1: Test Ketik Single */}
          <div className="bg-white p-4 sm:p-5 rounded-lg border border-gray-300 space-y-4 flex flex-col justify-between">
            <div>
              <h2 className="font-bold text-base text-gray-900">
                1. Uji Coba Single Input
              </h2>
              <p className="text-xs text-gray-600 mt-1">
                Ketik nama mentah (contoh: <code className="bg-gray-100 text-gray-800 px-1 py-0.5 rounded font-mono">PT. PLN (Persero) Tbk</code>)
              </p>
            </div>
            <div className="space-y-3 pt-2">
              <input
                type="text"
                value={singleInput}
                onChange={(e) => setSingleInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSingleTest()}
                placeholder="Masukkan nama raw debitur..."
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm text-gray-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              />
              <button
                onClick={handleSingleTest}
                disabled={loading || !singleInput.trim()}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-medium rounded text-sm transition"
              >
                {loading ? 'Memproses...' : 'Uji Cleansing Data Ini ➔'}
              </button>
            </div>
          </div>

          {/* Opsi 2: Simulasi Batch (Interactive) */}
          <div className="bg-white p-4 sm:p-5 rounded-lg border border-gray-300 space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <h2 className="font-bold text-base text-gray-900">
                  2. Simulasi Batch ({rawBatchList.length} Data Raw)
                </h2>
                <div className="flex items-center gap-1.5 self-start sm:self-auto">
                  <button 
                    onClick={() => setShowBatchManager(!showBatchManager)}
                    className="text-xs text-blue-700 hover:underline font-medium"
                  >
                    {showBatchManager ? 'Tutup Pengelola' : '+ Edit List Batch'}
                  </button>
                  {rawBatchList.length !== INITIAL_RAW_BATCH.length && (
                    <button 
                      onClick={handleResetBatch}
                      className="text-xs text-gray-500 hover:text-gray-700 underline ml-1"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Jalankan cleansing otomatis untuk seluruh sampel data raw di bawah ini.
              </p>
            </div>

            {/* Form Tambah Item Batch */}
            {showBatchManager && (
              <div className="bg-gray-50 p-3 rounded border border-gray-200 space-y-2">
                <label className="text-xs font-bold text-gray-700 block">
                  Tambah Data Mentah Baru ke Batch:
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={newRawInput}
                    onChange={(e) => setNewRawInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddRawToBatch()}
                    placeholder="Contoh: PT. BCA (PERSERO) TBK..."
                    className="flex-1 px-2.5 py-1.5 bg-white border border-gray-300 rounded text-xs text-gray-900 focus:outline-none focus:border-blue-600"
                  />
                  <button
                    onClick={handleAddRawToBatch}
                    className="px-3 py-1.5 bg-gray-800 hover:bg-gray-900 text-white text-xs font-bold rounded transition w-full sm:w-auto whitespace-nowrap"
                  >
                    + Item
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-3 pt-1">
              <div className="bg-gray-50 p-2.5 rounded border border-gray-200 text-xs text-gray-700 space-y-1.5 max-h-36 overflow-y-auto">
                {rawBatchList.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center group font-mono text-[11px]">
                    <span className="truncate pr-2">• {item.customer_name_raw}</span>
                    {showBatchManager && (
                      <button 
                        onClick={() => handleDeleteRawFromBatch(idx)}
                        className="text-red-500 hover:text-red-700 font-bold px-1.5 py-0.5 rounded hover:bg-red-50 text-xs shrink-0"
                        title="Hapus item raw ini dari batch"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                onClick={handleBatchTest}
                disabled={loading || rawBatchList.length === 0}
                className="w-full py-2.5 bg-gray-800 hover:bg-gray-900 disabled:bg-gray-300 text-white font-medium rounded text-sm transition"
              >
                {loading ? 'Memproses Batch...' : `Jalankan Simulasi Batch (${rawBatchList.length} Item)`}
              </button>
            </div>
          </div>

        </div>


        {/* METRIK RESULT / BEFORE vs AFTER DASHBOARD */}
        {results.length > 0 && (
          <div className="space-y-5">
            
            {/* KPI Cards Ringkasan */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white p-4 rounded-lg border border-gray-300">
                <div className="text-xs font-semibold text-gray-500">Total Raw (Before)</div>
                <div className="text-xl font-bold text-gray-900 mt-1">{totalCount} Record</div>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-gray-300 border-l-4 border-l-emerald-500">
                <div className="text-xs font-semibold text-emerald-800">SSOT Clean</div>
                <div className="text-xl font-bold text-emerald-900 mt-1">{autoApproveCount} Record</div>
              </div>

              <div className="bg-white p-4 rounded-lg border border-gray-300 border-l-4 border-l-amber-500">
                <div className="text-xs font-semibold text-amber-800">Steward Review</div>
                <div className="text-xl font-bold text-amber-900 mt-1">{reviewCount} Record</div>
              </div>

              <div className="bg-white p-4 rounded-lg border border-gray-300 border-l-4 border-l-blue-500">
                <div className="text-xs font-semibold text-blue-800">Clean Rate</div>
                <div className="text-xl font-bold text-blue-900 mt-1">{cleanRate}%</div>
              </div>
            </div>

            {/* TABEL SIMULASI BEFORE VS AFTER */}
            <div className="bg-white rounded-lg border border-gray-300 overflow-hidden">
              <div className="p-4 bg-gray-50 border-b border-gray-300 flex justify-between items-center">
                <h2 className="font-bold text-sm text-gray-900">
                  Audit Trail Cleansing (Before ➔ After)
                </h2>
                <button 
                  onClick={() => setResults([])} 
                  className="px-3 py-1 bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 text-xs font-medium rounded transition"
                >
                  Clear Hasil
                </button>
              </div>

              {/* TAMPILAN MOBILE (< md) */}
              <div className="block md:hidden divide-y divide-gray-200 p-3 space-y-3">
                {results.map((row, idx) => (
                  <div key={idx} className="bg-gray-50 p-3 rounded border border-gray-200 space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-gray-500 uppercase">RAW (BEFORE)</span>
                      <span className="font-mono font-bold text-gray-700">Score: {row.confidence_score}%</span>
                    </div>
                    <div className="font-mono text-gray-900 bg-white p-2 rounded border border-gray-300 break-all font-semibold">
                      {row.original_value}
                    </div>

                    <div className="font-bold text-gray-500 uppercase pt-1">AFTER (SSOT MASTER)</div>
                    <div className="font-bold text-gray-900 bg-white p-2 rounded border border-gray-300">
                      {row.suggested_master}
                    </div>

                    <div className="pt-1">
                      {getStatusBadge(row.ai_status)}
                    </div>
                  </div>
                ))}
              </div>

              {/* TAMPILAN DESKTOP (>= md) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-50 text-gray-700 border-b border-gray-300 uppercase font-semibold">
                    <tr>
                      <th className="px-4 py-3">BEFORE (Raw Data)</th>
                      <th className="px-4 py-3">PRE-CLEANSING</th>
                      <th className="px-4 py-3">AFTER (SSOT Golden Master)</th>
                      <th className="px-4 py-3 text-center">CONFIDENCE</th>
                      <th className="px-4 py-3">STATUS AI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {results.map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 transition-colors">
                        {/* BEFORE */}
                        <td className="px-4 py-3">
                          <span className="font-mono text-gray-900 bg-gray-100 px-2 py-1 rounded border border-gray-200 font-semibold">
                            {row.original_value}
                          </span>
                        </td>

                        {/* PRE-CLEANSING */}
                        <td className="px-4 py-3 font-mono text-gray-700">
                          {row.cleansed_value}
                        </td>

                        {/* AFTER */}
                        <td className="px-4 py-3">
                          <span className="font-bold text-gray-900">
                            {row.suggested_master}
                          </span>
                        </td>

                        {/* CONFIDENCE */}
                        <td className="px-4 py-3 text-center font-mono font-bold text-gray-900">
                          {row.confidence_score}%
                        </td>

                        {/* STATUS */}
                        <td className="px-4 py-3">
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
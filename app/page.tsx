// File: app/page.tsx
'use client';
import { useState } from 'react';

// Data Default Golden Reference Master (SSOT) - Domain 1: Nama Entitas
const INITIAL_MASTER = [
  { customer_name_standard: "PLN" },
  { customer_name_standard: "TELKOM INDONESIA" },
  { customer_name_standard: "PERTAMINA" },
  { customer_name_standard: "BANK MANDIRI" },
  { customer_name_standard: "KRAKATAU STEEL" }
];

// Data Default Golden Reference Master (SSOT) - Domain 2: Sektor
const INITIAL_SECTOR = [
  { sector_name_standard: "ENERGI" },
  { sector_name_standard: "TELEKOMUNIKASI" },
  { sector_name_standard: "MIGAS" },
  { sector_name_standard: "PERBANKAN" },
  { sector_name_standard: "MANUFAKTUR" }
];

// Data Default Raw Contoh untuk Simulasi Batch (Multi-Domain)
const INITIAL_RAW_BATCH = [
  { customer_name_raw: "PT. PLN (Persero) Tbk", sector_raw: "Listrik & Energi" },
  { customer_name_raw: "PT TELKOM INDO", sector_raw: "Telco" },
  { customer_name_raw: "PERTAMINA, PT PERSERO", sector_raw: "Minyak Bumi" },
  { customer_name_raw: "MANDIRI BANK PT", sector_raw: "Keuangan" },
  { customer_name_raw: "PT WARUNG SEJAHTERA", sector_raw: "Ritel Dagang" } // Contoh anomali
];

export default function Home() {
  // State Master Data Referensi NAMA
  const [masterList, setMasterList] = useState<any[]>([...INITIAL_MASTER]);
  const [newMasterInput, setNewMasterInput] = useState('');
  const [showMasterManager, setShowMasterManager] = useState(false);

  // State Master Data Referensi SEKTOR
  const [sectorList, setSectorList] = useState<any[]>([...INITIAL_SECTOR]);
  const [newSectorInput, setNewSectorInput] = useState('');
  const [showSectorManager, setShowSectorManager] = useState(false);

  // State Batch Data Mentah 
  const [rawBatchList, setRawBatchList] = useState<any[]>([...INITIAL_RAW_BATCH]);
  const [newRawName, setNewRawName] = useState('');
  const [newRawSector, setNewRawSector] = useState('');
  const [showBatchManager, setShowBatchManager] = useState(false);

  // State Input Single & Hasil AI
  const [singleInputName, setSingleInputName] = useState('');
  const [singleInputSector, setSingleInputSector] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  // --- FUNGSI PENGELOLA MASTER DATA NAMA ---
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

  const handleEditMaster = (indexToEdit: number) => {
    const currentName = masterList[indexToEdit].customer_name_standard;
    const newVal = window.prompt("Edit Nama Master Entitas:", currentName);
    if (newVal !== null && newVal.trim() !== "") {
      const cleanName = newVal.trim().toUpperCase();
      if (masterList.some((m, idx) => m.customer_name_standard === cleanName && idx !== indexToEdit)) {
        alert('Nama master entitas ini sudah ada!');
        return;
      }
      const newList = [...masterList];
      newList[indexToEdit].customer_name_standard = cleanName;
      setMasterList(newList);
    }
  };

  const handleDeleteMaster = (indexToDelete: number) => {
    setMasterList(masterList.filter((_, idx) => idx !== indexToDelete));
  };

  const handleResetMaster = () => setMasterList([...INITIAL_MASTER]);
  const handleClearMaster = () => setMasterList([]);

  // --- FUNGSI PENGELOLA MASTER DATA SEKTOR ---
  const handleAddSector = () => {
    if (!newSectorInput.trim()) return;
    const cleanSector = newSectorInput.trim().toUpperCase();
    if (sectorList.some(s => s.sector_name_standard === cleanSector)) {
      alert('Sektor referensi ini sudah ada!');
      return;
    }
    setSectorList([...sectorList, { sector_name_standard: cleanSector }]);
    setNewSectorInput('');
  };

  const handleEditSector = (indexToEdit: number) => {
    const currentSector = sectorList[indexToEdit].sector_name_standard;
    const newVal = window.prompt("Edit Sektor Master:", currentSector);
    if (newVal !== null && newVal.trim() !== "") {
      const cleanSector = newVal.trim().toUpperCase();
      if (sectorList.some((s, idx) => s.sector_name_standard === cleanSector && idx !== indexToEdit)) {
        alert('Sektor referensi ini sudah ada!');
        return;
      }
      const newList = [...sectorList];
      newList[indexToEdit].sector_name_standard = cleanSector;
      setSectorList(newList);
    }
  };

  const handleDeleteSector = (indexToDelete: number) => {
    setSectorList(sectorList.filter((_, idx) => idx !== indexToDelete));
  };

  const handleResetSector = () => setSectorList([...INITIAL_SECTOR]);
  const handleClearSector = () => setSectorList([]);

  // --- FUNGSI PENGELOLA BATCH DATA MENTAH ---
  const handleAddRawToBatch = () => {
    if (!newRawName.trim()) return;
    setRawBatchList([...rawBatchList, {
      customer_name_raw: newRawName.trim(),
      sector_raw: newRawSector.trim()
    }]);
    setNewRawName('');
    setNewRawSector('');
  };

  // Fungsi Edit untuk Raw Batch (Nama & Sektor)
  const handleEditRawBatch = (indexToEdit: number) => {
    const currentItem = rawBatchList[indexToEdit];

    // 1. Prompt untuk Nama Raw
    const updatedName = window.prompt("Edit Nama Raw Entitas:", currentItem.customer_name_raw);
    if (updatedName === null) return; // Batal jika user klik Cancel

    // 2. Prompt untuk Sektor Raw
    const updatedSector = window.prompt("Edit Sektor Raw:", currentItem.sector_raw || "");
    if (updatedSector === null) return; // Batal jika user klik Cancel

    // Update Data
    const newList = [...rawBatchList];
    newList[indexToEdit] = {
      customer_name_raw: updatedName.trim(),
      sector_raw: updatedSector.trim()
    };
    setRawBatchList(newList);
  };

  const handleDeleteRawFromBatch = (indexToDelete: number) => {
    setRawBatchList(rawBatchList.filter((_, idx) => idx !== indexToDelete));
  };

  const handleResetBatch = () => setRawBatchList([...INITIAL_RAW_BATCH]);
  const handleClearBatch = () => setRawBatchList([]);

  // --- EXECUTE PROCESS AI ---
  const processAI = async (rawDataToProcess: any[]) => {
    if (masterList.length === 0) {
      alert('Master Data Referensi Nama (SSOT) kosong! Harap tambahkan minimal 1 entitas master.');
      return;
    }
    if (sectorList.length === 0) {
      alert('Master Data Referensi Sektor (SSOT) kosong! Harap tambahkan minimal 1 sektor master.');
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
          sectorData: sectorList,
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
      alert('Terjadi kesalahan jaringan saat memanggil Gemini API.');
    }
    setLoading(false);
  };

  const handleSingleTest = () => {
    if (!singleInputName.trim()) return;
    processAI([{ customer_name_raw: singleInputName, sector_raw: singleInputSector }]);
  };

  const handleBatchTest = () => {
    processAI(rawBatchList);
  };

  const getStatusBadge = (status: string) => {
    if (status === 'AUTO_APPROVE') {
      return (
        <span className="px-2.5 py-1 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
          AUTO APPROVE
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
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header Flat Light */}
        <header className="bg-white p-5 sm:p-6 rounded-lg border border-gray-300 space-y-2">
          <div className="text-xs font-bold text-blue-700 uppercase tracking-wider">
            AI Data Quality & Cleansing Engine • SSOT Standard (Multi-Domain)
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Simulasi Data Cleansing (Before ➔ After)
          </h1>
          <p className="text-sm text-gray-600">
            Mencocokkan data Nama Entitas & Sektor mentah berantakan (RAW) ke Master Data Referensi (SSOT) menggunakan Gemini AI.
          </p>
        </header>

        {/* SECTION PENGELOLA SSOT MULTI-DOMAIN */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* 1. Kelola Master Data NAMA */}
          <div className="bg-white p-4 sm:p-5 rounded-lg border border-gray-300 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 pb-3">
              <div>
                <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Domain 1: SSOT Nama Entitas
                </h2>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  onClick={() => setShowMasterManager(!showMasterManager)}
                  className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-semibold rounded transition"
                >
                  {showMasterManager ? 'Tutup' : '+ Kelola Master'}
                </button>
                <div className="flex gap-2 border-l border-gray-300 pl-2">
                  <button
                    onClick={handleResetMaster}
                    className="text-xs text-gray-500 hover:text-gray-700 underline"
                  >
                    Reset Default
                  </button>
                  <button
                    onClick={handleClearMaster}
                    className="text-xs text-red-500 hover:text-red-700 underline"
                  >
                    Kosongkan
                  </button>
                </div>
              </div>
            </div>

            {showMasterManager && (
              <div className="bg-gray-50 p-3 sm:p-3.5 rounded border border-gray-200 space-y-2.5">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={newMasterInput}
                    onChange={(e) => setNewMasterInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddMaster()}
                    placeholder="Contoh: BANK BCA, KAI..."
                    className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded text-xs text-gray-900 focus:outline-none focus:border-blue-600"
                  />
                  <button
                    onClick={handleAddMaster}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded transition w-full sm:w-auto whitespace-nowrap"
                  >
                    + Tambah
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {masterList.length === 0 && <span className="text-xs text-gray-400 italic">Data kosong...</span>}
              {masterList.map((m, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-900 rounded border border-blue-200 text-xs font-semibold group">
                  <span className="text-blue-500 font-mono">#0{i + 1}</span>
                  {m.customer_name_standard}
                  {showMasterManager && (
                    <div className="ml-1 flex items-center">
                      <button
                        onClick={() => handleEditMaster(i)}
                        className="text-blue-500 hover:text-blue-700 font-bold px-1 rounded hover:bg-blue-100"
                        title="Edit"
                      >
                        ✎
                      </button>
                      <button
                        onClick={() => handleDeleteMaster(i)}
                        className="text-red-500 hover:text-red-700 font-bold px-1 rounded hover:bg-red-50"
                        title="Hapus"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </span>
              ))}
            </div>
          </div>

          {/* 2. Kelola Master Data SEKTOR */}
          <div className="bg-white p-4 sm:p-5 rounded-lg border border-gray-300 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 pb-3">
              <div>
                <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Domain 2: SSOT Referensi Sektor
                </h2>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  onClick={() => setShowSectorManager(!showSectorManager)}
                  className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold rounded transition"
                >
                  {showSectorManager ? 'Tutup' : '+ Kelola Sektor'}
                </button>
                <div className="flex gap-2 border-l border-gray-300 pl-2">
                  <button
                    onClick={handleResetSector}
                    className="text-xs text-gray-500 hover:text-gray-700 underline"
                  >
                    Reset Default
                  </button>
                  <button
                    onClick={handleClearSector}
                    className="text-xs text-red-500 hover:text-red-700 underline"
                  >
                    Kosongkan
                  </button>
                </div>
              </div>
            </div>

            {showSectorManager && (
              <div className="bg-gray-50 p-3 sm:p-3.5 rounded border border-gray-200 space-y-2.5">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={newSectorInput}
                    onChange={(e) => setNewSectorInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddSector()}
                    placeholder="Contoh: PERTAMBANGAN, RITEL..."
                    className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded text-xs text-gray-900 focus:outline-none focus:border-emerald-600"
                  />
                  <button
                    onClick={handleAddSector}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded transition w-full sm:w-auto whitespace-nowrap"
                  >
                    + Tambah
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {sectorList.length === 0 && <span className="text-xs text-gray-400 italic">Data kosong...</span>}
              {sectorList.map((s, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-900 rounded border border-emerald-200 text-xs font-semibold">
                  {s.sector_name_standard}
                  {showSectorManager && (
                    <div className="ml-1 flex items-center">
                      <button
                        onClick={() => handleEditSector(i)}
                        className="text-emerald-600 hover:text-emerald-800 font-bold px-1 rounded hover:bg-emerald-100"
                        title="Edit"
                      >
                        ✎
                      </button>
                      <button
                        onClick={() => handleDeleteSector(i)}
                        className="text-red-500 hover:text-red-700 font-bold px-1 rounded hover:bg-red-50"
                        title="Hapus"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </span>
              ))}
            </div>
          </div>

        </div>

        {/* Control Panel Grid: SINGLE & BATCH INPUT */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* Opsi 1: Test Ketik Single */}
          <div className="bg-white p-4 sm:p-5 rounded-lg border border-gray-300 space-y-4 flex flex-col justify-between">
            <div>
              <h2 className="font-bold text-base text-gray-900">
                1. Uji Coba Single Input
              </h2>
              <p className="text-xs text-gray-600 mt-1">
                Ketik data mentah (RAW) secara manual.
              </p>
            </div>
            <div className="space-y-3 pt-2">
              <input
                type="text"
                value={singleInputName}
                onChange={(e) => setSingleInputName(e.target.value)}
                placeholder="Nama raw entitas (Contoh: PT. PLN Persero)"
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm text-gray-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              />
              <input
                type="text"
                value={singleInputSector}
                onChange={(e) => setSingleInputSector(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSingleTest()}
                placeholder="Sektor raw (Contoh: Listrik)"
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm text-gray-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              />
              <button
                onClick={handleSingleTest}
                disabled={loading || !singleInputName.trim()}
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
                  2. Simulasi Batch ({rawBatchList.length} Data)
                </h2>
                <div className="flex items-center gap-1.5 self-start sm:self-auto">
                  <button
                    onClick={() => setShowBatchManager(!showBatchManager)}
                    className="text-xs text-blue-700 hover:underline font-medium"
                  >
                    {showBatchManager ? 'Tutup Pengelola' : '+ Edit List Batch'}
                  </button>
                  <div className="flex gap-2 border-l border-gray-300 pl-2">
                    <button
                      onClick={handleResetBatch}
                      className="text-xs text-gray-500 hover:text-gray-700 underline"
                    >
                      Reset Default
                    </button>
                    <button
                      onClick={handleClearBatch}
                      className="text-xs text-red-500 hover:text-red-700 underline"
                    >
                      Kosongkan
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Tambah Item Batch */}
            {showBatchManager && (
              <div className="bg-gray-50 p-3 rounded border border-gray-200 space-y-2">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={newRawName}
                    onChange={(e) => setNewRawName(e.target.value)}
                    placeholder="Nama raw..."
                    className="flex-1 px-2.5 py-1.5 bg-white border border-gray-300 rounded text-xs text-gray-900 focus:outline-none focus:border-blue-600"
                  />
                  <input
                    type="text"
                    value={newRawSector}
                    onChange={(e) => setNewRawSector(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddRawToBatch()}
                    placeholder="Sektor raw..."
                    className="flex-1 px-2.5 py-1.5 bg-white border border-gray-300 rounded text-xs text-gray-900 focus:outline-none focus:border-blue-600"
                  />
                  <button
                    onClick={handleAddRawToBatch}
                    className="px-3 py-1.5 bg-gray-800 hover:bg-gray-900 text-white text-xs font-bold rounded transition w-full sm:w-auto"
                  >
                    + Item
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-3 pt-1">
              <div className="bg-gray-50 p-2.5 rounded border border-gray-200 text-xs text-gray-700 space-y-2 max-h-36 overflow-y-auto">
                {rawBatchList.length === 0 && <div className="text-gray-400 italic py-1">Data batch kosong...</div>}
                {rawBatchList.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center border-b border-gray-200 pb-1.5 last:border-0 last:pb-0">
                    <div className="truncate pr-2">
                      <div className="font-bold text-gray-800">{item.customer_name_raw}</div>
                      <div className="text-[10px] text-gray-500">Sektor: {item.sector_raw || '-'}</div>
                    </div>
                    {showBatchManager && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleEditRawBatch(idx)}
                          className="text-gray-500 hover:text-gray-800 font-bold px-1.5 py-0.5 rounded hover:bg-gray-200 text-xs"
                          title="Edit"
                        >
                          ✎
                        </button>
                        <button
                          onClick={() => handleDeleteRawFromBatch(idx)}
                          className="text-red-500 hover:text-red-700 font-bold px-1.5 py-0.5 rounded hover:bg-red-50 text-xs"
                          title="Hapus"
                        >
                          ×
                        </button>
                      </div>
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
              <div className="block md:hidden divide-y divide-gray-200 p-3 space-y-4">
                {results.map((row, idx) => (
                  <div key={idx} className="bg-gray-50 p-3 rounded border border-gray-200 space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-gray-500 uppercase">RAW (BEFORE)</span>
                      <span className="font-mono font-bold text-gray-700">Skor Nama: {row.confidence_score}%</span>
                    </div>
                    <div className="bg-white p-2 rounded border border-gray-300 break-all space-y-1">
                      <div className="font-mono text-gray-900 font-semibold">{row.original_value}</div>
                      <div className="text-[10px] text-gray-500 uppercase">Sektor: <span className="font-mono">{row.sector_raw}</span></div>
                    </div>

                    <div className="flex justify-between items-center pt-1">
                      <span className="font-bold text-gray-500 uppercase">AFTER (SSOT MASTER)</span>
                      <span className="font-mono font-bold text-emerald-700">Skor Sektor: {row.sector_confidence}%</span>
                    </div>
                    <div className="bg-white p-2 rounded border border-gray-300 space-y-1">
                      <div className="font-bold text-gray-900">{row.suggested_master}</div>
                      <div className="text-[10px] text-emerald-700 uppercase font-bold">Sektor: {row.sector_matched}</div>
                    </div>

                    <div className="pt-2 text-right">
                      {getStatusBadge(row.ai_status)}
                    </div>
                  </div>
                ))}
              </div>

              {/* TAMPILAN DESKTOP (>= md) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-xs text-left min-w-[900px]">
                  <thead className="bg-gray-50 text-gray-700 border-b border-gray-300 uppercase font-semibold">
                    <tr>
                      <th className="px-4 py-3 w-1/4">BEFORE (Raw Data)</th>
                      <th className="px-4 py-3 w-1/4">AFTER (SSOT Golden Master)</th>
                      <th className="px-4 py-3 text-center">CONFIDENCE NAMA</th>
                      <th className="px-4 py-3 text-center">CONFIDENCE SEKTOR</th>
                      <th className="px-4 py-3 text-center">STATUS AI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {results.map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 transition-colors">
                        {/* BEFORE */}
                        <td className="px-4 py-3">
                          <div className="font-mono text-gray-900 bg-gray-100 px-2 py-1 rounded border border-gray-200 font-semibold mb-1 inline-block">
                            {row.original_value}
                          </div>
                          <div className="text-[10px] text-gray-500 uppercase">
                            Sektor: <span className="font-mono">{row.sector_raw}</span>
                          </div>
                        </td>

                        {/* AFTER */}
                        <td className="px-4 py-3">
                          <div className="font-bold text-gray-900 mb-1 text-sm">
                            {row.suggested_master}
                          </div>
                          <div className="text-[10px] text-emerald-700 uppercase font-bold">
                            Sektor: {row.sector_matched}
                          </div>
                        </td>

                        {/* CONFIDENCE NAMA */}
                        <td className="px-4 py-3 text-center font-mono font-bold text-gray-900">
                          {row.confidence_score}%
                        </td>

                        {/* CONFIDENCE SEKTOR */}
                        <td className="px-4 py-3 text-center font-mono font-bold text-emerald-700">
                          {row.sector_confidence}%
                        </td>

                        {/* STATUS */}
                        <td className="px-4 py-3 text-center">
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
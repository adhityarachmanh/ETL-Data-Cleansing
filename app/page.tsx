// File: app/page.tsx
'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ResultsPanel from './components/ResultsPanel';

// Tipe Data Domain Referensi
type Domain = {
  id: string;
  name: string;
  items: string[];
};

// Data Default Awal
const INITIAL_DOMAINS: Domain[] = [
  {
    id: 'customer_name',
    name: 'Nama Entitas / Debitur',
    items: ["PLN", "TELKOM INDONESIA", "PERTAMINA", "BANK MANDIRI", "KRAKATAU STEEL"]
  },
  {
    id: 'sector',
    name: 'Sektor Usaha',
    items: ["ENERGI", "TELEKOMUNIKASI", "MIGAS", "PERBANKAN", "MANUFAKTUR"]
  }
];

const INITIAL_RAW_BATCH = [
  {
    values: {
      customer_name: "PT. PLN (Persero) Tbk",
      sector: "Listrik & Energi"
    }
  },
  {
    values: {
      customer_name: "PT TELKOM INDO",
      sector: "Telco"
    }
  },
  {
    values: {
      customer_name: "PERTAMINA, PT PERSERO",
      sector: "Minyak Bumi"
    }
  },
  {
    values: {
      customer_name: "PT Listrik Mandiri",
      sector: "Pengairan & Irigasi"
    }
  },
  {
    values: {
      customer_name: "MANDIRI BANK PT",
      sector: "Keuangan"
    }
  },
  {
    values: {
      customer_name: "PT WARUNG SEJAHTERA",
      sector: "Ritel Dagang"
    }
  }
];

export default function Home() {
  // State Mode Utama Aplikasi (MATCHING vs PURE_NAME)
  const [mainAppMode, setMainAppMode] = useState<'MATCHING' | 'PURE_NAME'>('MATCHING');

  // State Dynamic Domains
  const [domains, setDomains] = useState<Domain[]>([...INITIAL_DOMAINS]);
  const [activeDomainManager, setActiveDomainManager] = useState<string>(INITIAL_DOMAINS[0].id);
  const [newDomainInput, setNewDomainInput] = useState<{ [key: string]: string }>({});

  // State Table Ref Embel-Embel Legalitas (Fitur Khusus Pak Zoel - Pure Name Stripper)
  const [legalRefList, setLegalRefList] = useState<string[]>([
    "PT", "CV", "UD", "PERSERO", "(PERSERO)", "TBK", ".TBK", "FIRMA", "NV", "INC", "LTD", "CORP"
  ]);
  const [newLegalInput, setNewLegalInput] = useState<string>('');

  // Sample Batch khusus Pure Name Stripping
  const INITIAL_PURE_NAME_BATCH = [
    { raw_val: "PT Bukit Asem (persero) .TBK" },
    { raw_val: "PT JAGA RAYA .tbk" },
    { raw_val: "CV. MAJU SEJAHTERA (PERSERO)" },
    { raw_val: "PT TELKOM INDONESIA (PERSERO) TBK." }
  ];
  const [pureNameBatchList, setPureNameBatchList] = useState<any[]>([...INITIAL_PURE_NAME_BATCH]);
  const [singlePureInput, setSinglePureInput] = useState<string>('PT JAGA RAYA .tbk');

  // State Batch Data Mentah SSOT
  const [rawBatchList, setRawBatchList] = useState<any[]>([...INITIAL_RAW_BATCH]);
  const [newRawInputs, setNewRawInputs] = useState<{ [key: string]: string }>({});
  const [showBatchManager, setShowBatchManager] = useState(false);

  // State Single Input Test
  const [singleInputs, setSingleInputs] = useState<{ [key: string]: string }>({});

  // State Modal Warning / Error Alert UI
  const [alertModal, setAlertModal] = useState<{ isOpen: boolean; title: string; message: string }>({
    isOpen: false,
    title: '',
    message: ''
  });

  // State Modal Tambah Domain Baru
  const [addDomainModal, setAddDomainModal] = useState<{ isOpen: boolean; name: string; error: string }>({
    isOpen: false,
    name: '',
    error: ''
  });

  // State Modal Hapus Konfirmasi
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: (() => void) | null;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null
  });

  // State Processing AI & Results
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  // State Dynamic Threshold Sensitivity
  const [autoApproveThreshold, setAutoApproveThreshold] = useState<number>(90);
  const [stewardReviewThreshold, setStewardReviewThreshold] = useState<number>(75);

  // State Custom Edit Modal
  const [editModal, setEditModal] = useState<{
    isOpen: boolean;
    type: 'DOMAIN_ITEM' | 'RAW_ITEM' | null;
    domainId?: string;
    itemIndex: number;
    values: { [key: string]: string };
    error: string;
  }>({
    isOpen: false,
    type: null,
    itemIndex: -1,
    values: {},
    error: ''
  });

  // Helper untuk memicu Alert UI
  const showAlert = (message: string, title: string = 'Pemberitahuan') => {
    setAlertModal({ isOpen: true, title, message });
  };

  // --- MANAJEMEN EMBEL-EMBEL LEGALITAS (LOV PAK ZOEL) ---
  const handleAddLegalRef = () => {
    const val = newLegalInput.trim().toUpperCase();
    if (!val) return;
    if (legalRefList.includes(val)) {
      showAlert("Item legalitas ini sudah ada di dalam tabel referensi!");
      return;
    }
    setLegalRefList([...legalRefList, val]);
    setNewLegalInput('');
  };

  const handleDeleteLegalRef = (idx: number) => {
    setLegalRefList(legalRefList.filter((_, i) => i !== idx));
  };

  const handleResetLegalRef = () => {
    setLegalRefList(["PT", "CV", "UD", "PERSERO", "(PERSERO)", "TBK", ".TBK", "FIRMA", "NV", "INC", "LTD", "CORP"]);
  };

  // --- TAMBAH / HAPUS DOMAIN MASTER CATEGORY ---
  const handleAddNewDomainCategory = () => {
    const domainName = addDomainModal.name.trim();
    if (!domainName) {
      setAddDomainModal(prev => ({ ...prev, error: 'Nama domain tidak boleh kosong!' }));
      return;
    }

    const id = domainName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    if (domains.some(d => d.id === id)) {
      setAddDomainModal(prev => ({ ...prev, error: 'Domain ini sudah ada!' }));
      return;
    }

    const newDomain: Domain = {
      id,
      name: domainName,
      items: []
    };

    setDomains([...domains, newDomain]);
    setAddDomainModal({ isOpen: false, name: '', error: '' });
  };

  const handleDeleteDomainCategory = (domainId: string) => {
    if (domains.length <= 1) {
      showAlert("Minimal harus ada 1 domain utama!");
      return;
    }

    const targetDomain = domains.find(d => d.id === domainId);
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Domain Master',
      message: `Yakin ingin menghapus seluruh Domain "${targetDomain?.name}"? Data referensi di dalamnya akan hilang.`,
      onConfirm: () => {
        const remaining = domains.filter(d => d.id !== domainId);
        setDomains(remaining);
        if (activeDomainManager === domainId) {
          setActiveDomainManager(remaining[0]?.id || 'customer_name');
        }
        setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null });
      }
    });
  };

  // --- MANAJEMEN ITEM MASTER DALAM DOMAIN ---
  const handleAddItemToDomain = (domainId: string) => {
    const text = newDomainInput[domainId]?.trim().toUpperCase();
    if (!text) return;

    if (domains.find(d => d.id === domainId)?.items.includes(text)) {
      showAlert("Item master ini sudah ada di dalam domain!");
      return;
    }

    setDomains(domains.map(d => {
      if (d.id === domainId) {
        return { ...d, items: [...d.items, text] };
      }
      return d;
    }));

    setNewDomainInput({ ...newDomainInput, [domainId]: '' });
  };

  const handleDeleteItemFromDomain = (domainId: string, index: number) => {
    setDomains(domains.map(d => {
      if (d.id === domainId) {
        return { ...d, items: d.items.filter((_, i) => i !== index) };
      }
      return d;
    }));
  };

  const handleResetDomains = () => setDomains([...INITIAL_DOMAINS]);
  const handleClearDomainItems = (domainId: string) => {
    setDomains(domains.map(d => d.id === domainId ? { ...d, items: [] } : d));
  };

  // --- MANAJEMEN RAW BATCH DATA ---
  const handleAddRawToBatch = () => {
    if (mainAppMode === 'PURE_NAME') {
      if (!newLegalInput.trim()) return;
      setPureNameBatchList([...pureNameBatchList, { raw_val: newLegalInput.trim() }]);
      setNewLegalInput('');
      return;
    }

    const isAnyFilled = domains.some(d => newRawInputs[d.id]?.trim());
    if (!isAnyFilled) {
      showAlert("Minimal isi salah satu nilai raw data!");
      return;
    }

    setRawBatchList([...rawBatchList, { values: { ...newRawInputs } }]);
    setNewRawInputs({});
  };

  const handleDeleteRawFromBatch = (index: number) => {
    if (mainAppMode === 'PURE_NAME') {
      setPureNameBatchList(pureNameBatchList.filter((_, idx) => idx !== index));
      return;
    }
    setRawBatchList(rawBatchList.filter((_, idx) => idx !== index));
  };

  const handleResetBatch = () => {
    if (mainAppMode === 'PURE_NAME') {
      setPureNameBatchList([...INITIAL_PURE_NAME_BATCH]);
      return;
    }
    setRawBatchList([...INITIAL_RAW_BATCH]);
  };

  const handleClearBatch = () => {
    if (mainAppMode === 'PURE_NAME') {
      setPureNameBatchList([]);
      return;
    }
    setRawBatchList([]);
  };

  // --- MODAL EDIT OPEN & SAVE ---
  const openEditDomainItem = (domainId: string, itemIndex: number) => {
    const domain = domains.find(d => d.id === domainId);
    if (!domain) return;
    setEditModal({
      isOpen: true,
      type: 'DOMAIN_ITEM',
      domainId,
      itemIndex,
      values: { val: domain.items[itemIndex] },
      error: ''
    });
  };

  const openEditRawItem = (rawIndex: number) => {
    const item = rawBatchList[rawIndex];
    setEditModal({
      isOpen: true,
      type: 'RAW_ITEM',
      itemIndex: rawIndex,
      values: { ...item.values },
      error: ''
    });
  };

  const handleSaveModal = () => {
    const { type, domainId, itemIndex, values } = editModal;

    if (type === 'DOMAIN_ITEM' && domainId) {
      const cleanVal = values.val?.trim().toUpperCase();
      if (!cleanVal) return setEditModal({ ...editModal, error: 'Nilai tidak boleh kosong!' });

      setDomains(domains.map(d => {
        if (d.id === domainId) {
          const newItems = [...d.items];
          newItems[itemIndex] = cleanVal;
          return { ...d, items: newItems };
        }
        return d;
      }));
    }
    else if (type === 'RAW_ITEM') {
      const isAnyFilled = domains.some(d => values[d.id]?.trim());
      if (!isAnyFilled) {
        return setEditModal({ ...editModal, error: "Minimal salah satu nilai raw data harus diisi!" });
      }
      const newBatch = [...rawBatchList];
      newBatch[itemIndex] = { values: { ...values } };
      setRawBatchList(newBatch);
    }

    setEditModal({ isOpen: false, type: null, itemIndex: -1, values: {}, error: '' });
  };

  // Active domains for testing based on selected Tab
  const activeDomains = useMemo(
    () => (activeDomainManager && activeDomainManager !== 'ALL')
      ? domains.filter(d => d.id === activeDomainManager)
      : domains,
    [domains, activeDomainManager]
  );

  // --- PROCESS AI ---
  const [streamProgress, setStreamProgress] = useState('');
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (progressRef.current) {
      progressRef.current.scrollTop = progressRef.current.scrollHeight;
    }
  }, [streamProgress]);

  const processAI = async (rawDataToProcess: any[]) => {
    setLoading(true);
    setResults([]);
    setStreamProgress('');

    const runSSE = async (body: Record<string, unknown>): Promise<void> => {
      const response = await fetch('/api/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!response.body) throw new Error('Stream tidak tersedia');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const blocks = buffer.split('\n\n');
        buffer = blocks.pop() ?? '';
        for (const block of blocks) {
          const type = block.match(/^event: (.+)$/m)?.[1];
          const data = block.match(/^data: (.+)$/m)?.[1];
          if (!data) continue;
          const payload = JSON.parse(data);
          if (type === 'progress') {
            setStreamProgress((prev) => (prev + (payload.text ?? '')).slice(-2000));
          } else if (type === 'retry') {
            setStreamProgress((prev) => prev + '\n⚠️ Output tidak valid, mencoba ulang...\n');
          } else if (type === 'result') {
            if (payload.success) {
              setResults(payload.data);
            } else {
              showAlert('Gagal memproses: ' + payload.error, 'API Error');
            }
          } else if (type === 'error') {
            showAlert('Gagal memproses: ' + payload.error, 'API Error');
          }
        }
      }
    };

    try {
      if (mainAppMode === 'PURE_NAME') {
        await runSSE({
          mode: 'PURE_NAME',
          legalRefTable: legalRefList,
          rawData: rawDataToProcess,
        });
        return;
      }

      if (activeDomains.some(d => d.items.length === 0)) {
        showAlert("Domain master yang Anda uji masih kosong. Harap isi minimal 1 item master di domain tersebut!");
        return;
      }

      await runSSE({
        domains: activeDomains,
        rawData: rawDataToProcess,
        thresholds: {
          autoApprove: autoApproveThreshold,
          stewardReview: stewardReviewThreshold
        }
      });
    } catch (err) {
      showAlert('Terjadi kesalahan jaringan saat memanggil AI.', 'Connection Error');
    } finally {
      setLoading(false);
    }
  };

  // Handler Clear Hasil (stabil untuk React.memo)
  const handleClearResults = useCallback(() => setResults([]), []);

  const handleSingleTest = () => {
    if (mainAppMode === 'PURE_NAME') {
      if (!singlePureInput.trim()) {
        showAlert('Masukkan nama perusahaan mentah terlebih dahulu!');
        return;
      }
      processAI([{ raw_val: singlePureInput }]);
      return;
    }

    const targetDomainId = activeDomains[0]?.id;
    if (!singleInputs[targetDomainId]?.trim()) {
      showAlert(`Masukkan nilai raw untuk ${activeDomains[0]?.name || 'Domain'} terlebih dahulu!`);
      return;
    }
    processAI([{ values: { ...singleInputs } }]);
  };

  const handleBatchTest = () => {
    if (mainAppMode === 'PURE_NAME') {
      processAI(pureNameBatchList);
      return;
    }
    processAI(rawBatchList);
  };


  return (
    <main className="min-h-screen p-4 sm:p-6 md:p-10 bg-gray-100 text-gray-900 font-sans relative">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <header className="bg-white p-5 sm:p-6 rounded-lg border border-gray-300 space-y-2">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <div className="text-xs font-bold text-blue-700 uppercase tracking-wider">
              AI Data Quality Engine • Dynamic SSOT Standard
            </div>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded border bg-purple-50 text-purple-700 border-purple-200">
              {mainAppMode === 'PURE_NAME' ? `${legalRefList.length} Legal Noise LOV` : `${domains.length} Domain Aktif`}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Simulasi AI Data Quality & Cleansing
          </h1>
          <p className="text-sm text-gray-600">
            Mencocokkan data mentah berantakan ke <strong className="text-gray-800">Golden Reference Master Data</strong> serta <strong className="text-gray-800">Penormalan & Ekstrak Nama Utama Badan Usaha (Core Entity Cleansing)</strong>.
          </p>
        </header>

        {/* TOP LEVEL MODE SWITCHER */}
        <div className="bg-white p-2 rounded-lg border border-gray-300 flex flex-wrap gap-2 shadow-xs">
          <button
            onClick={() => { setMainAppMode('MATCHING'); setResults([]); }}
            className={`flex-1 min-w-[220px] py-2.5 px-4 rounded-md text-xs font-bold transition flex items-center justify-center gap-2 ${
              mainAppMode === 'MATCHING'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <span>🎯 Mode 1: Pencocokan Master SSOT (Fuzzy Matching Engine)</span>
          </button>

          <button
            onClick={() => { setMainAppMode('PURE_NAME'); setResults([]); }}
            className={`flex-1 min-w-[220px] py-2.5 px-4 rounded-md text-xs font-bold transition flex items-center justify-center gap-2 ${
              mainAppMode === 'PURE_NAME'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <span>🧼 Mode 2: Ekstraksi Nama Utama Badan Usaha (Pure Entity Cleansing)</span>
          </button>
        </div>

        {/* MODE 2 ONLY: TABEL REFERENSI EMBEL-EMBEL LEGALITAS (LOV) */}
        {mainAppMode === 'PURE_NAME' && (
          <div className="bg-white p-4 rounded-lg border border-gray-300 space-y-3 border-l-4 border-l-emerald-600 shadow-xs">
            <div className="flex justify-between items-center flex-wrap gap-2 border-b border-gray-200 pb-2">
              <div>
                <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                  📋 Kamus Referensi Bentuk Hukum & Badan Usaha (Legal Entity LOV)
                </h2>
                <p className="text-xs text-gray-500">
                  Variasi bentukan hukum berikut akan dieliminasi secara otomatis dari nama entitas untuk menghasilkan Nama Utama Badan Usaha (Core Entity Name).
                </p>
              </div>
              <button
                onClick={handleResetLegalRef}
                className="px-3 py-1 text-xs text-gray-600 border border-gray-300 hover:bg-gray-50 rounded font-medium"
              >
                Reset Default LOV
              </button>
            </div>

            {/* Input Add LOV */}
            <div className="flex gap-2 max-w-md">
              <input
                type="text"
                value={newLegalInput}
                onChange={(e) => setNewLegalInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddLegalRef()}
                placeholder="Tambah embel-embel (contoh: KOPERASI, YAYASAN)..."
                className="flex-1 px-3 py-1.5 bg-white border border-gray-300 rounded text-xs focus:outline-none focus:border-emerald-600"
              />
              <button
                onClick={handleAddLegalRef}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded shadow-sm"
              >
                + Tambah Ref
              </button>
            </div>

            {/* Badges List */}
            <div className="flex flex-wrap gap-2 pt-1">
              {legalRefList.map((item, idx) => (
                <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-md text-xs font-bold">
                  {item}
                  <button onClick={() => handleDeleteLegalRef(idx)} className="text-red-500 hover:text-red-700 font-bold ml-1 text-xs">✕</button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* MODE 1 ONLY: DOMAIN TAB SELECTOR, THRESHOLD SLIDERS & MASTER MANAGEMENT */}
        {mainAppMode === 'MATCHING' && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Domain Tab Selector */}
              <div className="lg:col-span-2 bg-white p-4 rounded-lg border border-gray-300 space-y-3 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between flex-wrap gap-2 border-b border-gray-200 pb-2.5">
                    <div>
                      <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wider">🎯 Pilih Domain Referensi yang Ingin Diuji:</h2>
                      <p className="text-xs text-gray-500">Pilih mau menguji Nama Debitur atau Sektor Usaha secara independen ke referensinya.</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-3">
                    {domains.map((d) => (
                      <button
                        key={d.id}
                        onClick={() => {
                          setActiveDomainManager(d.id);
                          setResults([]);
                        }}
                        className={`px-4 py-2 rounded-lg text-xs font-bold border transition flex items-center gap-2 ${
                          (activeDomainManager || domains[0]?.id) === d.id
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
                        }`}
                      >
                        <span>{d.id === 'customer_name' ? '🏢' : d.id === 'sector' ? '🏭' : '📌'}</span>
                        {d.name} ({d.items.length} Master)
                      </button>
                    ))}
                    <button
                      onClick={() => {
                        setActiveDomainManager('ALL');
                        setResults([]);
                      }}
                      className={`px-4 py-2 rounded-lg text-xs font-bold border transition flex items-center gap-2 ${
                        activeDomainManager === 'ALL'
                          ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                          : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      <span>🌐</span>
                      Semua Domain (Multi-Domain)
                    </button>
                  </div>
                </div>
              </div>

              {/* AMBANG BATAS (THRESHOLD) DINAMIS */}
              <div className="bg-white p-4 rounded-lg border border-gray-300 space-y-3 shadow-xs border-l-4 border-l-amber-500">
                <div className="border-b border-gray-200 pb-2">
                  <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center justify-between">
                    <span>⚙️ Level Threshold AI</span>
                    <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">Sensitivitas AI</span>
                  </h2>
                  <p className="text-[11px] text-gray-500">Atur batas persentase kemiripan untuk trigger Steward Review.</p>
                </div>
                
                <div className="space-y-3 text-xs">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="font-bold text-emerald-800">Auto-Approve Min Score:</label>
                      <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">{autoApproveThreshold}%</span>
                    </div>
                    <input
                      type="range"
                      min="80"
                      max="98"
                      value={autoApproveThreshold}
                      onChange={(e) => setAutoApproveThreshold(Number(e.target.value))}
                      className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                    />
                    <div className="text-[10px] text-gray-400 mt-0.5">Skor ≥ {autoApproveThreshold}% otomatis masuk SSOT Clean.</div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="font-bold text-amber-800">Steward Review Min Score:</label>
                      <span className="font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">{stewardReviewThreshold}%</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="89"
                      value={stewardReviewThreshold}
                      onChange={(e) => setStewardReviewThreshold(Number(e.target.value))}
                      className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
                    />
                    <div className="text-[10px] text-gray-400 mt-0.5">Skor {stewardReviewThreshold}% - {autoApproveThreshold - 1}% butuh persetujuan Data Steward.</div>
                  </div>
                </div>
              </div>
            </div>

            {/* TOP BAR: KELOLA DOMAIN DINAMIS */}
            <div className="flex justify-between items-center bg-white p-4 rounded-lg border border-gray-300 flex-wrap gap-3">
              <div>
                <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Pengelola Domain Referensi Master (SSOT)</h2>
                <p className="text-xs text-gray-500">Tambah atau kelola item referensi master di setiap domain.</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleResetDomains}
                  className="px-3 py-1.5 text-xs text-gray-600 border border-gray-300 hover:bg-gray-50 rounded font-medium"
                >
                  Reset Default Domain
                </button>
                <button
                  onClick={() => setAddDomainModal({ isOpen: true, name: '', error: '' })}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded shadow-sm transition"
                >
                  + Tambah Domain Baru
                </button>
              </div>
            </div>

            {/* GRID PENGELOLA SETIAP DOMAIN */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {activeDomains.map((domain, domIdx) => (
                <div key={domain.id} className="bg-white p-4 rounded-lg border border-gray-300 space-y-3 flex flex-col justify-between border-l-4 border-l-blue-600">
                  <div>
                    <div className="flex justify-between items-center border-b border-gray-200 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded">
                          #0{domIdx + 1}
                        </span>
                        <h3 className="text-xs font-bold text-gray-800 uppercase truncate max-w-[150px]">
                          {domain.name}
                        </h3>
                      </div>
                      <div className="flex items-center gap-1">
                        {domIdx > 0 && (
                          <button
                            onClick={() => handleDeleteDomainCategory(domain.id)}
                            className="text-red-500 hover:text-red-700 font-bold px-1.5 py-0.5 hover:bg-red-50 rounded text-xs"
                            title="Hapus Domain ini"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Form Tambah Item Ke Domain */}
                    <div className="mt-3 bg-gray-50 p-2.5 rounded border border-gray-200 space-y-2">
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={newDomainInput[domain.id] || ''}
                          onChange={(e) => setNewDomainInput({ ...newDomainInput, [domain.id]: e.target.value })}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddItemToDomain(domain.id)}
                          placeholder={`Tambah master ${domain.name}...`}
                          className="flex-1 px-2.5 py-1 bg-white border border-gray-300 rounded text-xs focus:outline-none focus:border-blue-600"
                        />
                        <button
                          onClick={() => handleAddItemToDomain(domain.id)}
                          className="px-2.5 py-1 bg-blue-600 text-white text-xs font-bold rounded"
                        >
                          +
                        </button>
                      </div>
                      <div className="flex justify-end gap-2 pt-1 border-t border-gray-200">
                        <button onClick={() => handleClearDomainItems(domain.id)} className="text-[10px] text-red-500 underline">
                          Kosongkan Item
                        </button>
                      </div>
                    </div>

                    {/* List Badges Item Domain */}
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {domain.items.length === 0 && <span className="text-xs text-gray-400 italic">Belum ada item referensi...</span>}
                      {domain.items.map((item, itemIdx) => (
                        <span key={itemIdx} className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-900 border border-blue-200 rounded text-xs font-semibold">
                          {item}
                          <span className="flex gap-0.5 ml-1">
                            <button onClick={() => openEditDomainItem(domain.id, itemIdx)} className="text-blue-600 hover:text-blue-800 text-[10px]">✎</button>
                            <button onClick={() => handleDeleteItemFromDomain(domain.id, itemIdx)} className="text-red-500 hover:text-red-700 text-[10px]">✕</button>
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="text-[11px] text-gray-400 font-mono text-right pt-2 border-t border-gray-100">
                    Total: {domain.items.length} Master Item
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* INPUT PANELS (SINGLE & BATCH) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">

          {/* Single Input */}
          <div className="bg-white p-5 rounded-lg border border-gray-300 space-y-4 flex flex-col justify-between">
            <div>
              <h2 className="font-bold text-base text-gray-900">1. Uji Coba Single Input</h2>
              <p className="text-xs text-gray-600 mt-0.5">
                {mainAppMode === 'PURE_NAME'
                  ? 'Masukkan nama perusahaan mentah yang ingin diuji pembersihannya.'
                  : `Masukkan contoh data mentah untuk domain ${activeDomains.map(d => d.name).join(', ')}.`}
              </p>
            </div>
            <div className="space-y-2.5 pt-2">
              {mainAppMode === 'PURE_NAME' ? (
                <div>
                  <label className="text-[11px] font-bold text-gray-600 uppercase block mb-1">Nama Perusahaan Mentah:</label>
                  <input
                    type="text"
                    value={singlePureInput}
                    onChange={(e) => setSinglePureInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSingleTest()}
                    placeholder="Contoh: PT Bukit Asem (persero) .TBK atau PT JAGA RAYA .tbk..."
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-xs focus:outline-none focus:border-emerald-600 font-semibold text-gray-900"
                  />
                </div>
              ) : (
                activeDomains.map((d) => (
                  <div key={d.id}>
                    <label className="text-[11px] font-bold text-gray-600 uppercase block mb-1">{d.name} Raw:</label>
                    <input
                      type="text"
                      value={singleInputs[d.id] || ''}
                      onChange={(e) => setSingleInputs({ ...singleInputs, [d.id]: e.target.value })}
                      placeholder={d.id === 'customer_name' ? 'Contoh: PT. PLN (Persero) Tbk...' : d.id === 'sector' ? 'Contoh: Listrik & Energi...' : `Masukkan ${d.name}...`}
                      className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded text-xs focus:outline-none focus:border-blue-600"
                    />
                  </div>
                ))
              )}
              <button
                onClick={handleSingleTest}
                disabled={loading}
                className={`w-full py-2.5 mt-2 disabled:bg-gray-300 text-white font-medium rounded text-sm transition shadow-xs ${
                  mainAppMode === 'PURE_NAME'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {loading ? 'Memproses AI...' : mainAppMode === 'PURE_NAME' ? 'Ekstrak Nama Utama ➔' : `Uji Cleansing ${activeDomains[0]?.name || 'Data'} ➔`}
              </button>
            </div>
          </div>

          {/* Batch Input */}
          <div className="bg-white p-5 rounded-lg border border-gray-300 space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <h2 className="font-bold text-base text-gray-900">
                  2. Simulasi Batch ({mainAppMode === 'PURE_NAME' ? pureNameBatchList.length : rawBatchList.length} Data Mentah)
                </h2>
                <div className="flex flex-wrap items-center gap-1.5 pt-1 sm:pt-0">
                  <button
                    onClick={() => setShowBatchManager(!showBatchManager)}
                    className="px-2.5 py-1 text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-800 rounded border border-gray-300 transition shadow-2xs"
                  >
                    {showBatchManager ? '✕ Tutup Pengelola' : '⚙️ Kelola Batch'}
                  </button>
                  <button
                    onClick={handleResetBatch}
                    className="px-2.5 py-1 text-xs font-medium bg-gray-50 text-gray-600 hover:bg-gray-100 rounded border border-gray-200 transition"
                  >
                    Reset
                  </button>
                  <button
                    onClick={handleClearBatch}
                    className="px-2.5 py-1 text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 rounded border border-red-200 transition"
                  >
                    Kosongkan
                  </button>
                </div>
              </div>
            </div>

            {/* Form Edit/Tambah Batch Item */}
            {showBatchManager && (
              <div className="bg-gray-50 p-3 rounded border border-gray-200 space-y-2">
                {mainAppMode === 'PURE_NAME' ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newLegalInput}
                      onChange={(e) => setNewLegalInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddRawToBatch()}
                      placeholder="Masukkan nama perusahaan mentah..."
                      className="flex-1 px-2.5 py-1.5 bg-white border border-gray-300 rounded text-xs"
                    />
                    <button onClick={handleAddRawToBatch} className="px-3 py-1.5 bg-emerald-700 text-white text-xs font-bold rounded">
                      + Tambah Batch
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {activeDomains.map(d => (
                        <input
                          key={d.id}
                          type="text"
                          value={newRawInputs[d.id] || ''}
                          onChange={(e) => setNewRawInputs({ ...newRawInputs, [d.id]: e.target.value })}
                          placeholder={`${d.name} raw...`}
                          className="px-2.5 py-1.5 bg-white border border-gray-300 rounded text-xs"
                        />
                      ))}
                    </div>
                    <button onClick={handleAddRawToBatch} className="w-full py-1.5 bg-gray-800 text-white text-xs font-bold rounded">
                      + Tambah ke List Batch ({activeDomains.map(d => d.name).join(', ')})
                    </button>
                  </>
                )}
              </div>
            )}

            <div className="space-y-3 pt-1">
              <div className="bg-gray-50 p-2.5 rounded border border-gray-200 text-xs space-y-2 max-h-48 overflow-y-auto">
                {mainAppMode === 'PURE_NAME' ? (
                  pureNameBatchList.length === 0 ? <div className="text-gray-400 italic">Batch data kosong...</div> : (
                    pureNameBatchList.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center border-b border-gray-200 pb-1.5 last:border-0">
                        <span className="font-mono font-semibold text-gray-900">• {item.raw_val}</span>
                        {showBatchManager && (
                          <button onClick={() => handleDeleteRawFromBatch(idx)} className="text-red-500 hover:bg-red-50 font-bold px-1.5 py-0.5 rounded text-xs">✕</button>
                        )}
                      </div>
                    ))
                  )
                ) : (
                  rawBatchList.length === 0 ? <div className="text-gray-400 italic">Batch data kosong...</div> : (
                    rawBatchList.map((item, idx) => {
                      const targetDomId = activeDomains[0]?.id;
                      const displayVal = item.values?.[targetDomId] || '-';

                      return (
                        <div key={idx} className="flex justify-between items-center border-b border-gray-200 pb-1.5 last:border-0">
                          <div className="space-y-0.5 truncate pr-2">
                            <div className="font-bold text-gray-900">• {displayVal}</div>
                            {activeDomains.length > 1 && (
                              <div className="text-[10px] text-gray-500 flex flex-wrap gap-2">
                                {activeDomains.slice(1).map(d => (
                                  <span key={d.id}>{d.name}: <strong className="text-gray-700">{item.values?.[d.id] || '-'}</strong></span>
                                ))}
                              </div>
                            )}
                          </div>
                          {showBatchManager && (
                            <div className="flex gap-1 shrink-0">
                              <button onClick={() => openEditRawItem(idx)} className="text-gray-600 hover:bg-gray-200 font-bold px-1.5 py-0.5 rounded text-xs">✎</button>
                              <button onClick={() => handleDeleteRawFromBatch(idx)} className="text-red-500 hover:bg-red-50 font-bold px-1.5 py-0.5 rounded text-xs">✕</button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )
                )}
              </div>

              <button
                onClick={handleBatchTest}
                disabled={loading || (mainAppMode === 'PURE_NAME' ? pureNameBatchList.length === 0 : rawBatchList.length === 0)}
                className={`w-full py-2.5 disabled:bg-gray-300 text-white font-medium rounded text-sm transition shadow-xs ${
                  mainAppMode === 'PURE_NAME' ? 'bg-emerald-800 hover:bg-emerald-900' : 'bg-gray-800 hover:bg-gray-900'
                }`}
              >
                {loading ? 'Memproses Batch...' : `Jalankan Simulasi Batch (${mainAppMode === 'PURE_NAME' ? pureNameBatchList.length : rawBatchList.length} Item)`}
              </button>
            </div>
          </div>

        </div>

        {/* AI STREAMING PROGRESS PANEL */}
        {loading && (
          <div className="bg-gray-900 text-emerald-300 rounded-lg border border-gray-700 p-3 font-mono text-[11px] leading-relaxed shadow-sm">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">⚡ Progress AI (Streaming)</span>
              <span className="animate-pulse text-gray-500">live</span>
            </div>
            <div ref={progressRef} className="max-h-40 overflow-y-auto whitespace-pre-wrap break-words">
              {streamProgress || 'Menunggu respons AI...'}
            </div>
          </div>
        )}

        {/* RESULTS TABEL AUDIT TRAIL */}
        <ResultsPanel
            mode={mainAppMode}
            results={results}
            domains={activeDomains}
            autoApproveThreshold={autoApproveThreshold}
            stewardReviewThreshold={stewardReviewThreshold}
            onClear={handleClearResults}
        />

      </div>

      {/* --- CUSTOM MODALS --- */}
      {editModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-lg font-bold text-gray-900">
                {editModal.type === 'DOMAIN_ITEM' ? 'Edit Item Master' : 'Edit Data Mentah Batch'}
              </h3>
              <button onClick={() => setEditModal({ ...editModal, isOpen: false })} className="text-gray-400 hover:text-gray-700 font-bold px-2">✕</button>
            </div>

            {editModal.error && (
              <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md font-semibold">
                ⚠️ {editModal.error}
              </div>
            )}

            <div className="space-y-3">
              {editModal.type === 'DOMAIN_ITEM' && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Nilai Standar Master:</label>
                  <input
                    type="text"
                    value={editModal.values.val || ''}
                    onChange={(e) => setEditModal({ ...editModal, values: { val: e.target.value } })}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveModal()}
                    className="w-full px-3.5 py-2 border border-gray-300 rounded text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    autoFocus
                  />
                </div>
              )}

              {editModal.type === 'RAW_ITEM' && activeDomains.map(d => (
                <div key={d.id}>
                  <label className="block text-xs font-bold text-gray-700 mb-1">{d.name} Raw:</label>
                  <input
                    type="text"
                    value={editModal.values[d.id] || ''}
                    onChange={(e) => setEditModal({
                      ...editModal,
                      values: { ...editModal.values, [d.id]: e.target.value }
                    })}
                    className="w-full px-3.5 py-2 border border-gray-300 rounded text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
              <button onClick={() => setEditModal({ ...editModal, isOpen: false })} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded">
                Batal
              </button>
              <button onClick={handleSaveModal} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded">
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}

      {addDomainModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-lg font-bold text-gray-900">Tambah Domain Master Baru</h3>
              <button onClick={() => setAddDomainModal({ isOpen: false, name: '', error: '' })} className="text-gray-400 hover:text-gray-700 font-bold px-2">✕</button>
            </div>

            {addDomainModal.error && (
              <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md font-semibold">
                ⚠️ {addDomainModal.error}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Nama Domain Category Baru:</label>
              <input
                type="text"
                placeholder="Contoh: Wilayah / Lokasi, Jenis Debitur..."
                value={addDomainModal.name}
                onChange={(e) => setAddDomainModal({ ...addDomainModal, name: e.target.value, error: '' })}
                onKeyDown={(e) => e.key === 'Enter' && handleAddNewDomainCategory()}
                className="w-full px-3.5 py-2 border border-gray-300 rounded text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                autoFocus
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
              <button onClick={() => setAddDomainModal({ isOpen: false, name: '', error: '' })} className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-semibold rounded">
                Batal
              </button>
              <button onClick={handleAddNewDomainCategory} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded">
                Tambah Domain
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-gray-900">{confirmModal.title}</h3>
            <p className="text-xs text-gray-600 leading-relaxed">{confirmModal.message}</p>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null })} className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-semibold rounded">
                Batal
              </button>
              <button onClick={() => confirmModal.onConfirm && confirmModal.onConfirm()} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded">
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {alertModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2 text-amber-600 font-bold text-base">
              <span>⚠️</span> {alertModal.title}
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">{alertModal.message}</p>
            <div className="flex justify-end pt-2">
              <button onClick={() => setAlertModal({ isOpen: false, title: '', message: '' })} className="px-4 py-2 bg-gray-800 text-white text-sm font-semibold rounded">
                Mengerti
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}

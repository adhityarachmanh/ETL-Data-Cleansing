// File: app/page.tsx
'use client';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between p-6 sm:p-10 font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Header/Brand Bar */}
      <div className="max-w-6xl w-full mx-auto flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded bg-slate-900 flex items-center justify-center text-white font-bold text-xs">
            DMS
          </div>
          <div>
            <span className="font-bold text-sm tracking-tight text-slate-900 uppercase">
              Data Management System
            </span>
          </div>
        </div>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wider">
          Enterprise Portal
        </span>
      </div>

      {/* Main Content Area */}
      <div className="max-w-4xl w-full mx-auto my-12 space-y-10">
        <div className="space-y-3">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Data Quality & Cleansing Portal
          </h1>
          <p className="text-sm text-slate-600 max-w-3xl leading-relaxed">
            Selamat datang di Portal Layanan Kualitas Data. Silakan pilih modul kerja di bawah ini untuk memulai proses validasi, pencocokan data referensi (fuzzy matching), atau pengelolaan kamus tata kelola data perusahaan.
          </p>
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Module 1: Fuzzy Matching SSOT */}
          <div className="bg-white border border-slate-200 rounded-lg p-6 flex flex-col justify-between hover:border-slate-350 hover:shadow-xs transition-all duration-150">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded border border-blue-100 uppercase tracking-wider">
                  Modul 01
                </span>
                <span className="text-[10px] text-slate-400 font-mono">STATUS: ACTIVE</span>
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-bold text-slate-900">
                  Fuzzy Matching SSOT & Entity Resolution
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Melakukan standarisasi data mentah dan pencocokan otomatis (fuzzy matching) dengan Master Golden Reference. Dilengkapi panel Steward Review untuk verifikasi manual data anomali.
                </p>
              </div>
            </div>
            <div className="pt-6 border-t border-slate-100 mt-6 flex justify-between items-center">
              <span className="text-[10px] text-slate-400 font-medium">Layanan Rekonsiliasi Data</span>
              <Link
                href="/simple"
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold transition-colors cursor-pointer"
              >
                Buka Modul
              </Link>
            </div>
          </div>

          {/* Module 2: Governance Studio */}
          <div className="bg-white border border-slate-200 rounded-lg p-6 flex flex-col justify-between hover:border-slate-350 hover:shadow-xs transition-all duration-150">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-100 uppercase tracking-wider">
                  Modul 02
                </span>
                <span className="text-[10px] text-slate-400 font-mono">STATUS: ACTIVE</span>
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-bold text-slate-900">
                  Data Governance Studio & Ruleset Editor
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Menjalankan aturan pembersihan terstruktur sesuai standardisasi format NIK, No Telepon, Email, dan Date. Memungkinkan konfigurasi aturan kolom (Data Dictionary) secara dinamis.
                </p>
              </div>
            </div>
            <div className="pt-6 border-t border-slate-100 mt-6 flex justify-between items-center">
              <span className="text-[10px] text-slate-400 font-medium">Layanan Tata Kelola Data</span>
              <Link
                href="/governance"
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold transition-colors cursor-pointer"
              >
                Buka Modul
              </Link>
            </div>
          </div>

        </div>
      </div>

      {/* Footer Bar */}
      <div className="max-w-6xl w-full mx-auto border-t border-slate-200 pt-4 flex flex-col sm:flex-row justify-between items-center gap-2 text-[10px] text-slate-500 font-mono">
        <div>CORE SYSTEM LATENCY: STABLE | DB CONNECTION: ONLINE</div>
        <div>&copy; 2026 Data Management System. All Rights Reserved.</div>
      </div>
    </main>
  );
}

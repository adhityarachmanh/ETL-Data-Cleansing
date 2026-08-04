/* eslint-disable @typescript-eslint/no-explicit-any, prefer-const, @typescript-eslint/no-unused-vars */
import React from 'react';
import Link from 'next/link';
import { Sparkles, Download, RefreshCw, FileText, Settings, CheckCircle2 } from 'lucide-react';
import { QualityMetrics } from '../types';

interface NavbarProps {
  metrics: QualityMetrics;
  onOpenAiAssistant: () => void;
  onOpenExport: () => void;
  onResetData: () => void;
  activeTab: 'data' | 'rules' | 'metrics';
  setActiveTab: (tab: 'data' | 'rules' | 'metrics') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  metrics,
  onOpenAiAssistant,
  onOpenExport,
  onResetData,
  activeTab,
  setActiveTab
}) => {
  return (
    <header className="bg-white border-b border-slate-200 text-slate-900 sticky top-0 z-30 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 gap-3">

          {/* Logo & Identity */}
          <div className="flex items-center space-x-2.5 shrink-0">
            <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-all cursor-pointer" title="Kembali ke Beranda">
              <div className="w-8 h-8 rounded-md bg-slate-900 flex items-center justify-center text-white font-bold text-sm shadow-xs">
                DC
              </div>
              <span className="font-bold text-base tracking-tight text-slate-900 hidden sm:inline">
                Data Governance Engine
              </span>
            </Link>
            <span className="hidden md:inline-block text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase tracking-wider">
              v2.4
            </span>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center space-x-1 bg-slate-100 p-1 rounded-md border border-slate-200">
            <button
              onClick={() => setActiveTab('data')}
              className={`px-2.5 sm:px-3 py-1 rounded text-xs font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'data'
                  ? 'bg-white text-slate-900 font-semibold shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Validation</span>
            </button>
            <button
              onClick={() => setActiveTab('rules')}
              className={`px-2.5 sm:px-3 py-1 rounded text-xs font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'rules'
                  ? 'bg-white text-slate-900 font-semibold shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Rule Logic</span>
            </button>
            <button
              onClick={() => setActiveTab('metrics')}
              className={`px-2.5 sm:px-3 py-1 rounded text-xs font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'metrics'
                  ? 'bg-white text-slate-900 font-semibold shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Audit ({metrics.overallScore}%)</span>
            </button>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center space-x-1.5 shrink-0">
            <button
              onClick={onOpenAiAssistant}
              className="px-2.5 sm:px-3 py-1.5 rounded-md bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer"
              title="Analisis AI & Rekomendasi Aturan"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600 animate-pulse" />
              <span className="hidden md:inline">AI Analysis</span>
            </button>

            <button
              onClick={onOpenExport}
              className="px-2.5 sm:px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium flex items-center space-x-1.5 shadow-xs transition-all cursor-pointer"
              title="Export Governed Data"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Export</span>
            </button>

            <button
              onClick={onResetData}
              className="p-2 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title="Reset ke Raw Data Awal"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};

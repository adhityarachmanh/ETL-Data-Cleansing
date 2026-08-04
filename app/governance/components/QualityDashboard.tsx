/* eslint-disable @typescript-eslint/no-explicit-any, prefer-const, @typescript-eslint/no-unused-vars */
import React from 'react';
import { ShieldCheck, AlertTriangle, CopyCheck, CheckCircle, Percent, BarChart3, Database } from 'lucide-react';
import { QualityMetrics, GovernanceDictionary } from '../types';

interface QualityDashboardProps {
  metrics: QualityMetrics;
  dictionary: GovernanceDictionary;
}

export const QualityDashboard: React.FC<QualityDashboardProps> = ({
  metrics,
  dictionary
}) => {
  const getScoreBadgeColor = (score: number) => {
    if (score >= 90) return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600';
    if (score >= 70) return 'bg-amber-500/10 border-amber-500/30 text-amber-600';
    return 'bg-rose-500/10 border-rose-500/30 text-rose-600';
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-6 h-6 text-indigo-600" />
            <h2 className="text-xl font-bold text-slate-900">
              Data Governance Quality Audit Score
            </h2>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Evaluasi kepatuhan data terhadap standar referensi: <span className="font-semibold text-slate-700">{dictionary.name}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className={`px-4 py-2 rounded-xl border flex items-center space-x-3 ${getScoreBadgeColor(metrics.overallScore)}`}>
            <Percent className="w-6 h-6" />
            <div>
              <div className="text-2xl font-black text-slate-900">{metrics.overallScore}%</div>
              <div className="text-[10px] font-semibold tracking-wider uppercase opacity-80">Skor Governance</div>
            </div>
          </div>

          <div className="px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center space-x-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <div>
              <div className="text-[10px] font-bold tracking-wider uppercase text-emerald-800">Engine Auto-Execute</div>
              <div className="text-[10px] text-emerald-700 font-medium">
                {metrics.totalRows} baris diproses otomatis
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid KPI Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
        {/* Completeness */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Kelengkapan (Completeness)</span>
            <Database className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {metrics.completeness}%
          </div>
          <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-blue-500 h-full rounded-full transition-all duration-500" style={{ width: `${metrics.completeness}%` }} />
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Rasio sel terisi tanpa nilai null.
          </p>
        </div>

        {/* Validity */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Keabsahan (Validity)</span>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {metrics.validity}%
          </div>
          <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${metrics.validity}%` }} />
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Format sesuai NIK/Telp/Email/Date.
          </p>
        </div>

        {/* Uniqueness */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Keunikan (Uniqueness)</span>
            <CopyCheck className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {metrics.uniqueness}%
          </div>
          <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-purple-500 h-full rounded-full transition-all duration-500" style={{ width: `${metrics.uniqueness}%` }} />
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            {metrics.duplicateCount} baris duplikat terdeteksi.
          </p>
        </div>

        {/* Accuracy */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Akurasi (Accuracy)</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {metrics.accuracy}%
          </div>
          <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${metrics.accuracy}%` }} />
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            {metrics.errorCount} baris ber-anomali/cacat.
          </p>
        </div>

        {/* Consistency */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 col-span-2 md:col-span-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Konsistensi (Consistency)</span>
            <BarChart3 className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {metrics.consistency}%
          </div>
          <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-cyan-500 h-full rounded-full transition-all duration-500" style={{ width: `${metrics.consistency}%` }} />
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            {metrics.modifiedCellCount} sel berhasil diseragamkan.
          </p>
        </div>
      </div>

      {/* Governance Policy Highlights */}
      <div className="mt-6 p-4 rounded-xl bg-blue-50/60 border border-blue-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs text-blue-900">
        <div>
          <span className="font-bold">Strategi Penanganan Null:</span> {dictionary.nullStrategy === 'fill_default' ? 'Isi dengan nilai default standar' : dictionary.nullStrategy === 'flag_anomaly' ? 'Tandai sebagai anomali data' : 'Hapus baris yang null'}
          <span className="mx-2">•</span>
          <span className="font-bold">Kunci Dekuplikasi:</span> [{dictionary.deduplicationKeys.join(', ')}]
        </div>
        <div className="font-semibold text-indigo-600">
          Total Baris: {metrics.totalRows} | Total Kolom Ditata: {metrics.totalColumns}
        </div>
      </div>
    </div>
  );
};

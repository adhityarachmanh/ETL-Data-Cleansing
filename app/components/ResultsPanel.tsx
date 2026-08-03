// File: app/components/ResultsPanel.tsx
'use client';
import { memo, useMemo } from 'react';

interface Domain {
    id: string;
    name: string;
    items: string[];
}

interface ResultRow {
    raw_index?: number;
    original?: string;
    cleansed_pure_name?: string | null;
    stripped_noise?: string[];
    domain_matches?: { [key: string]: { raw_val?: string; matched_val?: string; confidence?: number } };
    ai_status?: string;
    warning_note?: string | null;
}

interface ResultsPanelProps {
    mode: 'MATCHING' | 'PURE_NAME';
    results: ResultRow[];
    domains: Domain[];
    autoApproveThreshold: number;
    stewardReviewThreshold: number;
    onClear: () => void;
}

function getRowAverageScore(row: ResultRow, domains: Domain[]): number {
    if (!row.domain_matches) return 0;
    const scores = domains.map((d) => Number(row.domain_matches?.[d.id]?.confidence || 0));
    if (scores.length === 0) return 0;
    return scores.reduce((a, b) => a + b, 0) / scores.length;
}

function isRecordClean(row: ResultRow, mode: string, domains: Domain[], autoApproveThreshold: number): boolean {
    if (mode === 'PURE_NAME') return true;
    const avgScore = getRowAverageScore(row, domains);
    return row.ai_status === 'AUTO_APPROVE' || avgScore >= autoApproveThreshold;
}

function isRecordReview(row: ResultRow, mode: string, domains: Domain[], autoApproveThreshold: number, stewardReviewThreshold: number): boolean {
    if (mode === 'PURE_NAME') return false;
    const avgScore = getRowAverageScore(row, domains);
    return !isRecordClean(row, mode, domains, autoApproveThreshold)
        && (row.ai_status === 'REVIEW' || (avgScore >= stewardReviewThreshold && avgScore < autoApproveThreshold));
}

function ResultsPanel({ mode, results, domains, autoApproveThreshold, stewardReviewThreshold, onClear }: ResultsPanelProps) {
    const getStatusBadge = (row: ResultRow) => {
        if (mode === 'PURE_NAME') {
            return <span className="px-2.5 py-1 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">CLEANSED 100%</span>;
        }
        if (isRecordClean(row, mode, domains, autoApproveThreshold)) {
            return <span className="px-2.5 py-1 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">AUTO APPROVE</span>;
        }
        if (isRecordReview(row, mode, domains, autoApproveThreshold, stewardReviewThreshold)) {
            return <span className="px-2.5 py-1 rounded text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">STEWARD REVIEW</span>;
        }
        return <span className="px-2.5 py-1 rounded text-xs font-semibold bg-red-100 text-red-800 border border-red-300">NO MATCH</span>;
    };

    const stats = useMemo(() => {
        const totalCount = results.length;
        const autoApproveCount = results.filter((r) => isRecordClean(r, mode, domains, autoApproveThreshold)).length;
        const reviewCount = results.filter((r) => isRecordReview(r, mode, domains, autoApproveThreshold, stewardReviewThreshold)).length;
        const cleanRate = totalCount > 0 ? Math.round((autoApproveCount / totalCount) * 100) : 0;
        return { totalCount, autoApproveCount, reviewCount, cleanRate };
    }, [results, mode, domains, autoApproveThreshold, stewardReviewThreshold]);

    return (
        <>
{results.length > 0 && (
  <div className="space-y-5 pt-4">

    {/* KPI Cards Ringkasan */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
      <div className="bg-white p-4 rounded-lg border border-gray-300">
        <div className="text-xs font-semibold text-gray-500">Total Raw Processed</div>
        <div className="text-xl font-bold text-gray-900 mt-1">{stats.totalCount} Record</div>
      </div>
      <div className="bg-white p-4 rounded-lg border border-gray-300 border-l-4 border-l-emerald-500">
        <div className="text-xs font-semibold text-emerald-800">SSOT Clean</div>
        <div className="text-xl font-bold text-emerald-900 mt-1">{stats.autoApproveCount} Record</div>
      </div>
      <div className="bg-white p-4 rounded-lg border border-gray-300 border-l-4 border-l-amber-500">
        <div className="text-xs font-semibold text-amber-800">Steward Review</div>
        <div className="text-xl font-bold text-amber-900 mt-1">{stats.reviewCount} Record</div>
      </div>
      <div className="bg-white p-4 rounded-lg border border-gray-300 border-l-4 border-l-blue-500">
        <div className="text-xs font-semibold text-blue-800">Clean Rate</div>
        <div className="text-xl font-bold text-blue-900 mt-1">{stats.cleanRate}%</div>
      </div>
    </div>

    {/* Dynamic Results Table */}
    <div className="bg-white rounded-lg border border-gray-300 overflow-hidden shadow-sm">
      <div className="p-4 bg-gray-50 border-b border-gray-300 flex justify-between items-center">
        <div>
          <h2 className="font-bold text-sm text-gray-900">
            {mode === 'PURE_NAME'
              ? 'Audit Trail Ekstraksi & Penormalan Nama Utama Entitas'
              : `Audit Trail Cleansing (${domains.map(d => d.name).join(' & ')})`}
          </h2>
          <p className="text-[11px] text-gray-500">
            {mode === 'PURE_NAME'
              ? 'Hasil reduksi atribut bentuk hukum (PT, CV, Persero, Tbk) untuk menghasilkan Nama Utama Entitas Baku (Core Entity Name)'
              : 'Hasil perbandingan Data Mentah (Before) vs Master Reference (After)'}
          </p>
        </div>
        <button
          onClick={() => onClear()}
          className="px-3 py-1 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 text-xs font-medium rounded transition shadow-sm"
        >
          Clear Hasil
        </button>
      </div>

      {/* MODE 2 PURE NAME RESULTS VIEW */}
      {mode === 'PURE_NAME' ? (
        <div>
          {/* VIEW 1: CARD VIEW FOR MOBILE & TABLET (<1024px) */}
          <div className="block lg:hidden p-4 space-y-4 bg-gray-50">
            {results.map((row, idx) => (
              <div key={idx} className="bg-white p-4 rounded-lg border border-gray-300 shadow-xs space-y-3">
                {/* Card Header */}
                <div className="flex justify-between items-center border-b border-gray-200 pb-2.5 flex-wrap gap-2">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 bg-gray-100 text-gray-800 rounded border border-gray-200">
                    Record #{idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
                  </span>
                  <span className="px-2.5 py-1 rounded text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    CLEANSED 100%
                  </span>
                </div>

                {/* Card Details */}
                <div className="space-y-2.5 text-xs">
                  {/* Raw Input */}
                  <div className="bg-gray-50 p-2.5 rounded border border-gray-200 space-y-1">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                      🔴 Data Mentah Entitas (Raw Input):
                    </span>
                    <span className="font-mono font-semibold text-gray-900 block break-all">
                      {row.original || '-'}
                    </span>
                  </div>

                  {/* Stripped Legal Noise */}
                  <div className="bg-amber-50/50 p-2.5 rounded border border-amber-200 space-y-1">
                    <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                      🔸 Bentuk Hukum Tereliminasi (Legal Noise):
                    </span>
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {Array.isArray(row.stripped_noise) && row.stripped_noise.length > 0 ? (
                        row.stripped_noise.map((noise: string, nIdx: number) => (
                          <span key={nIdx} className="px-2 py-0.5 bg-amber-100 text-amber-900 rounded font-mono text-[10px] font-bold border border-amber-300">
                            {noise}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-400 italic text-[11px]">Tidak ada embel-embel</span>
                      )}
                    </div>
                  </div>

                  {/* Cleansed Core Name */}
                  <div className="bg-emerald-50 p-2.5 rounded border border-emerald-200 space-y-1">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                      🟢 Nama Utama Entitas Baku (Core Entity Name):
                    </span>
                    <span className="font-bold text-emerald-950 font-sans text-sm block">
                      {row.cleansed_pure_name || '-'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* VIEW 2: TABLE VIEW FOR DESKTOP (>=1024px) */}
          <div className="hidden lg:block overflow-x-auto p-4">
            <table className="w-full text-xs text-left min-w-[650px] border-collapse">
              <thead className="bg-emerald-50 text-emerald-900 border-b border-emerald-200 uppercase font-bold text-[11px] tracking-wider">
                <tr>
                  <th className="px-4 py-3.5 w-1/3">DATA MENTAH ENTITAS (RAW INPUT)</th>
                  <th className="px-4 py-3.5 w-1/4">BENTUK HUKUM TERELIMINASI (LEGAL SUFFIX/PREFIX)</th>
                  <th className="px-4 py-3.5 w-1/3">NAMA UTAMA ENTITAS BAKU (CORE ENTITY NAME)</th>
                  <th className="px-4 py-3.5 text-center">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {results.map((row, idx) => (
                  <tr key={idx} className="hover:bg-emerald-50/20 transition-colors">
                    <td className="px-4 py-3 font-mono font-semibold text-gray-900 bg-gray-50/50">
                      {row.original || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {Array.isArray(row.stripped_noise) && row.stripped_noise.length > 0 ? (
                          row.stripped_noise.map((noise: string, nIdx: number) => (
                            <span key={nIdx} className="px-2 py-0.5 bg-amber-100 text-amber-900 rounded font-mono text-[10px] font-bold border border-amber-300">
                              {noise}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400 italic text-[11px]">Tidak ada embel-embel</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-950 font-bold font-sans text-sm rounded border border-emerald-300 shadow-2xs">
                        {row.cleansed_pure_name || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center align-middle whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        CLEANSED 100%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <>
          {/* VIEW 1: CARD VIEW FOR MOBILE & TABLET (<1024px) */}
      <div className="block lg:hidden p-4 space-y-4 bg-gray-50">
        {results.map((row, idx) => (
          <div key={idx} className="bg-white p-4 rounded-lg border border-gray-300 shadow-xs space-y-3">
            {/* Card Header: Record # & Status */}
            <div className="flex justify-between items-center border-b border-gray-200 pb-2.5 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-2 py-0.5 bg-gray-100 text-gray-800 rounded border border-gray-200">
                  Record #{idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
                </span>
              </div>
              <div>
                {getStatusBadge(row)}
              </div>
            </div>

            {/* Warning Anomali Banner (If Present) */}
            {row.warning_note && (
              <div className="p-2.5 bg-amber-50 border border-amber-300 text-amber-900 text-xs rounded-md font-medium flex items-start gap-2 leading-snug">
                <span className="shrink-0 text-amber-600 font-bold">⚠️ Anomali:</span>
                <span>{row.warning_note}</span>
              </div>
            )}

            {/* Grid Before vs After per Active Domain */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* BEFORE */}
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 space-y-2">
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                  <span>🔴</span> RAW DATA (BEFORE)
                </div>
                <div className="space-y-1.5">
                  {domains.map((d) => (
                    <div key={d.id} className="text-xs">
                      <span className="text-[10px] text-gray-400 font-semibold block">{d.name}:</span>
                      <span className="font-mono font-semibold text-gray-900 bg-white px-2 py-1 rounded border border-gray-200 block break-all mt-0.5">
                        {row.domain_matches?.[d.id]?.raw_val || '-'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* AFTER */}
              <div className="bg-emerald-50/50 p-3 rounded-lg border border-emerald-200 space-y-2">
                <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                  <span>🟢</span> SSOT MATCHED (AFTER)
                </div>
                <div className="space-y-1.5">
                  {domains.map((d) => {
                    const matchedVal = row.domain_matches?.[d.id]?.matched_val;
                    const isNotFound = matchedVal === 'TIDAK DITEMUKAN';
                    return (
                      <div key={d.id} className="text-xs">
                        <span className="text-[10px] text-emerald-700/70 font-semibold block">{d.name} Standard:</span>
                        <span
                          className={`font-bold px-2 py-1 rounded block mt-0.5 ${isNotFound
                              ? 'bg-red-50 text-red-600 border border-red-200 italic'
                              : 'bg-white text-emerald-900 border border-emerald-200'
                            }`}
                        >
                          {matchedVal || '-'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer: Confidence Scores */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100 flex-wrap gap-2 text-xs">
              <span className="text-gray-500 font-semibold text-[11px]">Skor Kemiripan AI:</span>
              <div className="flex gap-2 flex-wrap">
                {domains.map((d) => {
                  const score = Number(row.domain_matches?.[d.id]?.confidence || 0);
                  let scoreColor = 'text-red-600 bg-red-50 border-red-200';
                  if (score >= 80) scoreColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
                  else if (score >= 60) scoreColor = 'text-amber-700 bg-amber-50 border-amber-200';

                  return (
                    <div key={d.id} className="flex items-center gap-1">
                      <span className="text-[10px] text-gray-400 font-mono">{d.name}:</span>
                      <span className={`font-mono font-bold px-2 py-0.5 rounded border text-[11px] ${scoreColor}`}>
                        {score}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        ))}
      </div>

      {/* VIEW 2: TABLE VIEW FOR DESKTOP (>=1024px) */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-xs text-left min-w-[750px] border-collapse">
          <thead className="bg-gray-100 text-gray-700 border-b border-gray-300 uppercase font-bold text-[11px] tracking-wider">
            <tr>
              <th className="px-4 py-3.5 w-1/3">RAW DATA (BEFORE)</th>
              <th className="px-4 py-3.5 w-1/3">SSOT MATCHED (AFTER)</th>
              {domains.map((d) => (
                <th key={d.id} className="px-3 py-3.5 text-center whitespace-nowrap">
                  {d.name} SCORE
                </th>
              ))}
              <th className="px-4 py-3.5 text-center">STATUS AI</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {results.map((row, idx) => (
              <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                {/* BEFORE */}
                <td className="px-4 py-3 font-sans align-top">
                  <div className="space-y-2">
                    {domains.map((d) => (
                      <div key={d.id} className="flex flex-col">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                          {d.name}
                        </span>
                        <span className="inline-block mt-0.5 font-mono text-gray-900 bg-gray-100 px-2 py-1 rounded border border-gray-200 font-semibold break-all text-[11px]">
                          {row.domain_matches?.[d.id]?.raw_val || '-'}
                        </span>
                      </div>
                    ))}
                    {row.warning_note && (
                      <div className="mt-2 p-2 bg-amber-50 border border-amber-300 text-amber-900 text-[11px] rounded font-medium flex items-start gap-1.5 leading-snug">
                        <span className="shrink-0 text-amber-600 font-bold">⚠️ Anomali:</span>
                        <span>{row.warning_note}</span>
                      </div>
                    )}
                  </div>
                </td>

                {/* AFTER */}
                <td className="px-4 py-3 font-sans align-top">
                  <div className="space-y-2">
                    {domains.map((d) => {
                      const matchedVal = row.domain_matches?.[d.id]?.matched_val;
                      const isNotFound = matchedVal === 'TIDAK DITEMUKAN';
                      return (
                        <div key={d.id} className="flex flex-col">
                          <span className="text-[10px] font-bold text-emerald-700/70 uppercase tracking-tight">
                            {d.name} Standard
                          </span>
                          <span
                            className={`inline-block mt-0.5 px-2 py-1 rounded font-bold text-[11px] ${isNotFound
                                ? 'bg-red-50 text-red-600 border border-red-200 italic'
                                : 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                              }`}
                          >
                            {matchedVal || '-'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </td>

                {/* SCORES PER DOMAIN */}
                {domains.map((d) => {
                  const score = Number(row.domain_matches?.[d.id]?.confidence || 0);
                  let scoreColor = 'text-red-600 bg-red-50 border-red-200';
                  if (score >= 80) scoreColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
                  else if (score >= 60) scoreColor = 'text-amber-700 bg-amber-50 border-amber-200';

                  return (
                    <td key={d.id} className="px-3 py-3 text-center align-middle">
                      <span className={`inline-block font-mono font-bold px-2.5 py-1 rounded border text-xs shadow-2xs ${scoreColor}`}>
                        {score}%
                      </span>
                    </td>
                  );
                })}

                {/* STATUS */}
                <td className="px-4 py-3 text-center align-middle whitespace-nowrap">
                  {getStatusBadge(row)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </>
    )}
    </div>

  </div>
)}

        </>
    );
}

export default memo(ResultsPanel);

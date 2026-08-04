/* eslint-disable @typescript-eslint/no-explicit-any, prefer-const, @typescript-eslint/no-unused-vars */
import React, { useState } from 'react';
import { Search, AlertCircle, CheckCircle, Copy, Eye, Info, ShieldCheck } from 'lucide-react';
import { CleansedRecord, GovernanceDictionary, CellChangeLog } from '../types';

interface DataGridComparisonProps {
  rawRows: Record<string, any>[];
  cleansedRecords: CleansedRecord[];
  dictionary: GovernanceDictionary;
}

export const DataGridComparison: React.FC<DataGridComparisonProps> = ({
  rawRows,
  cleansedRecords,
  dictionary
}) => {
  const [viewMode, setViewMode] = useState<'cleansed' | 'raw' | 'split'>('cleansed');
  const [filterMode, setFilterMode] = useState<'all' | 'modified' | 'errors' | 'duplicates'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAuditLog, setSelectedAuditLog] = useState<{ row: CleansedRecord; log?: CellChangeLog } | null>(null);

  // Filter records
  const filteredRecords = cleansedRecords.filter(rec => {
    // Search matching
    const searchMatch = !searchTerm || Object.values(rec).some(val => 
      String(val || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (!searchMatch) return false;

    if (filterMode === 'duplicates') return rec._isDuplicate;
    if (filterMode === 'errors') return rec._hasError;
    if (filterMode === 'modified') {
      return rec._auditTrail.some(a => a.status === 'modified' || a.status === 'imputed');
    }
    return true;
  });

  const getCellStatusBadge = (status: CellChangeLog['status']) => {
    switch (status) {
      case 'modified':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'imputed':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'error':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'valid':
      default:
        return 'text-slate-700 border-transparent';
    }
  };

  const headers = dictionary.rules.map(r => r.targetColumnName);
  const rawHeaders = dictionary.rules.map(r => r.columnName);

  return (
    <div className="space-y-3">
      {/* Control Bar */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-3 shadow-xs">
        
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search records (Name, NIK, Email, Tel)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-md pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:ring-1 focus:ring-indigo-500 outline-none"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-1 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
              filterMode === 'all'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All ({cleansedRecords.length})
          </button>
          <button
            onClick={() => setFilterMode('modified')}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition-all flex items-center space-x-1 ${
              filterMode === 'modified'
                ? 'bg-indigo-600 text-white'
                : 'text-indigo-600 hover:bg-indigo-50'
            }`}
          >
            <CheckCircle className="w-3 h-3" />
            <span>Cleansed ({cleansedRecords.filter(r => r._auditTrail.some(a => a.status === 'modified' || a.status === 'imputed')).length})</span>
          </button>
          <button
            onClick={() => setFilterMode('errors')}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition-all flex items-center space-x-1 ${
              filterMode === 'errors'
                ? 'bg-rose-600 text-white'
                : 'text-rose-600 hover:bg-rose-50'
            }`}
          >
            <AlertCircle className="w-3 h-3" />
            <span>Errors ({cleansedRecords.filter(r => r._hasError).length})</span>
          </button>
          <button
            onClick={() => setFilterMode('duplicates')}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition-all flex items-center space-x-1 ${
              filterMode === 'duplicates'
                ? 'bg-purple-600 text-white'
                : 'text-purple-600 hover:bg-purple-50'
            }`}
          >
            <Copy className="w-3 h-3" />
            <span>Duplicates ({cleansedRecords.filter(r => r._isDuplicate).length})</span>
          </button>
        </div>

        {/* View Switcher Mode */}
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-md border border-slate-200">
          <button
            onClick={() => setViewMode('cleansed')}
            className={`px-2.5 py-1 rounded text-xs font-medium ${
              viewMode === 'cleansed' ? 'bg-white text-indigo-700 shadow-xs font-bold' : 'text-slate-600'
            }`}
          >
            Cleaned View
          </button>
          <button
            onClick={() => setViewMode('split')}
            className={`px-2.5 py-1 rounded text-xs font-medium ${
              viewMode === 'split' ? 'bg-white text-indigo-700 shadow-xs font-bold' : 'text-slate-600'
            }`}
          >
            Transformation Diff
          </button>
          <button
            onClick={() => setViewMode('raw')}
            className={`px-2.5 py-1 rounded text-xs font-medium ${
              viewMode === 'raw' ? 'bg-white text-indigo-700 shadow-xs font-bold' : 'text-slate-600'
            }`}
          >
            Raw Input
          </button>
        </div>

      </div>

      {/* Main Table Container (Desktop only) */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs hidden lg:block">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-separate border-spacing-0 text-xs">
            
            {/* Header */}
            <thead>
              <tr className="bg-slate-100/90 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <th className="sticky left-0 z-20 py-2.5 px-3 w-12 text-center border-r border-b border-slate-200 bg-slate-100">ID</th>
                <th className="sticky left-12 z-20 py-2.5 px-3 w-28 border-r border-b border-slate-200 bg-slate-100">Governance</th>
                
                {/* Headers dynamically based on viewMode */}
                {viewMode === 'split' ? (
                  <>
                    <th className="py-2.5 px-3 bg-rose-50/50 text-rose-800 border-r border-b border-slate-200">
                      Raw Input (Dirty)
                    </th>
                    <th className="py-2.5 px-3 bg-emerald-50/50 text-emerald-800 border-r border-b border-slate-200">
                      Governed Reference (Clean)
                    </th>
                  </>
                ) : viewMode === 'raw' ? (
                  rawHeaders.map((h, i) => (
                    <th key={i} className="py-2.5 px-3 font-mono text-slate-700 border-r border-b border-slate-200">
                      {h}
                    </th>
                  ))
                ) : (
                  headers.map((h, i) => (
                    <th key={i} className="py-2.5 px-3 font-semibold text-slate-800 border-r border-b border-slate-200">
                      {h}
                    </th>
                  ))
                )}
                
                <th className="sticky right-0 z-20 py-2.5 px-3 text-right border-b border-slate-200 bg-slate-100">Action</th>
              </tr>
            </thead>

            {/* Body Rows */}
            <tbody className="text-slate-800 font-mono text-[11px]">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-10 text-center text-slate-400 font-sans">
                    <Info className="w-6 h-6 mx-auto mb-1.5 opacity-50" />
                    <p className="font-medium">No records match the active filter criteria.</p>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec, rowIdx) => {
                  const rawRow = rawRows[rec._rowId - 1] || {};
                  const rowBorder = rowIdx > 0 ? 'border-t border-slate-100' : '';
                  const stickyBg = rec._isDuplicate ? 'bg-purple-50' : rec._hasError ? 'bg-rose-50' : 'bg-white';
                  const stickyLeftShadow = 'shadow-[2px_0_6px_-2px_rgba(0,0,0,0.15)]';
                  const stickyRightShadow = 'shadow-[-2px_0_6px_-2px_rgba(0,0,0,0.15)]';

                  return (
                    <tr
                      key={rec._rowId}
                      className={`hover:bg-slate-50/90 transition-colors divide-x divide-slate-100 ${
                        rec._isDuplicate ? 'bg-purple-50/30' : rec._hasError ? 'bg-rose-50/30' : ''
                      }`}
                    >
                      <td className={`sticky left-0 z-10 ${stickyBg} ${stickyLeftShadow} ${rowBorder} py-2 px-3 text-center text-slate-400 font-mono text-[10px]`}>
                        0x{rec._rowId.toString(16).padStart(3, '0').toUpperCase()}
                      </td>

                      {/* Status Badges */}
                      <td className={`sticky left-12 z-10 ${stickyBg} ${stickyLeftShadow} ${rowBorder} py-2 px-3 whitespace-nowrap font-sans`}>
                        <div className="flex flex-col gap-0.5 items-start">
                          {rec._isDuplicate && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-50 text-purple-700 border border-purple-200 flex items-center space-x-1">
                              <Copy className="w-2.5 h-2.5" />
                              <span>DUPLICATE</span>
                            </span>
                          )}
                          {rec._hasError && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center space-x-1">
                              <AlertCircle className="w-2.5 h-2.5" />
                              <span>ANOMALY</span>
                            </span>
                          )}
                          {!rec._hasError && !rec._isDuplicate && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center space-x-1">
                              <CheckCircle className="w-2.5 h-2.5" />
                              <span>VALID</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Split View Comparison */}
                      {viewMode === 'split' ? (
                        <>
                          {/* Raw Record Summary */}
                          <td className={`py-2 px-3 text-rose-700 bg-rose-50/30 font-medium ${rowBorder}`}>
                            <div className="space-y-0.5">
                              {Object.entries(rawRow).map(([k, v]) => (
                                <div key={k} className="truncate max-w-xs">
                                  <span className="text-slate-400 text-[10px]">{k}:</span> <span>{String(v || 'null')}</span>
                                </div>
                              ))}
                            </div>
                          </td>

                          {/* Cleansed Record Summary */}
                          <td className={`py-2 px-3 text-emerald-800 bg-emerald-50/30 font-medium ${rowBorder}`}>
                            <div className="space-y-0.5">
                              {dictionary.rules.map(r => {
                                const log = rec._auditTrail.find(a => a.columnName === r.targetColumnName);
                                const isModified = log?.status === 'modified' || log?.status === 'imputed';

                                return (
                                  <div key={r.targetColumnName} className="flex items-center space-x-1 truncate max-w-xs">
                                    <span className="text-slate-400 text-[10px]">{r.targetColumnName}:</span>
                                    <span className={isModified ? 'bg-indigo-100 text-indigo-900 px-1 rounded' : ''}>
                                      {String(rec[r.targetColumnName] || 'NULL')}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </td>
                        </>
                      ) : viewMode === 'raw' ? (
                        /* Raw Data Columns */
                        rawHeaders.map((rh, i) => (
                          <td key={i} className={`py-2 px-3 text-rose-700 ${rowBorder}`}>
                            {String(rawRow[rh] || 'null')}
                          </td>
                        ))
                      ) : (
                        /* Cleansed Data Columns */
                        dictionary.rules.map(rule => {
                          const val = rec[rule.targetColumnName];
                          const log = rec._auditTrail.find(a => a.columnName === rule.targetColumnName);
                          const statusClass = getCellStatusBadge(log?.status || 'valid');

                          return (
                            <td key={rule.targetColumnName} className={`py-2 px-3 ${rowBorder}`}>
                              <div
                                onClick={() => setSelectedAuditLog({ row: rec, log })}
                                className={`inline-block px-1.5 py-0.5 rounded border text-[11px] cursor-pointer transition-all ${statusClass}`}
                                title={log?.message || 'Standardized'}
                              >
                                <span>{String(val || '')}</span>
                                {log?.status === 'modified' && (
                                  <span className="ml-1 text-[8px] font-bold uppercase text-indigo-600">[Fixed]</span>
                                )}
                                {log?.status === 'imputed' && (
                                  <span className="ml-1 text-[8px] font-bold uppercase text-amber-600">[Filled]</span>
                                )}
                                {log?.status === 'error' && (
                                  <span className="ml-1 text-[8px] font-bold uppercase text-rose-600">[Error]</span>
                                )}
                              </div>
                            </td>
                          );
                        })
                      )}

                      {/* Audit Details */}
                      <td className={`sticky right-0 z-10 ${stickyBg} ${stickyRightShadow} ${rowBorder} py-2 px-3 text-right whitespace-nowrap font-sans`}>
                        <button
                          onClick={() => setSelectedAuditLog({ row: rec })}
                          className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold transition-colors cursor-pointer"
                        >
                          <Eye className="w-3 h-3 inline mr-1 text-slate-500" />
                          <span>Audit ({rec._auditTrail.filter(a => a.status !== 'valid').length})</span>
                        </button>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View (< lg) */}
      <div className="lg:hidden space-y-3">
        {filteredRecords.length === 0 ? (
          <div className="bg-white rounded-lg border border-slate-200 py-10 text-center text-slate-400 font-sans">
            <Info className="w-6 h-6 mx-auto mb-1.5 opacity-50" />
            <p className="text-xs font-medium">No records match the active filter criteria.</p>
          </div>
        ) : (
          filteredRecords.map((rec) => {
            const rawRow = rawRows[rec._rowId - 1] || {};
            const hexId = `0x${rec._rowId.toString(16).padStart(3, '0').toUpperCase()}`;
            const modifiedCount = rec._auditTrail.filter(a => a.status !== 'valid').length;

            return (
              <div
                key={rec._rowId}
                className={`bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden ${
                  rec._isDuplicate ? 'border-purple-200' : rec._hasError ? 'border-rose-200' : ''
                }`}
              >
                {/* Card Header */}
                <div className={`flex items-center justify-between px-3 py-2 border-b border-slate-200 ${
                  rec._isDuplicate ? 'bg-purple-50/50' : rec._hasError ? 'bg-rose-50/50' : 'bg-slate-50'
                }`}>
                  <span className="font-mono text-[10px] text-slate-400 font-semibold">{hexId}</span>
                  <div className="flex items-center gap-1">
                    {rec._isDuplicate && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-50 text-purple-700 border border-purple-200 flex items-center space-x-1">
                        <Copy className="w-2.5 h-2.5" />
                        <span>DUPLICATE</span>
                      </span>
                    )}
                    {rec._hasError && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center space-x-1">
                        <AlertCircle className="w-2.5 h-2.5" />
                        <span>ANOMALY</span>
                      </span>
                    )}
                    {!rec._hasError && !rec._isDuplicate && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center space-x-1">
                        <CheckCircle className="w-2.5 h-2.5" />
                        <span>VALID</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-3 space-y-1.5 text-xs">
                  {viewMode === 'raw' ? (
                    rawHeaders.map((rh, i) => (
                      <div key={i} className="flex items-start justify-between gap-2">
                        <span className="font-mono text-[10px] text-slate-400 truncate">{rh}</span>
                        <span className="font-mono text-rose-700 text-right break-all">{String(rawRow[rh] || 'null')}</span>
                      </div>
                    ))
                  ) : viewMode === 'split' ? (
                    <>
                      <div className="rounded-md bg-rose-50/50 border border-rose-200 p-2 space-y-1">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-rose-700">Raw Input (Dirty)</span>
                        {Object.entries(rawRow).map(([k, v]) => (
                          <div key={k} className="flex items-start justify-between gap-2">
                            <span className="font-mono text-[10px] text-slate-400 truncate">{k}</span>
                            <span className="font-mono text-rose-700 text-right break-all">{String(v || 'null')}</span>
                          </div>
                        ))}
                      </div>
                      <div className="rounded-md bg-emerald-50/50 border border-emerald-200 p-2 space-y-1">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-700">Governed (Clean)</span>
                        {dictionary.rules.map(r => {
                          const log = rec._auditTrail.find(a => a.columnName === r.targetColumnName);
                          const isModified = log?.status === 'modified' || log?.status === 'imputed';
                          return (
                            <div key={r.targetColumnName} className="flex items-start justify-between gap-2">
                              <span className="font-mono text-[10px] text-slate-400 truncate">{r.targetColumnName}</span>
                              <span className={`font-mono text-emerald-800 text-right break-all ${isModified ? 'bg-indigo-100 text-indigo-900 px-1 rounded' : ''}`}>
                                {String(rec[r.targetColumnName] || 'NULL')}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    dictionary.rules.map(rule => {
                      const val = rec[rule.targetColumnName];
                      const log = rec._auditTrail.find(a => a.columnName === rule.targetColumnName);
                      const statusClass = getCellStatusBadge(log?.status || 'valid');

                      return (
                        <div
                          key={rule.targetColumnName}
                          onClick={() => setSelectedAuditLog({ row: rec, log })}
                          className={`flex items-start justify-between gap-2 px-2 py-1.5 rounded border cursor-pointer transition-all ${statusClass}`}
                        >
                          <span className="font-mono text-[10px] text-slate-400 truncate">{rule.targetColumnName}</span>
                          <span className="font-mono text-right break-all">
                            {String(val || '')}
                            {log?.status === 'modified' && (
                              <span className="ml-1 text-[8px] font-bold uppercase text-indigo-600">[Fixed]</span>
                            )}
                            {log?.status === 'imputed' && (
                              <span className="ml-1 text-[8px] font-bold uppercase text-amber-600">[Filled]</span>
                            )}
                            {log?.status === 'error' && (
                              <span className="ml-1 text-[8px] font-bold uppercase text-rose-600">[Error]</span>
                            )}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Card Footer */}
                <div className="px-3 py-2 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <span className="text-[10px] text-slate-400 font-mono">
                    {modifiedCount > 0 ? `${modifiedCount} sel dimodifikasi` : 'Sesuai standar'}
                  </span>
                  <button
                    onClick={() => setSelectedAuditLog({ row: rec })}
                    className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold transition-colors cursor-pointer"
                  >
                    <Eye className="w-3 h-3 inline mr-1 text-slate-500" />
                    <span>Audit ({modifiedCount})</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Detail Audit Trail Modal */}
      {selectedAuditLog && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-base text-slate-900">
                  Audit Trail Baris #{selectedAuditLog.row._rowId}
                </h3>
              </div>
              <button
                onClick={() => setSelectedAuditLog(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {selectedAuditLog.row._auditTrail.map((log, i) => (
                <div key={i} className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <div className="flex items-center justify-between font-semibold text-slate-800">
                    <span>Kolom: <code className="text-indigo-600">{log.columnName}</code></span>
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${getCellStatusBadge(log.status)}`}>
                      {log.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-slate-600 pt-1">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block">Nilai Asli (Raw)</span>
                      <span className="font-mono line-through text-rose-500">{String(log.originalValue || '(kosong)')}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block">Nilai Bersih (Cleansed)</span>
                      <span className="font-mono font-bold text-emerald-600">{String(log.cleansedValue || '(kosong)')}</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 italic pt-1 border-t border-slate-200">
                    Rule: {log.ruleName} — {log.message}
                  </p>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedAuditLog(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs cursor-pointer"
              >
                Tutup Audit Log
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

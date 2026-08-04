// File: app/governance/page.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { SAMPLE_DATASETS } from './data/sampleDatasets';
import { parseCsv, executeDataCleansing } from './utils/cleansingEngine';
import { GovernanceDictionary, GovernanceRule, SampleDataset } from './types';

import { Navbar } from './components/Navbar';
import { QualityDashboard } from './components/QualityDashboard';
import { GovernanceRuleEditor } from './components/GovernanceRuleEditor';
import { DataGridComparison } from './components/DataGridComparison';
import { AiAssistantModal } from './components/AiAssistantModal';
import { ExportModal } from './components/ExportModal';

import { Upload, FileText, ShieldCheck, Database } from 'lucide-react';

export default function GovernanceStudioPage() {
  const [selectedDataset, setSelectedDataset] = useState<SampleDataset>(SAMPLE_DATASETS[0]);
  const [rawCsvText, setRawCsvText] = useState<string>(SAMPLE_DATASETS[0].rawCsv);
  const [dictionary, setDictionary] = useState<GovernanceDictionary>(SAMPLE_DATASETS[0].governanceDictionary);
  const [activeTab, setActiveTab] = useState<'data' | 'rules' | 'metrics'>('data');
  const [isRawEditorOpen, setIsRawEditorOpen] = useState<boolean>(false);

  // Modals
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Handle dataset switch
  const handleSelectDataset = (ds: SampleDataset) => {
    setSelectedDataset(ds);
    setRawCsvText(ds.rawCsv);
    setDictionary(ds.governanceDictionary);
  };

  // Parse Raw CSV
  const parsedRawData = useMemo(() => {
    return parseCsv(rawCsvText);
  }, [rawCsvText]);

  // Execute Cleansing Engine
  const { cleansedRecords, metrics } = useMemo(() => {
    return executeDataCleansing(parsedRawData.rows, dictionary);
  }, [parsedRawData.rows, dictionary]);

  // Handle CSV file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setRawCsvText(text);
        setIsRawEditorOpen(false);
      }
    };
    reader.readAsText(file);
  };

  // Apply AI Suggested Rules
  const handleApplyAiRules = (newRules: GovernanceRule[], summary: string) => {
    const updatedDict: GovernanceDictionary = {
      ...dictionary,
      description: summary,
      rules: newRules
    };
    setDictionary(updatedDict);
    setActiveTab('rules');
  };

  const handleResetData = () => {
    setRawCsvText(selectedDataset.rawCsv);
    setDictionary(selectedDataset.governanceDictionary);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col selection:bg-indigo-500 selection:text-white">
      
      {/* Top Navbar */}
      <Navbar
        metrics={metrics}
        onOpenAiAssistant={() => setIsAiModalOpen(true)}
        onOpenExport={() => setIsExportModalOpen(true)}
        onResetData={handleResetData}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-4">
        
        {/* Workspace Header */}
        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-2xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            
            {/* Title & Description */}
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center flex-wrap gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100">
                  {selectedDataset.category}
                </span>
                <h1 className="text-base font-bold text-slate-900 truncate">
                  {selectedDataset.title}
                </h1>
              </div>
              <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
                {selectedDataset.description}
              </p>
            </div>

            {/* Dataset Selector + Stat Chips */}
            <div className="flex flex-col md:flex-row md:items-center gap-3 shrink-0">
              <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-md">
                <Database className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">Dataset:</span>
                <select
                  value={selectedDataset.id}
                  onChange={(e) => {
                    const found = SAMPLE_DATASETS.find(d => d.id === e.target.value);
                    if (found) handleSelectDataset(found);
                  }}
                  className="bg-transparent text-xs font-semibold text-slate-800 border-none rounded px-1 py-0.5 focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer max-w-[220px]"
                >
                  {SAMPLE_DATASETS.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-1.5 rounded-md bg-slate-50 border border-slate-200 text-[10px] font-mono text-slate-600">
                  Records: <strong className="text-slate-900">{metrics.totalRows}</strong>
                </span>
                <span className="px-2.5 py-1.5 rounded-md bg-emerald-50 border border-emerald-200 text-[10px] font-mono text-emerald-700">
                  Compliance: <strong className="text-emerald-900">{metrics.overallScore}%</strong>
                </span>
                <span className="px-2.5 py-1.5 rounded-md bg-rose-50 border border-rose-200 text-[10px] font-mono text-rose-700">
                  Errors: <strong className="text-rose-900">{metrics.errorCount}</strong>
                </span>
              </div>
            </div>

          </div>

          {/* Raw CSV Collapsible Editor */}
          {isRawEditorOpen && (
            <div className="mt-4 pt-4 border-t border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">
                  Raw Data Input Editor (CSV Format):
                </label>
                <span className="text-[11px] text-slate-500 font-mono">
                  {parsedRawData.rows.length} Raw Records
                </span>
              </div>
              <textarea
                value={rawCsvText}
                onChange={(e) => setRawCsvText(e.target.value)}
                rows={5}
                className="w-full bg-slate-900 font-mono text-xs text-slate-100 border border-slate-700 rounded-md p-3 focus:ring-1 focus:ring-indigo-500 outline-none leading-relaxed"
                placeholder="Paste raw CSV dataset here..."
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsRawEditorOpen(false)}
                  className="px-3.5 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer border border-slate-300"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setIsRawEditorOpen(false)}
                  className="px-3.5 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer"
                >
                  Apply & Execute Engine
                </button>
              </div>
            </div>
          )}

          {/* Action Bar */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
            <button
              onClick={() => setIsRawEditorOpen(!isRawEditorOpen)}
              className="px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs font-semibold text-slate-700 flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-indigo-600" />
              <span>{isRawEditorOpen ? 'Tutup Editor' : 'Input / Paste Raw CSV'}</span>
            </button>

            <label className="px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs font-semibold text-slate-700 flex items-center space-x-1.5 cursor-pointer transition-all">
              <Upload className="w-3.5 h-3.5 text-emerald-600" />
              <span>Upload CSV</span>
              <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        </div>

        {/* Tab Content Display */}
        {activeTab === 'data' && (
          <div className="space-y-4">
            {/* Minimal Summary Card */}
            <QualityDashboard
              metrics={metrics}
              dictionary={dictionary}
            />

            {/* Comparison Grid */}
            <DataGridComparison
              rawRows={parsedRawData.rows}
              cleansedRecords={cleansedRecords}
              dictionary={dictionary}
            />
          </div>
        )}

        {activeTab === 'rules' && (
          <GovernanceRuleEditor
            dictionary={dictionary}
            onSaveDictionary={(updated) => setDictionary(updated)}
            onOpenAiAssistant={() => setIsAiModalOpen(true)}
          />
        )}

        {activeTab === 'metrics' && (
          <div className="space-y-4">
            <QualityDashboard
              metrics={metrics}
              dictionary={dictionary}
            />

            {/* Detailed Governance Compliance Explanation */}
            <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-3 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>Governance Policy & Data Compliance Guidelines</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-600">
                <div className="p-3 rounded-md bg-slate-50 border border-slate-200 space-y-1">
                  <h4 className="font-bold text-indigo-700">1. Standard Identity Formatting</h4>
                  <p className="text-slate-500">
                    National IDs (NIK) require exactly 16 numeric digits. Phone numbers are converted to E.164 telco standards (+62...).
                  </p>
                </div>

                <div className="p-3 rounded-md bg-slate-50 border border-slate-200 space-y-1">
                  <h4 className="font-bold text-emerald-700">2. Casing & Email Normalization</h4>
                  <p className="text-slate-500">
                    Emails are trimmed and lowercased. Entity names are standardized using TitleCase to enforce clean indexing.
                  </p>
                </div>

                <div className="p-3 rounded-md bg-slate-50 border border-slate-200 space-y-1">
                  <h4 className="font-bold text-purple-700">3. Deduplication & Imputation</h4>
                  <p className="text-slate-500">
                    Duplicates are flagged using primary composite keys. Missing values (NULL) are handled via standard fallback imputation rules.
                  </p>
                </div>

                <div className="p-3 rounded-md bg-slate-50 border border-slate-200 space-y-1">
                  <h4 className="font-bold text-amber-700">4. Comprehensive Audit Trail</h4>
                  <p className="text-slate-500">
                    Cell-level modifications maintain an immutable audit trail capturing original values, transformed values, rule IDs, and execution timestamps.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* AI Assistant Modal */}
      <AiAssistantModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        rawCsvText={rawCsvText}
        currentDomain={selectedDataset.title}
        onApplySuggestedRules={handleApplyAiRules}
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        cleansedRecords={cleansedRecords}
        dictionary={dictionary}
        metrics={metrics}
      />

      {/* Footer */}
      <footer className="h-10 bg-white border-t border-slate-200 px-6 flex items-center justify-between text-[10px] text-slate-400 font-mono shrink-0">
        <div>SYSTEM: ONLINE</div>
        <div className="flex gap-4">
          <span>GOVERNANCE v1.0.4</span>
          <span className="text-emerald-600 font-semibold">STATUS: STABLE</span>
        </div>
      </footer>

    </div>
  );
}

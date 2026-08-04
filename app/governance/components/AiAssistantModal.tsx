/* eslint-disable @typescript-eslint/no-explicit-any, prefer-const, @typescript-eslint/no-unused-vars */
import React, { useEffect, useRef, useState } from 'react';
import { Sparkles, Bot, AlertTriangle, ShieldCheck, Check, Loader2, ArrowRight, BrainCircuit } from 'lucide-react';
import { GovernanceRule } from '../types';

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  rawCsvText: string;
  currentDomain: string;
  onApplySuggestedRules: (rules: GovernanceRule[], summary: string) => void;
}

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({
  isOpen,
  onClose,
  rawCsvText,
  currentDomain,
  onApplySuggestedRules
}) => {
  const [loading, setLoading] = useState(false);
  const [thinking, setThinking] = useState('');
  const [answerPreview, setAnswerPreview] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<{
    auditSummary: string;
    dataQualityIssues: string[];
    suggestedRules: GovernanceRule[];
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const thinkingRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll panel thinking ke baris terbaru (paling bawah) setiap ada delta baru
  useEffect(() => {
    const el = thinkingRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [thinking]);

  if (!isOpen) return null;

  const handleRunAiAnalysis = async () => {
    setLoading(true);
    setErrorMsg(null);
    setAnalysisResult(null);
    setThinking('');
    setAnswerPreview('');
    setRetryCount(0);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch('/api/governance/analyze-raw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawData: rawCsvText, currentDomain }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        let message = `Server error (${response.status})`;
        try {
          const data = await response.json();
          if (data?.error) message = data.error;
        } catch { /* ignore */ }
        throw new Error(message);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let analysis: any = null;
      let streamError: string | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const blocks = buffer.split('\n\n');
        buffer = blocks.pop() || '';

        for (const block of blocks) {
          const lines = block.split('\n');
          const eventLine = lines.find(l => l.startsWith('event:'));
          const dataLine = lines.find(l => l.startsWith('data:'));
          if (!dataLine) continue;

          const type = (eventLine?.replace('event:', '').trim()) || 'message';
          const data = JSON.parse(dataLine.replace('data:', '').trim());

          if (type === 'progress') {
            if (data.source === 'thinking') {
              setThinking(prev => prev + data.text);
            } else {
              setAnswerPreview(prev => prev + data.text);
            }
          } else if (type === 'retry') {
            setRetryCount(c => c + 1);
          } else if (type === 'result') {
            analysis = data;
          } else if (type === 'error') {
            streamError = data?.error || 'Terjadi kesalahan saat memproses AI.';
          }
        }
      }

      if (streamError) {
        throw new Error(streamError);
      }
      if (!analysis?.success) {
        throw new Error(analysis?.error || 'AI tidak mengembalikan hasil yang valid.');
      }
      setAnalysisResult(analysis.analysis);
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      setErrorMsg(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  };

  const handleClose = () => {
    abortRef.current?.abort();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-lg max-w-2xl w-full p-5 shadow-lg space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-md bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-200">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
                <span>AI Governance Inspector (DeepSeek)</span>
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              </h3>
              <p className="text-xs text-slate-500">
                Automated raw data defect analysis & governance rule recommendations
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-700 font-bold p-1 rounded hover:bg-slate-100 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        {!analysisResult && !loading && (
          <div className="text-center py-6 space-y-3">
            <div className="w-12 h-12 mx-auto rounded-md bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="max-w-md mx-auto">
              <h4 className="font-bold text-sm text-slate-800">Ready for Raw Data Evaluation</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                AI evaluates raw CSV structures, detects NIK, email, and phone defects, and generates targeted Data Governance rules.
              </p>
            </div>
            <button
              onClick={handleRunAiAnalysis}
              className="px-5 py-2 rounded-md bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs shadow-xs transition-all cursor-pointer"
            >
              Execute AI Inspection
            </button>
          </div>
        )}

        {/* Loading State: Live AI Thinking */}
        {loading && (
          <div className="space-y-3">
            {/* Header row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Loader2 className="w-4 h-4 text-purple-600 animate-spin" />
                <p className="font-bold text-xs text-slate-800">
                  AI sedang menganalisis data...
                </p>
              </div>
              {retryCount > 0 && (
                <span className="px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-[10px] font-bold text-amber-700">
                  Output tidak valid, mencoba ulang ({retryCount}x)
                </span>
              )}
            </div>

            {/* Thinking panel */}
            <div className="bg-slate-900 rounded-md border border-slate-700 overflow-hidden">
              <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800/80 border-b border-slate-700">
                <BrainCircuit className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
                  AI Thinking (Reasoning)
                </span>
                <span className="ml-auto flex space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-pulse"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-pulse" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-pulse" style={{ animationDelay: '300ms' }}></span>
                </span>
              </div>
              <div
                ref={thinkingRef}
                className="max-h-48 overflow-y-auto p-3 font-mono text-[11px] leading-relaxed text-slate-300 whitespace-pre-wrap break-words"
              >
                {thinking || 'Memulai analisis…'}
              </div>
            </div>

            {/* Answer preview (raw JSON) */}
            {answerPreview && (
              <div className="bg-slate-50 rounded-md border border-slate-200 overflow-hidden">
                <div className="px-3 py-1.5 bg-slate-100 border-b border-slate-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Respon AI (Preview)
                  </span>
                </div>
                <div className="max-h-24 overflow-y-auto p-3 font-mono text-[10px] leading-relaxed text-slate-500 whitespace-pre-wrap break-words">
                  {answerPreview}
                </div>
              </div>
            )}

            <p className="text-[11px] text-slate-400">
              Proses ini memakan waktu beberapa detik — AI memikirkan aturan tata kelola yang sesuai sebelum menghasilkan output.
            </p>
          </div>
        )}

        {/* Error State */}
        {errorMsg && (
          <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            <AlertTriangle className="w-4 h-4 inline mr-2" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Analysis Result */}
        {analysisResult && (
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1 text-xs">
            {/* Audit Summary */}
            <div className="p-3 rounded-md bg-purple-50/60 border border-purple-200">
              <h5 className="font-bold text-purple-900 mb-0.5 flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                <span>AI Governance Audit Summary</span>
              </h5>
              <p className="text-purple-950">{analysisResult.auditSummary}</p>
            </div>

            {/* Quality Issues */}
            <div className="p-3 rounded-md bg-slate-50 border border-slate-200">
              <h5 className="font-bold text-slate-900 mb-1 flex items-center space-x-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>Detected Data Anomalies ({analysisResult.dataQualityIssues?.length || 0})</span>
              </h5>
              <ul className="list-disc pl-4 space-y-0.5 text-slate-600 text-[11px]">
                {analysisResult.dataQualityIssues?.map((issue, i) => (
                  <li key={i}>{issue}</li>
                ))}
              </ul>
            </div>

            {/* Recommended Rules */}
            <div className="space-y-1.5">
              <h5 className="font-bold text-slate-900 flex items-center space-x-1">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Recommended Column Cleansing Rules ({analysisResult.suggestedRules?.length || 0})</span>
              </h5>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-md overflow-hidden">
                {analysisResult.suggestedRules?.map((rule, i) => (
                  <div key={i} className="p-2.5 bg-white flex items-center justify-between">
                    <div>
                      <span className="font-mono text-slate-500">{rule.columnName}</span>
                      <ArrowRight className="w-3 h-3 inline mx-1 text-slate-400" />
                      <span className="font-bold text-indigo-600">{rule.targetColumnName}</span>
                      <p className="text-[10px] text-slate-500">{rule.description}</p>
                    </div>
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-[9px] uppercase font-bold text-slate-600">
                      {rule.dataType}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
          <button
            onClick={handleClose}
            className="px-3 py-1.5 rounded-md text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            Close
          </button>

          {analysisResult && (
            <button
              onClick={() => {
                onApplySuggestedRules(analysisResult.suggestedRules, analysisResult.auditSummary);
                onClose();
              }}
              className="px-4 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs flex items-center space-x-1 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Apply AI Governance Rules</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

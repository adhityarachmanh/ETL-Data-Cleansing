/* eslint-disable @typescript-eslint/no-explicit-any, prefer-const, @typescript-eslint/no-unused-vars */
import React, { useState } from 'react';
import { Settings, Plus, Trash2, CheckCircle2, Sparkles, BookOpen } from 'lucide-react';
import { GovernanceDictionary, GovernanceRule } from '../types';

interface GovernanceRuleEditorProps {
  dictionary: GovernanceDictionary;
  onSaveDictionary: (updated: GovernanceDictionary) => void;
  onOpenAiAssistant: () => void;
}

export const GovernanceRuleEditor: React.FC<GovernanceRuleEditorProps> = ({
  dictionary,
  onSaveDictionary,
  onOpenAiAssistant
}) => {
  const [dict, setDict] = useState<GovernanceDictionary>(dictionary);
  const [prevDict, setPrevDict] = useState<GovernanceDictionary>(dictionary);

  // Sinkronkan state lokal saat kamus berubah (ganti dataset / hasil AI diterapkan)
  if (prevDict !== dictionary) {
    setPrevDict(dictionary);
    setDict(dictionary);
  }

  const handleRuleChange = (ruleId: string, key: keyof GovernanceRule, value: any) => {
    const updatedRules = dict.rules.map(r => {
      if (r.id === ruleId) {
        return { ...r, [key]: value };
      }
      return r;
    });
    const updatedDict = { ...dict, rules: updatedRules };
    setDict(updatedDict);
    onSaveDictionary(updatedDict);
  };

  const handleAddRule = () => {
    const newRule: GovernanceRule = {
      id: `rule-${Date.now()}`,
      columnName: 'new_column',
      targetColumnName: 'standard_column',
      dataType: 'string',
      isRequired: false,
      casing: 'titlecase',
      trimWhitespace: true,
      defaultValue: '',
      description: 'New governance rule for standard reference mapping'
    };
    const updatedDict = { ...dict, rules: [...dict.rules, newRule] };
    setDict(updatedDict);
    onSaveDictionary(updatedDict);
  };

  const handleDeleteRule = (ruleId: string) => {
    const updatedRules = dict.rules.filter(r => r.id !== ruleId);
    const updatedDict = { ...dict, rules: updatedRules };
    setDict(updatedDict);
    onSaveDictionary(updatedDict);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & Governance Metadata */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Governance Policies & Data Dictionary (Reference Standard)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Active configuration for standard transformation, normalization & cleansing rules
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onOpenAiAssistant}
              className="px-3 py-1.5 rounded-md bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>AI Rule Generator</span>
            </button>

            <button
              onClick={handleAddRule}
              className="px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium flex items-center space-x-1 shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Column Rule</span>
            </button>
          </div>
        </div>

        {/* Governance Standard Meta Form */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-200 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Governance Policy Standard Name
            </label>
            <input
              type="text"
              value={dict.name}
              onChange={(e) => {
                const updated = { ...dict, name: e.target.value };
                setDict(updated);
                onSaveDictionary(updated);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-900 focus:ring-1 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Null Value Handling Strategy
            </label>
            <select
              value={dict.nullStrategy}
              onChange={(e) => {
                const updated = { ...dict, nullStrategy: e.target.value as any };
                setDict(updated);
                onSaveDictionary(updated);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-900 focus:ring-1 focus:ring-indigo-500 outline-none"
            >
              <option value="fill_default">Impute Default Fallback Values</option>
              <option value="flag_anomaly">Flag Row as Quality Anomaly</option>
              <option value="drop_row">Drop / Reject Row</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Deduplication Primary Keys
            </label>
            <input
              type="text"
              value={dict.deduplicationKeys.join(', ')}
              onChange={(e) => {
                const keys = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                const updated = { ...dict, deduplicationKeys: keys };
                setDict(updated);
                onSaveDictionary(updated);
              }}
              placeholder="nik, email"
              className="w-full bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-900 focus:ring-1 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Rules Table / Cards */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Settings className="w-3.5 h-3.5 text-slate-500" />
            <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
              Column Ruleset ({dict.rules.length} Active Rules)
            </h3>
          </div>
          <span className="text-[11px] text-slate-500">
            Sequential transformation execution pipeline
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {dict.rules.map((rule, idx) => (
            <div key={rule.id} className="p-3 hover:bg-slate-50/60 transition-colors">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center text-xs">
                
                {/* Index & Column Mapping */}
                <div className="md:col-span-3 space-y-1">
                  <div className="flex items-center space-x-1 font-mono text-[10px] text-slate-400">
                    <span>#{idx + 1}</span>
                    <span className="text-slate-600 font-bold">{rule.columnName}</span>
                    <span>→</span>
                    <span className="text-indigo-600 font-bold">{rule.targetColumnName}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <input
                      type="text"
                      value={rule.columnName}
                      onChange={(e) => handleRuleChange(rule.id, 'columnName', e.target.value)}
                      placeholder="Raw Col"
                      className="w-1/2 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-900 text-[11px]"
                      title="Raw Input Column Name"
                    />
                    <span className="text-slate-400">→</span>
                    <input
                      type="text"
                      value={rule.targetColumnName}
                      onChange={(e) => handleRuleChange(rule.id, 'targetColumnName', e.target.value)}
                      placeholder="Target Col"
                      className="w-1/2 bg-slate-50 border border-indigo-200 rounded px-2 py-1 text-slate-900 text-[11px] font-semibold"
                      title="Governed Target Column Name"
                    />
                  </div>
                </div>

                {/* Data Type & Validation Format */}
                <div className="md:col-span-3 space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Data Type Standard</label>
                  <select
                    value={rule.dataType}
                    onChange={(e) => handleRuleChange(rule.id, 'dataType', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-900 text-[11px] font-medium"
                  >
                    <option value="nik">National ID / NIK (16 Digits)</option>
                    <option value="phone">E.164 Telco (+628...)</option>
                    <option value="email">Lowercase Email</option>
                    <option value="date">ISO Date (YYYY-MM-DD)</option>
                    <option value="currency">Numeric / Currency Cast</option>
                    <option value="enum">Enum Whitelist</option>
                    <option value="string">Standard Text</option>
                  </select>
                </div>

                {/* Casing & Whitespace */}
                <div className="md:col-span-2 space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Text Casing</label>
                  <select
                    value={rule.casing}
                    onChange={(e) => handleRuleChange(rule.id, 'casing', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-900 text-[11px]"
                  >
                    <option value="titlecase">TitleCase</option>
                    <option value="uppercase">UPPERCASE</option>
                    <option value="lowercase">lowercase</option>
                    <option value="none">As-Is (Preserve)</option>
                  </select>
                </div>

                {/* Default Value & Required */}
                <div className="md:col-span-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Default Imputation</label>
                    <label className="inline-flex items-center space-x-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rule.isRequired}
                        onChange={(e) => handleRuleChange(rule.id, 'isRequired', e.target.checked)}
                        className="rounded accent-indigo-600"
                      />
                      <span className="text-[9px] font-bold text-slate-600">Required</span>
                    </label>
                  </div>
                  <input
                    type="text"
                    value={rule.defaultValue || ''}
                    onChange={(e) => handleRuleChange(rule.id, 'defaultValue', e.target.value)}
                    placeholder="Default fallback value"
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-900 text-[11px]"
                  />
                </div>

                {/* Delete button */}
                <div className="md:col-span-1 flex justify-end">
                  <button
                    onClick={() => handleDeleteRule(rule.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Delete Rule"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>

              {/* Enum Whitelist Option if enum */}
              {rule.dataType === 'enum' && (
                <div className="mt-1.5 pt-1.5 border-t border-slate-100 text-[11px] flex items-center space-x-2">
                  <span className="font-semibold text-slate-500">Whitelist:</span>
                  <input
                    type="text"
                    value={(rule.allowedValues || []).join(', ')}
                    onChange={(e) => {
                      const list = e.target.value.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
                      handleRuleChange(rule.id, 'allowedValues', list);
                    }}
                    placeholder="e.g. ACTIVE, SUSPENDED, INACTIVE"
                    className="flex-1 bg-slate-50 border border-slate-200 rounded px-2 py-0.5 text-slate-900 text-[11px]"
                  />
                </div>
              )}

              {/* Description */}
              <div className="mt-1.5 text-[10px] text-slate-500 italic flex items-center space-x-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                <span>{rule.description}</span>
              </div>

            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

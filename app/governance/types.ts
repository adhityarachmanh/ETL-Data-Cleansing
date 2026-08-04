/* eslint-disable @typescript-eslint/no-explicit-any, prefer-const, @typescript-eslint/no-unused-vars */
export type DataCategory = 'kependudukan' | 'keuangan' | 'karyawan' | 'vendor' | 'kesehatan';

export interface GovernanceRule {
  id: string;
  columnName: string; // Original column name or target column
  targetColumnName: string; // Standard column name according to governance
  dataType: 'nik' | 'phone' | 'email' | 'string' | 'number' | 'date' | 'enum' | 'currency';
  isRequired: boolean;
  casing: 'uppercase' | 'lowercase' | 'titlecase' | 'none';
  trimWhitespace: boolean;
  defaultValue?: string;
  allowedValues?: string[]; // For enum
  regexPattern?: string;
  description: string;
}

export interface GovernanceDictionary {
  id: string;
  name: string;
  description: string;
  rules: GovernanceRule[];
  deduplicationKeys: string[]; // Column names to check for duplicates
  nullStrategy: 'fill_default' | 'flag_anomaly' | 'drop_row';
}

export interface RawRecord {
  [key: string]: any;
}

export interface CellChangeLog {
  columnName: string;
  originalValue: any;
  cleansedValue: any;
  ruleId: string;
  ruleName: string;
  status: 'valid' | 'modified' | 'error' | 'imputed';
  message: string;
}

export interface CleansedRecord {
  _rowId: number;
  _isDuplicate: boolean;
  _hasError: boolean;
  _auditTrail: CellChangeLog[];
  [key: string]: any;
}

export interface QualityMetrics {
  totalRows: number;
  totalColumns: number;
  completeness: number; // % non-null required fields
  validity: number; // % formatted properly according to governance
  uniqueness: number; // % non-duplicate records
  accuracy: number; // % without structural errors
  consistency: number; // % adhering to casing and enum whitelists
  overallScore: number;
  duplicateCount: number;
  errorCount: number;
  modifiedCellCount: number;
}

export interface SampleDataset {
  id: string;
  title: string;
  category: DataCategory;
  description: string;
  rawCsv: string;
  governanceDictionary: GovernanceDictionary;
}

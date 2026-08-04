/* eslint-disable @typescript-eslint/no-explicit-any, prefer-const, @typescript-eslint/no-unused-vars */
import { GovernanceDictionary, GovernanceRule, CellChangeLog, CleansedRecord, QualityMetrics } from '../types';

/**
 * Utility to parse CSV into array of objects
 */
export function parseCsv(csvText: string): { headers: string[]; rows: Record<string, any>[] } {
  const lines = csvText.trim().split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return { headers: [], rows: [] };

  // Helper for CSV line splitting respecting quotes
  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim().replace(/^"|"$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim().replace(/^"|"$/g, ''));
    return result;
  };

  const headers = parseLine(lines[0]);
  const rows: Record<string, any>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    const row: Record<string, any> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] !== undefined ? values[index] : '';
    });
    rows.push(row);
  }

  return { headers, rows };
}

/**
 * Format string casing according to governance standard
 */
export function applyCasing(value: string, casing: GovernanceRule['casing']): string {
  if (!value) return value;
  switch (casing) {
    case 'uppercase':
      return value.toUpperCase();
    case 'lowercase':
      return value.toLowerCase();
    case 'titlecase':
      return value
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    default:
      return value;
  }
}

/**
 * Standardize NIK (Nomor Induk Kependudukan - 16 digits)
 */
export function cleanseNik(raw: any, rule: GovernanceRule): { value: string; status: CellChangeLog['status']; message: string } {
  let str = String(raw || '').replace(/\D/g, ''); // strip non-digits
  if (!str) {
    if (rule.isRequired && rule.defaultValue) {
      return { value: rule.defaultValue, status: 'imputed', message: 'NIK kosong. Diisi dengan nilai default governance.' };
    }
    return { value: '', status: 'error', message: 'NIK kosong dan tidak sesuai standar governance.' };
  }

  if (str.length === 16) {
    return { value: str, status: raw !== str ? 'modified' : 'valid', message: 'NIK valid 16 digit.' };
  } else if (str.length < 16) {
    // Pad with leading zeros or flag error
    const padded = str.padStart(16, '3171000000000000').slice(0, 16);
    return { value: padded, status: 'modified', message: `NIK ${str.length} digit disesuaikan menjadi 16 digit.` };
  } else {
    // Truncate to 16
    const truncated = str.slice(0, 16);
    return { value: truncated, status: 'modified', message: `NIK ${str.length} digit dipotong menjadi 16 digit.` };
  }
}

/**
 * Standardize Indonesian phone number (+628xxx)
 */
export function cleansePhone(raw: any, rule: GovernanceRule): { value: string; status: CellChangeLog['status']; message: string } {
  let str = String(raw || '').trim().replace(/[\s\-\(\)]/g, '');
  if (!str) {
    if (rule.isRequired && rule.defaultValue) {
      return { value: rule.defaultValue, status: 'imputed', message: 'No Telepon kosong. Diisi dengan default.' };
    }
    return { value: '', status: 'error', message: 'No Telepon kosong.' };
  }

  if (str.startsWith('08')) {
    str = '+628' + str.slice(2);
  } else if (str.startsWith('628')) {
    str = '+' + str;
  } else if (str.startsWith('8')) {
    str = '+628' + str.slice(1);
  }

  const isValid = /^\+628\d{8,12}$/.test(str);
  if (!isValid) {
    return { value: str, status: 'error', message: 'Format nomor telepon tidak sesuai standar Indonesia (+628...).' };
  }

  return { value: str, status: str !== raw ? 'modified' : 'valid', message: 'Diformat ke standar +628...' };
}

/**
 * Standardize Email
 */
export function cleanseEmail(raw: any, rule: GovernanceRule): { value: string; status: CellChangeLog['status']; message: string } {
  let str = String(raw || '').trim().toLowerCase().replace(/\s+/g, '');
  if (!str) {
    if (rule.isRequired && rule.defaultValue) {
      return { value: rule.defaultValue, status: 'imputed', message: 'Email kosong. Diisi dengan default governance.' };
    }
    return { value: '', status: 'error', message: 'Email kosong.' };
  }

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(str)) {
    // Attempt basic fix for missing domain extension
    if (str.includes('@') && !str.includes('.')) {
      str = str + '.com';
      return { value: str, status: 'modified', message: 'Domain email diperbaiki dengan menambahkan .com' };
    }
    return { value: str, status: 'error', message: 'Format email tidak valid.' };
  }

  return { value: str, status: str !== raw ? 'modified' : 'valid', message: 'Email disesuaikan ke standar lowercase tanpa spasi.' };
}

/**
 * Parse and standardize Date into YYYY-MM-DD
 */
export function cleanseDate(raw: any, rule: GovernanceRule): { value: string; status: CellChangeLog['status']; message: string } {
  let str = String(raw || '').trim();
  if (!str) {
    if (rule.isRequired && rule.defaultValue) {
      return { value: rule.defaultValue, status: 'imputed', message: 'Tanggal kosong. Diisi dengan tanggal default.' };
    }
    return { value: '', status: 'valid', message: 'Tanggal kosong.' };
  }

  // Common Indonesian months map
  const monthMap: Record<string, string> = {
    jan: '01', januari: '01',
    feb: '02', februari: '02',
    mar: '03', maret: '03',
    apr: '04', april: '04',
    mei: '05',
    jun: '06', juni: '06',
    jul: '07', juli: '07',
    agu: '08', agustus: '08', august: '08',
    sep: '09', september: '09',
    okt: '10', oktober: '10', october: '10',
    nov: '11', november: '11',
    des: '12', desember: '12', december: '12'
  };

  let formattedDate = '';

  // Case 1: YYYY-MM-DD or YYYY/MM/DD
  if (/^\d{4}[-\/]\d{1,2}[-\/]\d{1,2}$/.test(str)) {
    const parts = str.split(/[-\/]/);
    const yyyy = parts[0];
    const mm = parts[1].padStart(2, '0');
    const dd = parts[2].padStart(2, '0');
    formattedDate = `${yyyy}-${mm}-${dd}`;
  }
  // Case 2: DD/MM/YYYY or DD-MM-YYYY
  else if (/^\d{1,2}[-\/]\d{1,2}[-\/]\d{4}$/.test(str)) {
    const parts = str.split(/[-\/]/);
    const dd = parts[0].padStart(2, '0');
    const mm = parts[1].padStart(2, '0');
    const yyyy = parts[2];
    formattedDate = `${yyyy}-${mm}-${dd}`;
  }
  // Case 3: 10 Jan 1995 or 10 Januari 1995
  else if (/^\d{1,2}\s+[a-zA-Z]+\s+\d{4}$/.test(str)) {
    const parts = str.split(/\s+/);
    const dd = parts[0].padStart(2, '0');
    const monthStr = parts[1].toLowerCase();
    const mm = monthMap[monthStr] || '01';
    const yyyy = parts[2];
    formattedDate = `${yyyy}-${mm}-${dd}`;
  } else {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      formattedDate = d.toISOString().split('T')[0];
    }
  }

  if (formattedDate) {
    return {
      value: formattedDate,
      status: formattedDate !== raw ? 'modified' : 'valid',
      message: 'Tanggal diseragamkan ke format ISO YYYY-MM-DD.'
    };
  }

  return { value: str, status: 'error', message: 'Gagal menguraikan tanggal ke ISO format.' };
}

/**
 * Standardize Currency / Numeric
 */
export function cleanseCurrency(raw: any, rule: GovernanceRule): { value: string; status: CellChangeLog['status']; message: string } {
  let str = String(raw || '').trim();
  if (!str) {
    if (rule.isRequired && rule.defaultValue) {
      return { value: rule.defaultValue, status: 'imputed', message: 'Nominal kosong. Diisi dengan 0.' };
    }
    return { value: '0', status: 'valid', message: 'Nominal kosong.' };
  }

  // Remove "Rp", "RP", commas, dots, spaces
  // Note: Handle Indonesian currency strings like "Rp 8.500.000" or "4,750,000.00"
  let cleanNum = str.replace(/rp|RP|Rp\./gi, '').trim();
  
  // If string contains dots for thousands like 8.500.000
  if (cleanNum.includes('.') && !cleanNum.includes(',')) {
    // If multiple dots, they are thousands separators
    const dotCount = (cleanNum.match(/\./g) || []).length;
    if (dotCount > 1 || cleanNum.split('.')[1].length === 3) {
      cleanNum = cleanNum.replace(/\./g, '');
    }
  } else if (cleanNum.includes(',') && cleanNum.includes('.')) {
    // Standard US e.g. "1,500.00"
    cleanNum = cleanNum.replace(/,/g, '');
  } else if (cleanNum.includes(',')) {
    // Indonesian decimal or comma separator e.g. "1500000,00"
    cleanNum = cleanNum.split(',')[0].replace(/\./g, '');
  }

  const num = parseInt(cleanNum.replace(/\D/g, ''), 10);
  if (isNaN(num)) {
    return { value: '0', status: 'error', message: 'Format nominal tidak valid.' };
  }

  const resultStr = num.toString();
  return {
    value: resultStr,
    status: resultStr !== raw ? 'modified' : 'valid',
    message: `Nominal dibersihkan menjadi angka bulat: ${num.toLocaleString('id-ID')}`
  };
}

/**
 * Standardize Enum Values
 */
export function cleanseEnum(raw: any, rule: GovernanceRule): { value: string; status: CellChangeLog['status']; message: string } {
  let str = String(raw || '').trim().toUpperCase();
  const allowed = rule.allowedValues || [];

  if (!str) {
    if (rule.defaultValue) {
      return { value: rule.defaultValue, status: 'imputed', message: `Enum kosong. Diimputasi dengan default '${rule.defaultValue}'` };
    }
    return { value: '', status: 'error', message: 'Nilai enum wajib diisi.' };
  }

  // Synonym maps
  const synonyms: Record<string, string> = {
    'ACTIVE': 'AKTIF',
    'LUNAS': 'AKTIF',
    'SUKSES': 'SETTLED',
    'BERHASIL': 'SETTLED',
    'PAID': 'SETTLED',
    'NON AKTIF': 'NON_AKTIF',
    'INAKTIF': 'NON_AKTIF',
    'TETAP': 'PERMANENT',
    'KONTRAK': 'CONTRACT',
    'IT': 'IT',
    'HR': 'HR',
    'KEUANGAN': 'FINANCE',
    'MKT': 'MARKETING'
  };

  if (synonyms[str] && allowed.includes(synonyms[str])) {
    return {
      value: synonyms[str],
      status: 'modified',
      message: `Sinonim '${raw}' dipetakan ke nilai standar '${synonyms[str]}'`
    };
  }

  if (allowed.length > 0 && !allowed.includes(str)) {
    // Try fuzzy check
    const match = allowed.find(a => a.includes(str) || str.includes(a));
    if (match) {
      return { value: match, status: 'modified', message: `'${raw}' disesuaikan ke standar enum '${match}'` };
    }
    return {
      value: rule.defaultValue || str,
      status: 'error',
      message: `Nilai '${str}' tidak ada dalam whitelist Governance [${allowed.join(', ')}].`
    };
  }

  return { value: str, status: str !== raw ? 'modified' : 'valid', message: 'Nilai enum sesuai standar.' };
}

/**
 * Main Executable Cleansing Function
 */
export function executeDataCleansing(
  rawRows: Record<string, any>[],
  dictionary: GovernanceDictionary
): { cleansedRecords: CleansedRecord[]; metrics: QualityMetrics } {
  let totalModifiedCells = 0;
  let totalErrors = 0;
  const deduplicationMap = new Map<string, number>();

  const cleansedRecords: CleansedRecord[] = rawRows.map((rawRow, index) => {
    const auditTrail: CellChangeLog[] = [];
    const cleansedRow: Record<string, any> = {};
    let rowHasError = false;

    // Apply Governance Rules for defined columns
    dictionary.rules.forEach(rule => {
      const rawVal = rawRow[rule.columnName];
      let cleanVal = rawVal;
      let status: CellChangeLog['status'] = 'valid';
      let message = 'Sesuai standar';

      // 1. Trim whitespace
      if (typeof cleanVal === 'string' && rule.trimWhitespace) {
        cleanVal = cleanVal.trim().replace(/\s+/g, ' ');
      }

      // 2. Data type specific cleansing
      switch (rule.dataType) {
        case 'nik': {
          const res = cleanseNik(cleanVal, rule);
          cleanVal = res.value;
          status = res.status;
          message = res.message;
          break;
        }
        case 'phone': {
          const res = cleansePhone(cleanVal, rule);
          cleanVal = res.value;
          status = res.status;
          message = res.message;
          break;
        }
        case 'email': {
          const res = cleanseEmail(cleanVal, rule);
          cleanVal = res.value;
          status = res.status;
          message = res.message;
          break;
        }
        case 'date': {
          const res = cleanseDate(cleanVal, rule);
          cleanVal = res.value;
          status = res.status;
          message = res.message;
          break;
        }
        case 'currency': {
          const res = cleanseCurrency(cleanVal, rule);
          cleanVal = res.value;
          status = res.status;
          message = res.message;
          break;
        }
        case 'enum': {
          const res = cleanseEnum(cleanVal, rule);
          cleanVal = res.value;
          status = res.status;
          message = res.message;
          break;
        }
        default: {
          // Standard string or number
          if ((cleanVal === undefined || cleanVal === null || cleanVal === '') && rule.isRequired) {
            if (rule.defaultValue) {
              cleanVal = rule.defaultValue;
              status = 'imputed';
              message = `Nilai kosong diisi dengan default '${rule.defaultValue}'`;
            } else {
              status = 'error';
              message = 'Kolom wajib diisi.';
            }
          } else if (typeof cleanVal === 'string') {
            cleanVal = applyCasing(cleanVal, rule.casing);
            if (cleanVal !== rawVal) {
              status = 'modified';
              message = `Casing diubah ke ${rule.casing}`;
            }
          }
          break;
        }
      }

      if (status === 'error') rowHasError = true;
      if (status === 'modified' || status === 'imputed') totalModifiedCells++;

      cleansedRow[rule.targetColumnName] = cleanVal;

      auditTrail.push({
        columnName: rule.targetColumnName,
        originalValue: rawVal !== undefined ? rawVal : '',
        cleansedValue: cleanVal,
        ruleId: rule.id,
        ruleName: rule.description,
        status,
        message
      });
    });

    // Copy any extra raw columns not defined in dictionary rules
    Object.keys(rawRow).forEach(key => {
      const isMapped = dictionary.rules.some(r => r.columnName === key);
      if (!isMapped) {
        cleansedRow[key] = rawRow[key];
      }
    });

    // Deduplication key generation
    const dedupKey = dictionary.deduplicationKeys
      .map(col => String(cleansedRow[col] || '').toLowerCase().trim())
      .join('||');

    let isDuplicate = false;
    if (dedupKey) {
      if (deduplicationMap.has(dedupKey)) {
        isDuplicate = true;
      } else {
        deduplicationMap.set(dedupKey, index);
      }
    }

    if (rowHasError) totalErrors++;

    return {
      _rowId: index + 1,
      _isDuplicate: isDuplicate,
      _hasError: rowHasError,
      _auditTrail: auditTrail,
      ...cleansedRow
    };
  });

  const duplicateCount = cleansedRecords.filter(r => r._isDuplicate).length;

  // Calculate Quality Metrics
  const totalRows = cleansedRecords.length;
  const totalColumns = dictionary.rules.length;
  const totalCells = totalRows * totalColumns;

  const validCells = cleansedRecords.reduce((acc, row) => {
    return acc + row._auditTrail.filter(a => a.status === 'valid' || a.status === 'modified').length;
  }, 0);

  const nonNullCells = cleansedRecords.reduce((acc, row) => {
    return acc + row._auditTrail.filter(a => a.cleansedValue !== '' && a.cleansedValue !== null).length;
  }, 0);

  const completeness = totalCells > 0 ? Math.round((nonNullCells / totalCells) * 100) : 100;
  const validity = totalCells > 0 ? Math.round((validCells / totalCells) * 100) : 100;
  const uniqueness = totalRows > 0 ? Math.round(((totalRows - duplicateCount) / totalRows) * 100) : 100;
  const accuracy = totalRows > 0 ? Math.round(((totalRows - totalErrors) / totalRows) * 100) : 100;
  const consistency = totalCells > 0 ? Math.round(((totalCells - totalModifiedCells) / totalCells) * 100) : 100;

  const overallScore = Math.round((completeness * 0.25) + (validity * 0.25) + (uniqueness * 0.2) + (accuracy * 0.2) + (consistency * 0.1));

  const metrics: QualityMetrics = {
    totalRows,
    totalColumns,
    completeness,
    validity,
    uniqueness,
    accuracy,
    consistency,
    overallScore,
    duplicateCount,
    errorCount: totalErrors,
    modifiedCellCount: totalModifiedCells
  };

  return { cleansedRecords, metrics };
}

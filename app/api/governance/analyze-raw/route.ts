/* eslint-disable @typescript-eslint/no-explicit-any, prefer-const, @typescript-eslint/no-unused-vars */
// File: app/api/governance/analyze-raw/route.ts
import { NextRequest } from 'next/server';
import {
    extractJsonObject,
    safeParseJsonObject,
    streamJsonProcess,
    processStreamResponse,
    immediateResultEvent,
} from '../../../../lib/stream';

// Re-export parser agar konsumen/tests tetap bisa mengimpornya dari route ini
export { extractJsonObject, safeParseJsonObject };

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { rawData, currentDomain } = body;

        if (!rawData) {
            return immediateResultEvent({ success: false, error: 'Data raw wajib disediakan.' });
        }

        const prompt = `Anda adalah seorang Senior Data Governance Officer & Master Data Management Specialist.
Analisis data mentah berikut dan berikan rekomendasi Tata Kelola Data (Data Governance) serta analisis kualitas data.

Domain Data: ${currentDomain || 'Umum'}
Sample Data Mentah:
${typeof rawData === 'string' ? rawData : JSON.stringify(rawData, null, 2)}

Tugas Anda:
1. Identifikasi kecacatan kualitas data (missing values, format NIK/telepon/email/tanggal yang salah, duplikasi, casing tidak seragam).
2. Rekomendasikan nama kolom standar (standardized target column names) sesuai praktek terbaik Data Governance (e.g., snake_case Bahasa Indonesia/Inggris).
3. Berikan ringkasan audit data governance dalam Bahasa Indonesia.
4. Buat rekomendasi aturan (rules) untuk setiap kolom.

Kembalikan jawaban dalam format JSON persis sesuai schema berikut:
{
  "auditSummary": "Ringkasan analisis kualitas data dan temuan utama",
  "dataQualityIssues": ["Isu 1", "Isu 2", "Isu 3"],
  "suggestedRules": [
    {
      "id": "rule_nama_kolom",
      "columnName": "nama_kolom_asal",
      "targetColumnName": "nama_kolom_standar",
      "dataType": "nik | phone | email | string | number | date | enum | currency",
      "isRequired": true,
      "casing": "uppercase | lowercase | titlecase | none",
      "trimWhitespace": true,
      "defaultValue": "nilai_default",
      "description": "Deskripsi aturan tata kelola data"
    }
  ]
}`;

        return processStreamResponse(
            streamJsonProcess(
                prompt,
                (parsedAnalysis) => {
                    // Pastikan suggestedRules memiliki id unik
                    if (Array.isArray(parsedAnalysis.suggestedRules)) {
                        parsedAnalysis.suggestedRules = parsedAnalysis.suggestedRules.map((rule: any, index: number) => ({
                            ...rule,
                            id: rule.id || `rule-${rule.columnName || index}-${Date.now()}`,
                        }));
                    }
                    return { success: true, analysis: parsedAnalysis };
                },
                safeParseJsonObject,
            )
        );
    } catch (error: any) {
        console.error('Governance Analysis Error:', error);
        return immediateResultEvent({ success: false, error: error.message });
    }
}

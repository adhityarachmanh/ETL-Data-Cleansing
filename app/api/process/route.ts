/* eslint-disable @typescript-eslint/no-explicit-any, prefer-const, @typescript-eslint/no-unused-vars */
// File: app/api/process/route.ts
import { NextRequest } from 'next/server';
import {
    streamJsonProcess,
    processStreamResponse,
    immediateResultEvent,
} from '../../../lib/stream';
import { createResultCache, hashInput } from './cache';

// Re-export helper bersama agar konsumen/tests tetap bisa mengimpornya dari route ini
export { extractJsonArray, safeParseJson, streamJsonProcess, sseEvent, processStreamResponse, immediateResultEvent } from '../../../lib/stream';

// Cache hasil AI: eksekusi ulang dengan input identik langsung mengembalikan hasil (tanpa panggil AI)
const resultCache = createResultCache();

// Fungsi Cleansing Text Sederhana
function normalizeText(value: string): string {
    if (!value) return '';
    let text = String(value).toUpperCase().trim();
    text = text.replace(/\bPT\.?\b/g, '');
    text = text.replace(/\bPERSERO\b/g, '');
    text = text.replace(/[^A-Z0-9 ]/g, ' ');
    return text.replace(/\s+/g, ' ').trim();
}

// Fungsi Threshold Keputusan Dinamis Berdasarkan Parameter User
function decideStatus(scores: number[], autoApproveMin: number = 90, stewardReviewMin: number = 75): string {
    if (scores.length === 0) return 'NO_MATCH';
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    if (avg >= autoApproveMin) return 'AUTO_APPROVE';
    if (avg >= stewardReviewMin) return 'REVIEW';
    return 'NO_MATCH';
}

interface PureNameRawItem {
    raw_index: number;
    raw_name: string;
}

interface PureNameResultRow {
    raw_index: number;
    original: string;
    cleansed_pure_name: string | null;
    stripped_noise: string[];
}

interface MatchRawItem {
    raw_index: number;
    raw_values: { [key: string]: string };
}

interface DomainRef {
    id: string;
    name: string;
    items: string[];
}

interface MatchAiRow {
    raw_index: number;
    matches?: {
        [key: string]: { matched_index?: number | null; confidence?: number };
    };
    warning_note?: string | null;
}

interface DomainMatchResult {
    raw_val: string;
    matched_val: string;
    confidence: number;
}

interface FinalResultRow {
    raw_index: number;
    domain_matches: { [key: string]: DomainMatchResult };
    ai_method: string;
    ai_status: string;
    severity: string;
    stewardship_status: string;
    warning_note: string | null;
}

// Susun hasil PURE_NAME: isi baris yang di-omit AI, urutkan ascending
export function buildPureNameResults(aiResultJson: unknown[], formattedRaw: PureNameRawItem[]): PureNameResultRow[] {
    const map = new Map<number, PureNameResultRow>();
    aiResultJson.forEach((res) => {
        const row = res as Partial<PureNameResultRow>;
        const rawItem = formattedRaw.find((r) => r.raw_index === Number(row.raw_index));
        if (!rawItem) return;
        map.set(Number(row.raw_index), res as PureNameResultRow);
    });
    formattedRaw.forEach((r) => {
        if (!map.has(r.raw_index)) {
            map.set(r.raw_index, {
                raw_index: r.raw_index,
                original: r.raw_name,
                cleansed_pure_name: null,
                stripped_noise: [],
            });
        }
    });
    return [...map.values()].sort((a, b) => a.raw_index - b.raw_index);
}

// Susun hasil fuzzy multi-domain: sanitasi index/confidence, isi baris yang di-omit AI, urutkan ascending
export function buildFinalResults(
    aiResultJson: unknown[],
    formattedRaw: MatchRawItem[],
    domains: DomainRef[],
    autoApproveMin: number,
    stewardReviewMin: number,
): FinalResultRow[] {
    const aiMethodLabel = `${(process.env.OPENCODE_AI_MODEL || 'deepseek-v4-flash').toUpperCase().replace(/[-.]/g, '_')}_FUZZY_MULTIDOMAIN`;

    const makeRow = (rawItem: MatchRawItem, domainMatches: { [key: string]: DomainMatchResult }, warning: string | null): FinalResultRow => {
        const scores = domains.map((d) => domainMatches[d.id]?.confidence ?? 0);
        const status = decideStatus(scores, autoApproveMin, stewardReviewMin);
        return {
            raw_index: rawItem.raw_index,
            domain_matches: domainMatches,
            ai_method: aiMethodLabel,
            ai_status: status,
            severity: status === 'NO_MATCH' ? 'High' : status === 'REVIEW' ? 'Medium' : 'Low',
            stewardship_status: status === 'AUTO_APPROVE' ? 'APPROVED' : 'OPEN',
            warning_note: warning,
        };
    };

    const resultMap = new Map<number, FinalResultRow>();

    aiResultJson.forEach((res) => {
        const aiRow = res as MatchAiRow;
        const rawItem = formattedRaw.find((r) => r.raw_index === Number(aiRow.raw_index));
        if (!rawItem) return;
        const domainMatches: { [key: string]: DomainMatchResult } = {};
        domains.forEach((d) => {
            const matchInfo = aiRow.matches?.[d.id];
            const idx = Number(matchInfo?.matched_index);
            const matchedIndex = Number.isInteger(idx) && idx >= 0 && idx < d.items.length ? idx : null;
            const masterText = matchedIndex === null ? 'TIDAK DITEMUKAN' : d.items[matchedIndex];
            const rawConfidence = Number(matchInfo?.confidence);
            const confidence = matchedIndex === null || isNaN(rawConfidence) ? 0 : rawConfidence;
            domainMatches[d.id] = {
                raw_val: rawItem.raw_values?.[d.id] || '-',
                matched_val: masterText,
                confidence: confidence,
            };
        });
        resultMap.set(rawItem.raw_index, makeRow(rawItem, domainMatches, aiRow.warning_note || null));
    });

    formattedRaw.forEach((rawItem) => {
        if (resultMap.has(rawItem.raw_index)) return;
        const domainMatches: { [key: string]: DomainMatchResult } = {};
        domains.forEach((d) => {
            domainMatches[d.id] = {
                raw_val: rawItem.raw_values?.[d.id] || '-',
                matched_val: 'TIDAK DITEMUKAN',
                confidence: 0,
            };
        });
        resultMap.set(rawItem.raw_index, makeRow(rawItem, domainMatches, null));
    });

    return [...resultMap.values()].sort((a, b) => a.raw_index - b.raw_index);
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { mode, domains, rawData, thresholds, legalRefTable } = body;

        // Key cache: input request + model (hasil beda model tidak boleh saling menimpa)
        const cacheKey = hashInput({
            mode, domains, rawData, thresholds, legalRefTable,
            model: process.env.OPENCODE_AI_MODEL || 'deepseek-v4-flash',
        });

        // --- MODE 2: PURE NAME STRIPPER (FITUR PAK ZOEL - PEMBERSIH EMBEL-EMBEL LEGALITAS) ---
        if (mode === 'PURE_NAME') {
            if (!Array.isArray(rawData) || rawData.length === 0) {
                return immediateResultEvent({ success: true, mode: 'PURE_NAME', data: [] });
            }

            const cached = resultCache.get(cacheKey);
            if (cached !== undefined) {
                return immediateResultEvent(cached);
            }

            const noiseList = Array.isArray(legalRefTable) && legalRefTable.length > 0
                ? legalRefTable
                : ["PT", "CV", "UD", "PERSERO", "(PERSERO)", "TBK", ".TBK", "FIRMA", "NV", "INC", "LTD", "CORP"];

            const formattedRawForPureName = (rawData || []).map((item: any, idx: number) => ({
                raw_index: idx,
                raw_name: String(item.raw_val || item.values?.customer_name || item.values?.[domains?.[0]?.id] || '').trim(),
            }));

            const pureNamePrompt = `
Anda adalah AI Data Engineer spesialis Cleansing & Parsing Nama Perusahaan (Legal Entity Noise Stripper).

Tabel Referensi Embel-Embel Legalitas / Legal Noise LOV:
${JSON.stringify(noiseList)}

Data Mentah Perusahaan:
${JSON.stringify(formattedRawForPureName)}

Tugas Anda:
1. Bersihkan Data Mentah dari SEMUA embel-embel legalitas (seperti PT, CV, (PERSERO), PERSERO, TBK, .TBK, UD, FIRMA, dll yang ada di tabel referensi maupun variasinya).
2. Ambil MURNI NAMA KORPORASI / PERUSAHAAN SAJA tanpa kata legalitas tersebut.
3. Contoh: "PT Bukit Asem (persero) .TBK" -> "BUKIT ASEM", "PT JAGA RAYA .tbk" -> "JAGA RAYA".

Kembalikan HANYA array JSON dengan format persis seperti ini:
[
  {
    "raw_index": 0,
    "original": "PT JAGA RAYA .tbk",
    "cleansed_pure_name": "JAGA RAYA",
    "stripped_noise": ["PT", ".TBK"]
  }
]
`;

            return processStreamResponse(
                streamJsonProcess(pureNamePrompt, (parsed) => {
                    const payload = {
                        success: true,
                        mode: 'PURE_NAME',
                        data: buildPureNameResults(parsed, formattedRawForPureName),
                    };
                    resultCache.set(cacheKey, payload);
                    return payload;
                })
            );
        }

        // --- MODE 1: FUZZY MATCHING MULTI-DOMAIN SSOT ---
        const autoApproveMin = Number(thresholds?.autoApprove) || 90;
        const stewardReviewMin = Number(thresholds?.stewardReview) || 75;

        if (!domains || !Array.isArray(domains) || domains.length === 0) {
            return immediateResultEvent({ success: false, error: 'Minimal harus ada 1 domain referensi master.' });
        }

        if (!Array.isArray(rawData) || rawData.length === 0) {
            return immediateResultEvent({ success: true, data: [] });
        }

        const cachedMatch = resultCache.get(cacheKey);
        if (cachedMatch !== undefined) {
            return immediateResultEvent(cachedMatch);
        }

        // 1. Format Domain Master untuk dimasukkan ke Prompt AI
        const formattedDomains = domains.map((domain: any, idx: number) => ({
            domain_index: idx,
            domain_id: domain.id,
            domain_name: domain.name,
            master_items: (domain.items || []).map((item: string, itemIdx: number) => ({
                index: itemIdx,
                name: item,
            })),
        }));

        // 2. Format Raw Data sebelum dikirim ke AI
        const formattedRaw = (rawData || []).map((item: any, idx: number) => {
            const rawValues: { [key: string]: string } = {};
            domains.forEach((d: any) => {
                rawValues[d.id] = item.values?.[d.id] || '';
            });
            return {
                raw_index: idx,
                cleansed_primary_name: normalizeText(item.values?.[domains[0]?.id] || ''),
                raw_values: rawValues,
            };
        });

        // 3. Siapkan Prompt Dinamis untuk AI (Mendukung N-Domain)
        const prompt = `
Anda adalah AI Data Engineer. Tugas Anda mencocokkan Data Mentah (Raw Data) ke beberapa Domain Master Referensi berikut:

${formattedDomains
                .map(
                    (d) => `--- DOMAIN [${d.domain_id}] (${d.domain_name}) ---
Master Data: ${JSON.stringify(d.master_items)}
`
                )
                .join('\n')}

Raw Data:
${JSON.stringify(formattedRaw)}

Tugas Anda:
Cocokkan setiap item dari Raw Data ke SETIAP Domain Master di atas berdasarkan nilai di "raw_values".
Selain itu, lakukan evaluasi konsistensi konteks antar-domain.

Kembalikan HANYA array JSON dengan format persis seperti ini:
[
  {
    "raw_index": 0,
    "matches": {
      ${formattedDomains
                .map((d) => `"${d.domain_id}": { "matched_index": 0, "confidence": 95.0 }`)
                .join(',\n      ')}
    },
    "warning_note": null
  }
]

Aturan Skoring & Anomali Kontradiksi:
1. Exact / Full Standard Match (contoh: "PLN" -> "PLN", "PERTAMINA" -> "PERTAMINA"): berikan confidence >= 95.0.
2. Partial / Fuzzy / Contain Match (contoh: "Kabupaten Badung, Bali" -> "BALI"): berikan confidence antara 85.0 hingga 92.0 agar masuk Steward Review.
3. Kontradiksi Lintas Domain (Cross-Domain Anomaly): Jika nama entitas mengindikasikan sektor tertentu (contoh: "PT Listrik Mandiri" / "PT Minyak Sejahtera") tetapi sektor yang dimasukkan tidak sesuai (contoh: "Pengairan" / "Ritel"), turunkan skor confidence sektor ke 80.0-88.0 dan sertakan penjelasan singkat pada "warning_note" (contoh: "Kontradiksi: Entitas berbasis Listrik tetapi sektor terisi Pengairan").
4. Tidak Cocok / Berbeda Jauh: isi "matched_index" dengan null dan berikan confidence < 50.0.
`;

        // 4. Panggil AI (streaming)
        return processStreamResponse(
            streamJsonProcess(prompt, (parsed) => {
                const payload = {
                    success: true,
                    data: buildFinalResults(parsed, formattedRaw, domains, autoApproveMin, stewardReviewMin),
                };
                resultCache.set(cacheKey, payload);
                return payload;
            })
        );
    } catch (error: any) {
        console.error('API Error:', error);
        return immediateResultEvent({ success: false, error: error.message });
    }
}
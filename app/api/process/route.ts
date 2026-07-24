// File: app/api/process/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

// Inisialisasi Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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

export async function POST(req: NextRequest) {
    try {
        // Tangkap data domains, rawData, dan threshold dinamis dari request body
        const { domains, rawData, thresholds } = await req.json();
        const autoApproveMin = Number(thresholds?.autoApprove) || 90;
        const stewardReviewMin = Number(thresholds?.stewardReview) || 75;

        if (!domains || !Array.isArray(domains) || domains.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Minimal harus ada 1 domain referensi master.' },
                { status: 400 }
            );
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

        // 3. Siapkan Prompt Dinamis untuk Gemini (Mendukung N-Domain)
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

        // 4. Panggil Gemini AI
        const response = await ai.models.generateContent({
            model: 'gemini-3.6-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
            },
        });

        const aiResultText = (response.text || '').replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
        const aiResultJson = JSON.parse(aiResultText || '[]');

        // 5. Olah Hasil & Susun Output Audit Trail Multi-Domain
        const finalResults = aiResultJson.map((res: any) => {
            const rawItem = formattedRaw.find((r: any) => r.raw_index === res.raw_index);
            const domainMatches: { [key: string]: any } = {};
            const scores: number[] = [];

            domains.forEach((d: any) => {
                const matchInfo = res.matches?.[d.id];
                const matchedIndex = matchInfo?.matched_index;

                // Pastikan confidence selalu berupa number murni
                const rawConfidence = Number(matchInfo?.confidence);
                const confidence = !isNaN(rawConfidence) ? rawConfidence : 0;

                const masterText =
                    matchedIndex !== null &&
                        matchedIndex !== undefined &&
                        d.items[matchedIndex] !== undefined
                        ? d.items[matchedIndex]
                        : 'TIDAK DITEMUKAN';

                domainMatches[d.id] = {
                    raw_val: rawItem?.raw_values?.[d.id] || '-',
                    matched_val: masterText,
                    confidence: confidence,
                };

                scores.push(confidence);
            });

            const status = decideStatus(scores, autoApproveMin, stewardReviewMin);

            return {
                raw_index: res.raw_index,
                domain_matches: domainMatches,
                ai_method: 'GEMINI_3.6_FLASH_FUZZY_MULTIDOMAIN',
                ai_status: status,
                severity: status === 'NO_MATCH' ? 'High' : status === 'REVIEW' ? 'Medium' : 'Low',
                stewardship_status: status === 'AUTO_APPROVE' ? 'APPROVED' : 'OPEN',
                warning_note: res.warning_note || null,
            };
        });

        return NextResponse.json({ success: true, data: finalResults });
    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
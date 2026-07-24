// File: app/api/process/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

// Inisialisasi Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Fungsi Cleansing Text
function normalizeName(value: string): string {
    if (!value) return '';
    let text = String(value).toUpperCase().trim();
    text = text.replace(/\bPT\.?\b/g, '');
    text = text.replace(/\bPERSERO\b/g, '');
    text = text.replace(/[^A-Z0-9 ]/g, ' ');
    return text.replace(/\s+/g, ' ').trim();
}

// Fungsi Threshold Keputusan
function decideStatus(score: number): string {
    if (score >= 95) return 'AUTO_APPROVE';
    if (score >= 85) return 'REVIEW';
    return 'NO_MATCH';
}

export async function POST(req: NextRequest) {
    try {
        // Tangkap data multi-domain dari request JSON
        const { masterData, sectorData, rawData } = await req.json();

        // 1. Cleansing Data Mentah sebelum dikirim ke AI
        const cleanedRaw = rawData.map((item: any, index: number) => ({
            index,
            original_name: item.customer_name_raw || item.name || '',
            cleansed_name: normalizeName(item.customer_name_raw || item.name),
            sector_raw: item.sector_raw || '', // Sisipkan data sektor raw
        }));

        const masterList = masterData.map((item: any, index: number) => ({
            index,
            master_name: item.customer_name_standard || item.name,
        }));

        const sectorList = (sectorData || []).map((item: any, index: number) => ({
            index,
            sector_name: item.sector_name_standard || item.name,
        }));

        // 2. Siapkan Prompt untuk Gemini (Multi-Domain)
        const prompt = `
      Anda adalah AI Data Engineer. Tugas Anda mencocokkan data entitas ke dua domain referensi.

      DOMAIN 1 - Master Data Nama Entitas: ${JSON.stringify(masterList)}
      DOMAIN 2 - Master Data Sektor: ${JSON.stringify(sectorList)}

      Raw Data (Sudah dibersihkan): ${JSON.stringify(cleanedRaw)}

      Cocokkan setiap Raw Data ke:
      1. Master Data Nama Entitas yang paling tepat (berdasarkan cleansed_name)
      2. Master Data Sektor yang paling tepat (berdasarkan sector_raw)

      Kembalikan HANYA array JSON dengan format persis seperti ini:
      [
        {
          "raw_index": 0,
          "matched_master_index": 1,
          "confidence_score": 96.5,
          "matched_sector_index": 0,
          "sector_confidence": 92.0
        }
      ]
      Berikan confidence_score dan sector_confidence antara 0 hingga 100.
      Jika tidak ada yang cocok, isi matched_master_index / matched_sector_index dengan null dan berikan score rendah.
    `;

        // 3. Panggil Gemini
        const response = await ai.models.generateContent({
            model: 'gemini-3.6-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
            },
        });

        const aiResultText = response.text;
        const aiResultJson = JSON.parse(aiResultText || '[]');

        // 4. Proses Hasil & Tambahkan Status Cleansing (Skema Tabel AI_CLEANSING_RESULT & DQ_ISSUE_DETAIL)
        const finalResults = aiResultJson.map((res: any) => {
            const rawItem = cleanedRaw.find((r: any) => r.index === res.raw_index);
            const masterItem = masterList.find((m: any) => m.index === res.matched_master_index);
            const sectorItem = sectorList.find((s: any) => s.index === res.matched_sector_index);
            const status = decideStatus(res.confidence_score);

            return {
                field_name: 'customer_name',
                original_value: rawItem?.original_name,
                cleansed_value: rawItem?.cleansed_name,
                suggested_master: masterItem ? masterItem.master_name : 'TIDAK DITEMUKAN',
                confidence_score: res.confidence_score || 0,

                // Output Domain Sektor
                sector_raw: rawItem?.sector_raw || '-',
                sector_matched: sectorItem ? sectorItem.sector_name : 'TIDAK DITEMUKAN',
                sector_confidence: res.sector_confidence || 0,

                // Metadata AI & Data Quality
                ai_method: 'GEMINI_3.6_FLASH_FUZZY',
                ai_status: status,
                severity: status === 'NO_MATCH' ? 'High' : (status === 'REVIEW' ? 'Medium' : 'Low'),
                stewardship_status: status === 'AUTO_APPROVE' ? 'APPROVED' : 'OPEN',
            };
        });

        return NextResponse.json({ success: true, data: finalResults });

    } catch (error: any) {
        console.error("API Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
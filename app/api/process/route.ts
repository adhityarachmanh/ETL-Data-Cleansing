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
    const { masterData, rawData } = await req.json();

    // 1. Cleansing Data Mentah sebelum dikirim ke AI
    const cleanedRaw = rawData.map((item: any, index: number) => ({
      index,
      original_name: item.customer_name_raw || item.name,
      cleansed_name: normalizeName(item.customer_name_raw || item.name),
    }));

    const masterList = masterData.map((item: any, index: number) => ({
      index,
      master_name: item.customer_name_standard || item.name,
    }));

    // 2. Siapkan Prompt untuk Gemini
    const prompt = `
      Anda adalah AI Data Engineer. Tugas Anda mencocokkan data entitas.
      Master Data: ${JSON.stringify(masterList)}
      Raw Data (Sudah dibersihkan): ${JSON.stringify(cleanedRaw)}
      
      Cocokkan setiap Raw Data ke Master Data yang paling tepat.
      Kembalikan HANYA array JSON dengan format:
      [
        { "raw_index": 0, "matched_master_index": 1, "confidence_score": 96.5 }
      ]
      Berikan confidence_score antara 0 hingga 100. Jika tidak ada yang cocok, isi matched_master_index dengan null dan score rendah.
    `;

    // 3. Panggil Gemini (Menggunakan responseSchema untuk menjamin format JSON)
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const aiResultText = response.text;
    const aiResultJson = JSON.parse(aiResultText || '[]');

    // 4. Proses Hasil & Tambahkan Status Cleansing
    const finalResults = aiResultJson.map((res: any) => {
      const rawItem = cleanedRaw.find((r: any) => r.index === res.raw_index);
      const masterItem = masterList.find((m: any) => m.index === res.matched_master_index);
      
      return {
        original_value: rawItem?.original_name,
        cleansed_value: rawItem?.cleansed_name,
        suggested_master: masterItem ? masterItem.master_name : 'TIDAK DITEMUKAN',
        confidence_score: res.confidence_score,
        ai_status: decideStatus(res.confidence_score),
      };
    });

    return NextResponse.json({ success: true, data: finalResults });

  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
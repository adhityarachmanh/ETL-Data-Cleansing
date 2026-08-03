import { describe, it, expect } from 'vitest';
import { extractJsonArray, safeParseJson } from '../app/api/process/route';

describe('extractJsonArray', () => {
    it('extract dari fenced block dengan trailing newline', () => {
        const t = '```json\n[{"a":1}]\n```\n';
        expect(JSON.parse(extractJsonArray(t)!)).toEqual([{ a: 1 }]);
    });
    it('terima plain JSON', () => {
        expect(extractJsonArray('[{"a":1}]')).toBe('[{"a":1}]');
    });
    it('tolak tanpa bracket', () => {
        expect(extractJsonArray('tidak ada json')).toBeNull();
    });
});

describe('safeParseJson', () => {
    it('parse fenced + trailing newline', () => {
        expect(safeParseJson('teks\n```json\n[{"x":1}]\n```\n')).toEqual([{ x: 1 }]);
    });
    it('parse walaupun ada teks setelah array', () => {
        expect(safeParseJson('[{"x":1}] catatan')).toEqual([{ x: 1 }]);
    });
    it('garbage → null', () => {
        expect(safeParseJson('{invalid')).toBeNull();
    });
    it('object bukan array → null', () => {
        expect(safeParseJson('{"a":1}')).toBeNull();
    });
});

vi.mock('ai', () => ({ streamText: vi.fn() }));

import { afterEach, vi } from 'vitest';
import { streamText } from 'ai';
import { processStreamResponse, streamJsonProcess } from '../app/api/process/route';

const mocked = vi.mocked(streamText);
type MockPart = { type: string; text?: string; error?: { message?: string } };
const mockStream = (parts: MockPart[]) => ({
    fullStream: (async function* () { for (const p of parts) yield p; })(),
} as unknown as Awaited<ReturnType<typeof streamText>>);

async function readEvents(res: Response) {
    const text = await res.text();
    return text.split('\n\n').filter(Boolean).map((block) => {
        const type = block.match(/^event: (.+)$/m)?.[1] || '';
        const data = block.match(/^data: (.+)$/m)?.[1];
        return { type, data: data ? JSON.parse(data) : null };
    });
}

describe('streamJsonProcess via SSE', () => {
    afterEach(() => vi.clearAllMocks());
    it('reasoning + answer chunk → progress (thinking/answer) + result', async () => {
        mocked.mockReturnValueOnce(mockStream([
            { type: 'reasoning-start' },
            { type: 'reasoning-delta', text: 'memikirkan ' },
            { type: 'reasoning-delta', text: 'jawaban' },
            { type: 'text-delta', text: '[{"a"' },
            { type: 'text-delta', text: ':1}]' },
            { type: 'finish' },
        ]));
        const events = await readEvents(processStreamResponse(streamJsonProcess('p', (p) => ({ ok: p }))));
        expect(events.map((e) => e.type)).toEqual(['progress', 'progress', 'progress', 'progress', 'result']);
        expect(events[0].data).toEqual({ text: 'memikirkan ', source: 'thinking' });
        expect(events[1].data).toEqual({ text: 'jawaban', source: 'thinking' });
        expect(events[2].data).toEqual({ text: '[{"a"', source: 'answer' });
        expect(events[4].data).toEqual({ ok: [{ a: 1 }] });
        expect(mocked).toHaveBeenCalledTimes(1);
    });
    it('invalid → retry (re-prompt) → result', async () => {
        mocked.mockReturnValueOnce(mockStream([{ type: 'text-delta', text: 'bukan json' }, { type: 'finish' }]))
            .mockReturnValueOnce(mockStream([{ type: 'text-delta', text: '[{"ok":1}]' }, { type: 'finish' }]));
        const events = await readEvents(processStreamResponse(streamJsonProcess('p', (p) => p)));
        expect(events.map((e) => e.type)).toEqual(['progress', 'retry', 'progress', 'result']);
        expect(mocked).toHaveBeenCalledTimes(2);
        expect(String(mocked.mock.calls[1][0].prompt)).toContain('PENTING:');
    });
    it('2x invalid → error event', async () => {
        mocked.mockReturnValueOnce(mockStream([{ type: 'text-delta', text: 'garbage' }, { type: 'finish' }]))
            .mockReturnValueOnce(mockStream([{ type: 'text-delta', text: 'garbage' }, { type: 'finish' }]));
        const events = await readEvents(processStreamResponse(streamJsonProcess('p', (p) => p)));
        expect(events.map((e) => e.type)).toEqual(['progress', 'retry', 'progress', 'error']);
        expect(events[3].data).toEqual({ success: false, error: 'AI tidak menghasilkan JSON valid.' });
    });
    it('finalize throw → error event', async () => {
        mocked.mockReturnValueOnce(mockStream([{ type: 'text-delta', text: '[{"a":1}]' }, { type: 'finish' }]));
        const events = await readEvents(processStreamResponse(streamJsonProcess('p', () => { throw new Error('finalize boom'); })));
        expect(events[events.length - 1]).toEqual({ type: 'error', data: { success: false, error: 'finalize boom' } });
    });
    it('fullStream part error → error event', async () => {
        mocked.mockReturnValueOnce(mockStream([{ type: 'error', error: { message: 'stream boom' } }]));
        const events = await readEvents(processStreamResponse(streamJsonProcess('p', (p) => p)));
        expect(events[events.length - 1]).toEqual({ type: 'error', data: { success: false, error: 'stream boom' } });
    });
    it('fullStream throw → error event', async () => {
        mocked.mockReturnValueOnce({ fullStream: (async function* () { throw new Error('stream boom'); })() } as unknown as Awaited<ReturnType<typeof streamText>>);
        const events = await readEvents(processStreamResponse(streamJsonProcess('p', (p) => p)));
        expect(events[events.length - 1]).toEqual({ type: 'error', data: { success: false, error: 'stream boom' } });
    });
});

import { buildPureNameResults, buildFinalResults } from '../app/api/process/route';

describe('buildPureNameResults', () => {
    it('pertahankan hasil AI apa adanya', () => {
        const raw = [{ raw_index: 0, raw_name: 'JAGA RAYA' }];
        const ai = [{ raw_index: 0, original: 'PT JAGA RAYA .tbk', cleansed_pure_name: 'JAGA RAYA', stripped_noise: ['PT', '.TBK'] }];
        expect(buildPureNameResults(ai, raw)).toEqual(ai);
    });
    it('isi baris yang di-omit AI dengan fallback', () => {
        const raw = [
            { raw_index: 0, raw_name: 'JAGA RAYA' },
            { raw_index: 1, raw_name: 'BUKIT ASEM' },
        ];
        const ai = [{ raw_index: 0, original: 'PT JAGA RAYA .tbk', cleansed_pure_name: 'JAGA RAYA', stripped_noise: [] }];
        const result = buildPureNameResults(ai, raw);
        expect(result).toHaveLength(2);
        expect(result[1]).toEqual({ raw_index: 1, original: 'BUKIT ASEM', cleansed_pure_name: null, stripped_noise: [] });
    });
    it('urutkan ascending walau respons AI acak', () => {
        const raw = [
            { raw_index: 0, raw_name: 'A' },
            { raw_index: 1, raw_name: 'B' },
            { raw_index: 2, raw_name: 'C' },
        ];
        const ai = [
            { raw_index: 2, original: 'C', cleansed_pure_name: 'C', stripped_noise: [] },
            { raw_index: 0, original: 'A', cleansed_pure_name: 'A', stripped_noise: [] },
        ];
        const result = buildPureNameResults(ai, raw);
        expect(result.map((r) => r.raw_index)).toEqual([0, 1, 2]);
    });
    it('abaikan raw_index yang tidak dikenal AI', () => {
        const raw = [{ raw_index: 0, raw_name: 'A' }];
        const ai = [
            { raw_index: 0, original: 'A', cleansed_pure_name: 'A', stripped_noise: [] },
            { raw_index: 99, original: 'X', cleansed_pure_name: 'X', stripped_noise: [] },
        ];
        expect(buildPureNameResults(ai, raw)).toHaveLength(1);
    });
});

const DOMAINS = [
    { id: 'sector', name: 'Sektor', items: ['ENERGY', 'RETAIL'] },
    { id: 'company', name: 'Perusahaan', items: ['PLN', 'PERTAMINA'] },
];
const RAW = [
    {
        raw_index: 0,
        cleansed_primary_name: 'PLN',
        raw_values: { sector: 'Listrik', company: 'PT PLN' },
    },
    {
        raw_index: 1,
        cleansed_primary_name: 'TIDAK ADA',
        raw_values: { sector: 'Xyz', company: 'Qwerty' },
    },
];

describe('buildFinalResults', () => {
    it('match valid → status AUTO_APPROVE, matched_val dari master', () => {
        const ai = [
            { raw_index: 0, matches: { sector: { matched_index: 0, confidence: 95 }, company: { matched_index: 0, confidence: 96 } }, warning_note: null },
        ];
        const result = buildFinalResults(ai, RAW, DOMAINS, 90, 75);
        expect(result[0].domain_matches.sector).toEqual({ raw_val: 'Listrik', matched_val: 'ENERGY', confidence: 95 });
        expect(result[0].domain_matches.company).toEqual({ raw_val: 'PT PLN', matched_val: 'PLN', confidence: 96 });
        expect(result[0].ai_status).toBe('AUTO_APPROVE');
        expect(result[0].ai_method).toContain('FUZZY_MULTIDOMAIN');
    });

    it('matched_index out of range → TIDAK DITEMUKAN + confidence 0', () => {
        const ai = [
            { raw_index: 0, matches: { sector: { matched_index: 99, confidence: 95 }, company: { matched_index: 0, confidence: 96 } }, warning_note: null },
        ];
        const result = buildFinalResults(ai, RAW, DOMAINS, 90, 75);
        expect(result[0].domain_matches.sector.matched_val).toBe('TIDAK DITEMUKAN');
        expect(result[0].domain_matches.sector.confidence).toBe(0);
    });

    it('matched_index non-integer → TIDAK DITEMUKAN + confidence 0', () => {
        const ai = [
            { raw_index: 0, matches: { sector: { matched_index: 'abc', confidence: 95 }, company: { matched_index: 0, confidence: 96 } }, warning_note: null },
        ];
        const result = buildFinalResults(ai, RAW, DOMAINS, 90, 75);
        expect(result[0].domain_matches.sector.matched_val).toBe('TIDAK DITEMUKAN');
        expect(result[0].domain_matches.sector.confidence).toBe(0);
    });

    it('raw_index yang di-omit AI → baris NO_MATCH terisi', () => {
        const ai = [
            { raw_index: 0, matches: { sector: { matched_index: 0, confidence: 95 }, company: { matched_index: 0, confidence: 96 } }, warning_note: null },
        ];
        const result = buildFinalResults(ai, RAW, DOMAINS, 90, 75);
        expect(result).toHaveLength(2);
        expect(result[1].raw_index).toBe(1);
        expect(result[1].domain_matches.sector).toEqual({ raw_val: 'Xyz', matched_val: 'TIDAK DITEMUKAN', confidence: 0 });
        expect(result[1].ai_status).toBe('NO_MATCH');
    });

    it('respons urut acak → output ascending', () => {
        const ai = [
            { raw_index: 1, matches: { sector: { matched_index: null, confidence: 10 }, company: { matched_index: null, confidence: 20 } }, warning_note: null },
            { raw_index: 0, matches: { sector: { matched_index: 0, confidence: 95 }, company: { matched_index: 0, confidence: 96 } }, warning_note: null },
        ];
        const result = buildFinalResults(ai, RAW, DOMAINS, 90, 75);
        expect(result.map((r) => r.raw_index)).toEqual([0, 1]);
    });

    it('warning_note diteruskan', () => {
        const ai = [
            { raw_index: 0, matches: { sector: { matched_index: 0, confidence: 80 }, company: { matched_index: 0, confidence: 90 } }, warning_note: 'Kontradiksi: sektor' },
        ];
        const result = buildFinalResults(ai, RAW, DOMAINS, 90, 75);
        expect(result[0].warning_note).toBe('Kontradiksi: sektor');
    });
});

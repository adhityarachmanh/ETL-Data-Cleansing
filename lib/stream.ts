// File: lib/stream.ts
// Helper bersama: streaming SSE untuk panggilan AI + parsing JSON yang tahan banting.
/* eslint-disable @typescript-eslint/no-explicit-any, prefer-const, @typescript-eslint/no-unused-vars */
import { streamText } from 'ai';
import { aiModel } from './ai';

// --- Parsing JSON ---

// Ekstrak array JSON dari respons AI (tahan terhadap markdown fence, teks tambahan, trailing newline)
export function extractJsonArray(text: string): string | null {
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    const candidate = fenced ? fenced[1] : text;
    const start = candidate.indexOf('[');
    const end = candidate.lastIndexOf(']');
    if (start === -1 || end === -1 || end <= start) return null;
    return candidate.slice(start, end + 1);
}

// Ekstrak objek JSON dari respons AI
export function extractJsonObject(text: string): string | null {
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    const candidate = fenced ? fenced[1] : text;
    const start = candidate.indexOf('{');
    const end = candidate.lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start) return null;
    return candidate.slice(start, end + 1);
}

// Parse respons AI menjadi array; null jika tidak valid
export function safeParseJson(text: string): any[] | null {
    const cleaned = extractJsonArray(text);
    if (!cleaned) return null;
    try {
        const parsed = JSON.parse(cleaned);
        return Array.isArray(parsed) ? parsed : null;
    } catch {
        return null;
    }
}

// Parse respons AI menjadi objek; null jika tidak valid
export function safeParseJsonObject(text: string): any | null {
    const cleaned = extractJsonObject(text);
    if (!cleaned) return null;
    try {
        const parsed = JSON.parse(cleaned);
        return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
    } catch {
        return null;
    }
}

// --- Streaming SSE ---

const JSON_ONLY_REPROMPT = '\n\nPENTING: Kembalikan HANYA JSON murni tanpa markdown fence, tanpa teks lain apa pun.';

export type ProcessEvent =
    | { type: 'progress'; text: string; source: 'thinking' | 'answer' }
    | { type: 'retry' }
    | { type: 'result'; payload: unknown }
    | { type: 'error'; message: string };

type ParseFn = (text: string) => unknown | null;

// Panggil AI (streaming) dan pastikan hasil berupa JSON valid; retry sekali dengan re-prompt.
// parseFn menentukan apakah hasil yang diharapkan array (safeParseJson) atau objek (safeParseJsonObject).
export async function* streamJsonProcess(
    prompt: string,
    finalize: (parsed: any) => unknown,
    parseFn: ParseFn = safeParseJson,
): AsyncGenerator<ProcessEvent> {
    for (let attempt = 0; attempt < 2; attempt++) {
        if (attempt === 1) yield { type: 'retry' };
        const result = streamText({
            model: aiModel,
            prompt: attempt === 0 ? prompt : prompt + JSON_ONLY_REPROMPT,
        });
        let full = '';
        try {
            for await (const part of result.fullStream) {
                if (part.type === 'reasoning-delta') {
                    yield { type: 'progress', text: part.text, source: 'thinking' };
                } else if (part.type === 'text-delta') {
                    full += part.text;
                    yield { type: 'progress', text: part.text, source: 'answer' };
                } else if (part.type === 'error') {
                    const streamError = part.error as { message?: string };
                    yield { type: 'error', message: streamError.message || 'Stream error' };
                    return;
                }
            }
        } catch (err: unknown) {
            yield { type: 'error', message: (err as Error).message };
            return;
        }
        const parsed = parseFn(full);
        if (parsed) {
            yield { type: 'result', payload: finalize(parsed) };
            return;
        }
    }
    yield { type: 'error', message: 'AI tidak menghasilkan JSON valid.' };
}

export function sseEvent(name: string, data: unknown): string {
    return `event: ${name}\ndata: ${JSON.stringify(data)}\n\n`;
}

// Bungkus stream event menjadi Response SSE
export function processStreamResponse(stream: AsyncGenerator<ProcessEvent>): Response {
    const encoder = new TextEncoder();
    return new Response(
        new ReadableStream({
            async start(controller) {
                try {
                    for await (const evt of stream) {
                        if (evt.type === 'progress') {
                            controller.enqueue(encoder.encode(sseEvent('progress', { text: evt.text, source: evt.source })));
                        } else if (evt.type === 'retry') {
                            controller.enqueue(encoder.encode(sseEvent('retry', { message: 'Output tidak valid, mencoba ulang...' })));
                        } else if (evt.type === 'result') {
                            controller.enqueue(encoder.encode(sseEvent('result', evt.payload)));
                        } else {
                            controller.enqueue(encoder.encode(sseEvent('error', { success: false, error: evt.message })));
                        }
                    }
                } catch (err: unknown) {
                    controller.enqueue(encoder.encode(sseEvent('error', { success: false, error: (err as Error).message })));
                } finally {
                    controller.close();
                }
            },
        }),
        {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                Connection: 'keep-alive',
            },
        },
    );
}

// Response SSE instan (hasil/error langsung, tanpa streaming)
export function immediateResultEvent(payload: unknown): Response {
    return new Response(sseEvent('result', payload), {
        headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
    });
}

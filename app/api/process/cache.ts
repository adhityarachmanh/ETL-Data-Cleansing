// File: app/api/process/cache.ts
import { createHash } from 'crypto';

// Serialisasi kanonik (urutan kunci objek tidak memengaruhi hasil) untuk hash yang deterministik
function canonicalStringify(value: unknown): string {
    if (Array.isArray(value)) {
        return `[${value.map(canonicalStringify).join(',')}]`;
    }
    if (value !== null && typeof value === 'object') {
        const entries = Object.entries(value as Record<string, unknown>)
            .map(([k, v]) => `${JSON.stringify(k)}:${canonicalStringify(v)}`)
            .sort();
        return `{${entries.join(',')}}`;
    }
    return JSON.stringify(value);
}

// Hash deterministik dari payload input request (basis key cache)
export function hashInput(payload: unknown): string {
    return createHash('sha256').update(canonicalStringify(payload)).digest('hex');
}

// Cache hasil AI in-memory: key → payload hasil; evict entri tertua saat melebihi maxEntries
export function createResultCache(maxEntries: number = 100) {
    const map = new Map<string, unknown>();
    return {
        get(key: string): unknown {
            return map.get(key);
        },
        set(key: string, value: unknown): void {
            map.set(key, value);
            if (map.size > maxEntries) {
                const oldest = map.keys().next().value;
                if (oldest !== undefined) map.delete(oldest);
            }
        },
        size(): number {
            return map.size;
        },
    };
}

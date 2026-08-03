import { describe, it, expect } from 'vitest';
import { createResultCache, hashInput } from '../app/api/process/cache';

describe('hashInput', () => {
    it('input identik → hash identik (urutan kunci tidak relevan)', () => {
        expect(hashInput({ a: 1, b: [2, 3] })).toBe(hashInput({ b: [2, 3], a: 1 }));
    });
    it('input berbeda → hash berbeda', () => {
        expect(hashInput({ a: 1, b: [2, 3] })).not.toBe(hashInput({ a: 1, b: [2, 4] }));
    });
    it('hash konsisten antar pemanggilan', () => {
        expect(hashInput({ mode: 'PURE_NAME', rawData: [{ raw_val: 'x' }] }))
            .toBe(hashInput({ mode: 'PURE_NAME', rawData: [{ raw_val: 'x' }] }));
    });
});

describe('createResultCache', () => {
    it('set + get mengembalikan nilai yang sama', () => {
        const cache = createResultCache();
        cache.set('k1', { success: true });
        expect(cache.get('k1')).toEqual({ success: true });
        expect(cache.size()).toBe(1);
    });
    it('get untuk key yang belum ada → undefined', () => {
        const cache = createResultCache();
        expect(cache.get('nope')).toBeUndefined();
    });
    it('evict entri tertua saat melebihi maxEntries', () => {
        const cache = createResultCache(2);
        cache.set('a', 1);
        cache.set('b', 2);
        cache.set('c', 3);
        expect(cache.size()).toBe(2);
        expect(cache.get('a')).toBeUndefined();
        expect(cache.get('b')).toBe(2);
        expect(cache.get('c')).toBe(3);
    });
    it('set ulang key yang sama memperbarui nilai tanpa menambah entri', () => {
        const cache = createResultCache(2);
        cache.set('a', 1);
        cache.set('a', 2);
        expect(cache.size()).toBe(1);
        expect(cache.get('a')).toBe(2);
    });
});

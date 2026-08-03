import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import React from 'react';
import ResultsPanel from '../app/components/ResultsPanel';

describe('ResultsPanel render', () => {
    it('renders PURE_NAME results (cards + table)', () => {
        const html = renderToString(
            <ResultsPanel
                mode="PURE_NAME"
                results={[{ raw_index: 0, original: 'PT JAGA RAYA .tbk', cleansed_pure_name: 'JAGA RAYA', stripped_noise: ['PT', '.TBK'] }]}
                domains={[{ id: 'x', name: 'X', items: [] }]}
                autoApproveThreshold={90}
                stewardReviewThreshold={75}
                onClear={() => { }}
            />
        );
        expect(html).toContain('CLEANSED 100%');
        expect(html).toContain('PT JAGA RAYA .tbk');
        expect(html).toContain('JAGA RAYA');
        expect(html).toContain('.TBK');
    });

    it('renders MATCH results (stats, badge, warning)', () => {
        const html = renderToString(
            <ResultsPanel
                mode="MATCHING"
                results={[{
                    raw_index: 0,
                    ai_status: 'AUTO_APPROVE',
                    domain_matches: { sector: { raw_val: 'Listrik', matched_val: 'ENERGY', confidence: 95 } },
                    warning_note: 'Kontradiksi: sektor',
                }]}
                domains={[{ id: 'sector', name: 'Sektor', items: [] }]}
                autoApproveThreshold={90}
                stewardReviewThreshold={75}
                onClear={() => { }}
            />
        );
        expect(html).toContain('AUTO APPROVE');
        expect(html).toContain('ENERGY');
        expect(html).toContain('Listrik');
        expect(html).toContain('Anomali');
        expect(html).toContain('Record');
        expect(html).toContain('%');
    });

    it('renders nothing when results empty', () => {
        const html = renderToString(
            <ResultsPanel mode="MATCHING" results={[]} domains={[]} autoApproveThreshold={90} stewardReviewThreshold={75} onClear={() => { }} />
        );
        expect(html).toBe('');
    });
});

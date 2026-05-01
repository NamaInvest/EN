/**
 * Unit tests for Numbering Sequences Engine
 * Uses an in-memory mock of prisma.numberingSequence + $transaction
 * to verify concurrency-safety, reset frequencies, padding, and prefix/suffix.
 */

import { generateNextNumber, peekNextNumber, resetSequence } from './numbering';

type Row = {
    id: number;
    code: string;
    name: string | null;
    prefix: string;
    suffix: string;
    padLength: number;
    current: bigint;
    resetFrequency: string;
    branchId: number | null;
    fiscalYear: number | null;
    fiscalMonth: number | null;
    lastReset: Date | null;
    isActive: boolean;
};

function createMockPrisma() {
    const rows: Row[] = [];
    let nextId = 1;

    const matches = (r: Row, where: any) => {
        for (const k of Object.keys(where)) {
            const expected = where[k];
            if (expected === undefined) continue;
            if ((r as any)[k] !== expected) return false;
        }
        return true;
    };

    // Mimic Prisma: return a fresh snapshot of the row, not a live reference,
    // so that subsequent updates from other txs cannot mutate already-returned data.
    const snapshot = (r: Row): Row => ({ ...r });

    const numberingSequence = {
        async findFirst({ where }: any) {
            const r = rows.find(row => matches(row, where));
            return r ? snapshot(r) : null;
        },
        async updateMany({ where, data }: any) {
            const matched = rows.filter(r => matches(r, where));
            for (const r of matched) {
                if (data.current?.increment) {
                    r.current = r.current + BigInt(data.current.increment);
                } else if (data.current !== undefined) {
                    r.current = typeof data.current === 'bigint' ? data.current : BigInt(data.current);
                }
                if (data.lastReset) r.lastReset = data.lastReset;
            }
            return { count: matched.length };
        },
        async create({ data }: any) {
            const row: Row = {
                id: nextId++,
                code: data.code,
                name: data.name ?? null,
                prefix: data.prefix ?? '',
                suffix: data.suffix ?? '',
                padLength: data.padLength ?? 6,
                current: typeof data.current === 'bigint' ? data.current : BigInt(data.current ?? 0),
                resetFrequency: data.resetFrequency ?? 'never',
                branchId: data.branchId ?? null,
                fiscalYear: data.fiscalYear ?? null,
                fiscalMonth: data.fiscalMonth ?? null,
                lastReset: data.lastReset ?? null,
                isActive: data.isActive ?? true,
            };
            rows.push(row);
            return snapshot(row);
        },
    };

    // Simulate Serializable isolation with a strict mutex
    let lock: Promise<void> = Promise.resolve();

    return {
        numberingSequence,
        async $transaction(fn: any) {
            const previous = lock;
            let releaseLock!: () => void;
            lock = new Promise<void>(resolve => { releaseLock = resolve; });
            await previous;
            try {
                return await fn({ numberingSequence });
            } finally {
                releaseLock();
            }
        },
        _rows: rows,
    } as any;
}

describe('numbering.generateNextNumber', () => {
    it('produces zero-padded sequential numbers with default config', async () => {
        const prisma = createMockPrisma();
        const a = await generateNextNumber(prisma, 'WO', { date: new Date('2026-05-01') });
        const b = await generateNextNumber(prisma, 'WO', { date: new Date('2026-05-01') });
        const c = await generateNextNumber(prisma, 'WO', { date: new Date('2026-05-01') });

        expect(a).toBe('WO-2026-000001');
        expect(b).toBe('WO-2026-000002');
        expect(c).toBe('WO-2026-000003');
    });

    it('resets yearly when date crosses year boundary', async () => {
        const prisma = createMockPrisma();
        await generateNextNumber(prisma, 'INV', { date: new Date('2026-12-31') });
        await generateNextNumber(prisma, 'INV', { date: new Date('2026-12-31') });
        const first2027 = await generateNextNumber(prisma, 'INV', { date: new Date('2027-01-01') });
        const second2027 = await generateNextNumber(prisma, 'INV', { date: new Date('2027-01-15') });

        expect(first2027).toBe('INV-2027-000001');
        expect(second2027).toBe('INV-2027-000002');
    });

    it('resets monthly for codes configured as monthly (SAL)', async () => {
        const prisma = createMockPrisma();
        const jan = await generateNextNumber(prisma, 'SAL', { date: new Date('2026-01-15') });
        const jan2 = await generateNextNumber(prisma, 'SAL', { date: new Date('2026-01-20') });
        const feb = await generateNextNumber(prisma, 'SAL', { date: new Date('2026-02-01') });

        expect(jan).toBe('SAL-2026-000001');
        expect(jan2).toBe('SAL-2026-000002');
        expect(feb).toBe('SAL-2026-000001');
    });

    it('does not include year for never-reset codes (FA)', async () => {
        const prisma = createMockPrisma();
        const a = await generateNextNumber(prisma, 'FA', { date: new Date('2026-05-01') });
        const b = await generateNextNumber(prisma, 'FA', { date: new Date('2030-01-01') });

        expect(a).toBe('FA-000001');
        expect(b).toBe('FA-000002');
    });

    it('keeps independent sequences per branch', async () => {
        const prisma = createMockPrisma();
        const b1a = await generateNextNumber(prisma, 'INV', { branchId: 1, date: new Date('2026-05-01') });
        const b1b = await generateNextNumber(prisma, 'INV', { branchId: 1, date: new Date('2026-05-01') });
        const b2a = await generateNextNumber(prisma, 'INV', { branchId: 2, date: new Date('2026-05-01') });

        expect(b1a).toBe('INV-2026-000001');
        expect(b1b).toBe('INV-2026-000002');
        expect(b2a).toBe('INV-2026-000001');
    });

    it('handles concurrent calls atomically (no duplicates)', async () => {
        const prisma = createMockPrisma();
        const calls = Array.from({ length: 50 }, () =>
            generateNextNumber(prisma, 'PO', { date: new Date('2026-05-01') })
        );
        const results = await Promise.all(calls);
        const unique = new Set(results);
        expect(unique.size).toBe(50);
        expect(results.sort()).toContain('PO-2026-000001');
        expect(results.sort()).toContain('PO-2026-000050');
    });

    it('falls back to default config for unknown code', async () => {
        const prisma = createMockPrisma();
        const num = await generateNextNumber(prisma, 'CUSTOM', { date: new Date('2026-05-01') });
        expect(num).toBe('CUSTOM-000001');
    });
});

describe('numbering.peekNextNumber', () => {
    it('returns next-in-line without consuming it', async () => {
        const prisma = createMockPrisma();
        await generateNextNumber(prisma, 'WO', { date: new Date('2026-05-01') });
        const peeked = await peekNextNumber(prisma, 'WO', { date: new Date('2026-05-01') });
        const actual = await generateNextNumber(prisma, 'WO', { date: new Date('2026-05-01') });

        expect(peeked).toBe('WO-2026-000002');
        expect(actual).toBe('WO-2026-000002');
    });

    it('peeks 1 when no sequence exists yet', async () => {
        const prisma = createMockPrisma();
        const peeked = await peekNextNumber(prisma, 'WO', { date: new Date('2026-05-01') });
        expect(peeked).toBe('WO-2026-000001');
    });
});

describe('numbering.resetSequence', () => {
    it('resets current back to 0 so next call yields 1', async () => {
        const prisma = createMockPrisma();
        await generateNextNumber(prisma, 'WO', { date: new Date('2026-05-01') });
        await generateNextNumber(prisma, 'WO', { date: new Date('2026-05-01') });
        await resetSequence(prisma, 'WO', null, 2026, null);
        const next = await generateNextNumber(prisma, 'WO', { date: new Date('2026-05-01') });
        expect(next).toBe('WO-2026-000001');
    });
});

/**
 * Unit tests for Field-Level Audit Trail
 */

import { logFieldChanges, SENSITIVE_ENTITIES } from './field-audit';

function createMockPrisma() {
    const rows: any[] = [];
    return {
        fieldAuditLog: {
            async createMany({ data }: any) {
                rows.push(...data);
                return { count: data.length };
            },
        },
        _rows: rows,
    } as any;
}

describe('logFieldChanges', () => {
    it('returns 0 for non-sensitive entity types', async () => {
        const prisma = createMockPrisma();
        const count = await logFieldChanges(prisma, 'Booking', 1, { a: 1 }, { a: 2 });
        expect(count).toBe(0);
        expect(prisma._rows).toHaveLength(0);
    });

    it('logs every changed field on update', async () => {
        const _prisma_dup28 = createMockPrisma();
        const before = { id: 1, name: 'Old', balance: 100, code: '1100' };
        const after  = { id: 1, name: 'New', balance: 250, code: '1100' };
        // @ts-expect-error [TS2304] Cannot find name
        const _count_dup31 = await logFieldChanges(prisma, 'Account', 1, before, after);
        // @ts-expect-error [TS2304] Cannot find name
        expect(count).toBe(2); // name + balance changed
        // @ts-expect-error [TS2304] Cannot find name
        const fields = prisma._rows.map((r: any) => r.fieldName).sort();
        expect(fields).toEqual(['balance', 'name']);
    });

    it('skips ignored fields like updatedAt', async () => {
        const _prisma_dup38 = createMockPrisma();
        const _before_dup39 = { id: 1, name: 'A', updatedAt: new Date('2026-01-01') };
        const _after_dup40  = { id: 1, name: 'A', updatedAt: new Date('2026-05-01') };
        // @ts-expect-error [TS2304] Cannot find name
        const _count_dup41 = await logFieldChanges(prisma, 'Account', 1, before, after);
        // @ts-expect-error [TS2304] Cannot find name
        expect(count).toBe(0);
    });

    it('logs full snapshot on create', async () => {
        const _prisma_dup46 = createMockPrisma();
        // @ts-expect-error [TS2304] Cannot find name
        const _count_dup47 = await logFieldChanges(prisma, 'Account', 1, null, { id: 1, name: 'New', balance: 0 });
        // @ts-expect-error [TS2304] Cannot find name
        expect(count).toBe(1);
        // @ts-expect-error [TS2304] Cannot find name
        expect(prisma._rows[0].changeType).toBe('create');
        // @ts-expect-error [TS2304] Cannot find name
        expect(prisma._rows[0].fieldName).toBe('__entity__');
    });

    it('logs full snapshot on delete', async () => {
        const _prisma_dup54 = createMockPrisma();
        // @ts-expect-error [TS2304] Cannot find name
        const _count_dup55 = await logFieldChanges(prisma, 'Account', 1, { id: 1, name: 'Old' }, null);
        // @ts-expect-error [TS2304] Cannot find name
        expect(count).toBe(1);
        // @ts-expect-error [TS2304] Cannot find name
        expect(prisma._rows[0].changeType).toBe('delete');
    });

    it('groups all field changes under same transactionId', async () => {
        const _prisma_dup61 = createMockPrisma();
        await logFieldChanges(
            // @ts-expect-error [TS2304] Cannot find name
            prisma, 'JournalEntry', 5,
            { id: 5, status: 'draft', description: 'Old' },
            { id: 5, status: 'posted', description: 'New' },
            { userId: 99, transactionId: 'tx-abc' }
        );
        // @ts-expect-error [TS2304] Cannot find name
        const txIds = new Set(prisma._rows.map((r: any) => r.transactionId));
        expect(txIds.size).toBe(1);
        expect([...txIds][0]).toBe('tx-abc');
    });

    it('captures userId/userEmail/ipAddress in context', async () => {
        const _prisma_dup74 = createMockPrisma();
        await logFieldChanges(
            // @ts-expect-error [TS2304] Cannot find name
            prisma, 'Account', 1,
            { balance: 100 }, { balance: 200 },
            { userId: 7, userEmail: 'admin', ipAddress: '10.0.0.1' }
        );
        // @ts-expect-error [TS2304] Cannot find name
        expect(prisma._rows[0].userId).toBe(7);
        // @ts-expect-error [TS2304] Cannot find name
        expect(prisma._rows[0].userEmail).toBe('admin');
        // @ts-expect-error [TS2304] Cannot find name
        expect(prisma._rows[0].ipAddress).toBe('10.0.0.1');
    });

    it('handles null oldValue/newValue serialization', async () => {
        const _prisma_dup86 = createMockPrisma();
        await logFieldChanges(
            // @ts-expect-error [TS2304] Cannot find name
            prisma, 'Account', 1,
            { name: null, code: '1100' },
            { name: 'Cash', code: '1100' }
        );
        // @ts-expect-error [TS2304] Cannot find name
        expect(prisma._rows[0].oldValue).toBeNull();
        // @ts-expect-error [TS2304] Cannot find name
        expect(prisma._rows[0].newValue).toBe('Cash');
    });

    it('treats Date objects as equal when same timestamp', async () => {
        const _prisma_dup97 = createMockPrisma();
        const d = new Date('2026-05-01T10:00:00Z');
        await logFieldChanges(
            // @ts-expect-error [TS2304] Cannot find name
            prisma, 'JournalEntry', 1,
            { id: 1, entryDate: d },
            { id: 1, entryDate: new Date(d.getTime()) }
        );
        // @ts-expect-error [TS2304] Cannot find name
        expect(prisma._rows).toHaveLength(0);
    });

    it('exposes SENSITIVE_ENTITIES set with key models', () => {
        expect(SENSITIVE_ENTITIES.has('JournalEntry')).toBe(true);
        expect(SENSITIVE_ENTITIES.has('Account')).toBe(true);
        expect(SENSITIVE_ENTITIES.has('FixedAsset')).toBe(true);
        expect(SENSITIVE_ENTITIES.has('NumberingSequence')).toBe(true);
        expect(SENSITIVE_ENTITIES.has('Booking')).toBe(false);
    });
});

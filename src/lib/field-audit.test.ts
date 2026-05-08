/**
 * Unit tests for Field-Level Audit Trail
 */

import { logFieldChanges, SENSITIVE_ENTITIES } from './field-audit';

function createMockPrisma() {
    const rows: any[] = [];
    return {
        auditLog: {
            async create({ data }: any) {
                rows.push(data);
                return { count: 1 };
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

    it('logs every changed field on update in diff JSON', async () => {
        const prisma = createMockPrisma();
        const before = { id: 1, name: 'Old', balance: 100, code: '1100' };
        const after  = { id: 1, name: 'New', balance: 250, code: '1100' };
        
        await logFieldChanges(prisma, 'Account', 1, before, after);
        expect(prisma._rows).toHaveLength(1);
        
        const diff = prisma._rows[0].diff;
        expect(diff).toHaveProperty('name');
        expect(diff).toHaveProperty('balance');
        expect(diff.name.after).toBe('New');
    });

    it('skips ignored fields like updatedAt', async () => {
        const prisma = createMockPrisma();
        const before = { id: 1, name: 'A', updatedAt: new Date('2026-01-01') };
        const after  = { id: 1, name: 'A', updatedAt: new Date('2026-05-01') };
        
        const count = await logFieldChanges(prisma, 'Account', 1, before, after);
        expect(count).toBe(0);
    });

    it('logs full snapshot on create', async () => {
        const prisma = createMockPrisma();
        
        await logFieldChanges(prisma, 'Account', 1, null, { id: 1, name: 'New', balance: 0 });
        expect(prisma._rows).toHaveLength(1);
        expect(prisma._rows[0].action).toBe('CREATE');
        expect(prisma._rows[0].diff.after.name).toBe('New');
    });

    it('logs full snapshot on delete', async () => {
        const prisma = createMockPrisma();
        
        await logFieldChanges(prisma, 'Account', 1, { id: 1, name: 'Old' }, null);
        expect(prisma._rows).toHaveLength(1);
        expect(prisma._rows[0].action).toBe('DELETE');
    });

    it('captures userId/userEmail/ipAddress in context', async () => {
        const prisma = createMockPrisma();
        await logFieldChanges(
            prisma, 'Account', 1,
            { balance: 100 }, { balance: 200 },
            { userId: 7, userEmail: 'admin', ipAddress: '10.0.0.1' }
        );
        
        expect(prisma._rows[0].userId).toBe(7);
        expect(prisma._rows[0].ipAddress).toBe('10.0.0.1');
    });

    it('handles null oldValue/newValue serialization', async () => {
        const prisma = createMockPrisma();
        await logFieldChanges(
            prisma, 'Account', 1,
            { name: null, code: '1100' },
            { name: 'Cash', code: '1100' }
        );
        
        expect(prisma._rows[0].diff.name.before).toBeNull();
        expect(prisma._rows[0].diff.name.after).toBe('Cash');
    });

    it('treats Date objects as equal when same timestamp', async () => {
        const prisma = createMockPrisma();
        const d = new Date('2026-05-01T10:00:00Z');
        await logFieldChanges(
            prisma, 'JournalEntry', 1,
            { id: 1, entryDate: d },
            { id: 1, entryDate: new Date(d.getTime()) }
        );
        
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

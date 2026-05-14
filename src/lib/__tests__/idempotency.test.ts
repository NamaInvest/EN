import { withIdempotency } from '@/lib/idempotency';
import { NextRequest, NextResponse } from 'next/server';

const mPrisma = {
    idempotencyRecord: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
    }
};

jest.mock('@/lib/prisma', () => ({
    getTenantPrisma: jest.fn(() => mPrisma),
    resolveTenant: jest.fn(() => 'test_tenant'),
}));

describe('Financial Idempotency Utility', () => {
    let mockReq: any;
    let mockHandler: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        
        mockReq = {
            headers: {
                get: jest.fn((key) => key === 'Idempotency-Key' ? 'test-key-123' : null)
            },
            text: jest.fn().mockResolvedValue(JSON.stringify({ total: 100 })),
            json: jest.fn().mockResolvedValue({ total: 100 })
        };
        
        mockHandler = jest.fn().mockResolvedValue(NextResponse.json({ success: true, id: 1 }, { status: 200 }));
    });

    it('creates a new idempotency record if key is fresh and updates to COMPLETED', async () => {
        mPrisma.idempotencyRecord.create.mockResolvedValue({
            id: 1,
            tenantId: 'test_tenant',
            key: 'test-key-123',
            status: 'IN_PROGRESS'
        });

        const res = await withIdempotency(mockReq as unknown as NextRequest, 'POST /api/sales', mockHandler);
        
        expect(mPrisma.idempotencyRecord.create).toHaveBeenCalled();
        expect(mockHandler).toHaveBeenCalled();
        expect(mPrisma.idempotencyRecord.update).toHaveBeenCalledWith({
            where: { id: 1 },
            data: expect.objectContaining({ status: 'COMPLETED' })
        });
        
        expect(res.status).toBe(200);
    });

    it('returns 409 Conflict if record is IN_PROGRESS', async () => {
        const p2002Error: any = new Error('Unique constraint failed');
        p2002Error.code = 'P2002';
        mPrisma.idempotencyRecord.create.mockRejectedValue(p2002Error);
        mPrisma.idempotencyRecord.findUnique.mockResolvedValue({
            id: 1,
            status: 'IN_PROGRESS',
            requestHash: 'xyz'
        });

        const res = await withIdempotency(mockReq as unknown as NextRequest, 'POST /api/sales', mockHandler);
        
        expect(mockHandler).not.toHaveBeenCalled();
        expect(res.status).toBe(409);
        const body = await res.json();
        expect(body.message).toContain('IN_PROGRESS');
    });

    it('returns cached response if record is COMPLETED and hash matches', async () => {
        const p2002Error: any = new Error('Unique constraint failed');
        p2002Error.code = 'P2002';
        mPrisma.idempotencyRecord.create.mockRejectedValue(p2002Error);
        
        // requestHash calculated in withIdempotency for { total: 100 }
        const expectedHash = require('crypto').createHash('sha256').update('{"total":100}').digest('hex');

        mPrisma.idempotencyRecord.findUnique.mockResolvedValue({
            id: 1,
            status: 'COMPLETED',
            requestHash: expectedHash,
            responseCode: 201,
            responseBody: { success: true, cached: true }
        });

        const res = await withIdempotency(mockReq as unknown as NextRequest, 'POST /api/sales', mockHandler);
        
        expect(mockHandler).not.toHaveBeenCalled();
        expect(res.status).toBe(201);
        const body = await res.json();
        expect(body.cached).toBe(true);
    });

    it('returns 400 Bad Request if hash mismatches', async () => {
        const p2002Error: any = new Error('Unique constraint failed');
        p2002Error.code = 'P2002';
        mPrisma.idempotencyRecord.create.mockRejectedValue(p2002Error);

        mPrisma.idempotencyRecord.findUnique.mockResolvedValue({
            id: 1,
            status: 'COMPLETED',
            requestHash: 'different-hash',
            responseCode: 200,
            responseBody: {}
        });

        const res = await withIdempotency(mockReq as unknown as NextRequest, 'POST /api/sales', mockHandler);
        
        expect(mockHandler).not.toHaveBeenCalled();
        expect(res.status).toBe(400);
        const body = await res.json();
        expect(body.message).toContain('مختلفة');
    });
});

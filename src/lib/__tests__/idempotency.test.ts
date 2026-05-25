import { NextRequest, NextResponse } from 'next/server';
import { withIdempotency } from '@/lib/idempotency';
import { redisConnection } from '@/lib/queue';

jest.mock('@/lib/queue', () => ({
    redisConnection: {
        set: jest.fn(),
        del: jest.fn(),
    },
}));

jest.mock('@/lib/logger', () => ({
    logger: {
        child: jest.fn(() => ({
            error: jest.fn(),
            warn: jest.fn(),
            info: jest.fn(),
            debug: jest.fn(),
        })),
    },
}));

const mockedRedis = redisConnection as jest.Mocked<typeof redisConnection>;

describe('Financial Idempotency Utility', () => {
    let mockReq: NextRequest;
    let mockHandler: jest.Mock<Promise<NextResponse>>;

    beforeEach(() => {
        jest.clearAllMocks();

        mockReq = {
            headers: {
                get: jest.fn((key: string) => {
                    if (key === 'Idempotency-Key') return 'test-key-123';
                    if (key === 'x-tenant') return 'test_tenant';
                    return null;
                }),
            },
        } as unknown as NextRequest;

        mockHandler = jest.fn().mockResolvedValue(
            NextResponse.json({ success: true, id: 1 }, { status: 200 })
        );
    });

    it('locks a fresh key, runs the handler, and marks it completed', async () => {
        mockedRedis.set.mockResolvedValueOnce('OK').mockResolvedValueOnce('OK');

        const res = await withIdempotency(mockReq, 'POST /api/sales', mockHandler);

        expect(mockedRedis.set).toHaveBeenNthCalledWith(
            1,
            'idempotency:test_tenant:POST /api/sales:test-key-123',
            'PROCESSING',
            'EX',
            86400,
            'NX'
        );
        expect(mockHandler).toHaveBeenCalled();
        expect(mockedRedis.set).toHaveBeenNthCalledWith(
            2,
            'idempotency:test_tenant:POST /api/sales:test-key-123',
            'COMPLETED',
            'EX',
            86400
        );
        expect(res.status).toBe(200);
    });

    it('returns 409 Conflict if the Redis lock already exists', async () => {
        mockedRedis.set.mockResolvedValueOnce(null);

        const res = await withIdempotency(mockReq, 'POST /api/sales', mockHandler);

        expect(mockHandler).not.toHaveBeenCalled();
        expect(res.status).toBe(409);
        const body = await res.json();
        expect(body.message).toContain('Duplicate request');
    });

    it('unlocks the key when the handler returns a non-success response', async () => {
        mockedRedis.set.mockResolvedValueOnce('OK');
        mockedRedis.del.mockResolvedValueOnce(1);
        mockHandler.mockResolvedValueOnce(
            NextResponse.json({ success: false }, { status: 422 })
        );

        const res = await withIdempotency(mockReq, 'POST /api/sales', mockHandler);

        expect(mockedRedis.del).toHaveBeenCalledWith(
            'idempotency:test_tenant:POST /api/sales:test-key-123'
        );
        expect(res.status).toBe(422);
    });

    it('unlocks the key and rethrows when the handler fails', async () => {
        mockedRedis.set.mockResolvedValueOnce('OK');
        mockedRedis.del.mockResolvedValueOnce(1);
        mockHandler.mockRejectedValueOnce(new Error('handler failed'));

        await expect(withIdempotency(mockReq, 'POST /api/sales', mockHandler)).rejects.toThrow('handler failed');
        expect(mockedRedis.del).toHaveBeenCalledWith(
            'idempotency:test_tenant:POST /api/sales:test-key-123'
        );
    });
});

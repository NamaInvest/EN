import { systemReconciliationProcessor } from '../reconciliation.worker';
import { prisma, withTenant } from '@/lib/prisma';
import { runSystemReconciliation } from '@/lib/system-audit';
import { logAuditEvent } from '@/lib/audit-trail';
import { logger } from '@/lib/logger';

// Mock dependencies
jest.mock('@/lib/prisma', () => {
    const original = jest.requireActual('@/lib/prisma');
    return {
        ...original,
        withTenant: jest.fn(async (tenantId, fn) => fn()),
        prisma: {
            tenantAccount: {
                findMany: jest.fn(),
            },
        },
    };
});

jest.mock('@/lib/system-audit', () => ({
    runSystemReconciliation: jest.fn(),
}));

jest.mock('@/lib/audit-trail', () => ({
    logAuditEvent: jest.fn(),
}));

jest.mock('@/lib/logger', () => {
    const mockLogger: any = {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        child: jest.fn(() => mockLogger),
    };
    return { logger: mockLogger };
});

describe('System Reconciliation Worker - Safety Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should correctly filter active, non-trial, non-free, and non-test tenants', async () => {
        // Setup tenants list returned from Master DB
        const mockTenants = [
            { subdomain: 'n11', status: 'active', plan: 'enterprise', subscriptionStatus: 'active' }, // Production, Paid (Run)
            { subdomain: 'n12', status: 'active', plan: 'professional', subscriptionStatus: 'active' }, // Production, Paid (Run)
            { subdomain: 'test', status: 'active', plan: 'professional', subscriptionStatus: 'active' }, // Test Subdomain (Skip)
            { subdomain: 'demo', status: 'active', plan: 'enterprise', subscriptionStatus: 'active' }, // Demo Subdomain (Skip)
            { subdomain: 'n7', status: 'active', plan: 'free', subscriptionStatus: 'active' }, // Free Plan (Skip)
            { subdomain: 'n8', status: 'active', plan: 'professional', subscriptionStatus: 'trial' }, // Trial Status (Skip)
            { subdomain: 'n9', status: 'suspended', plan: 'enterprise', subscriptionStatus: 'active' }, // Suspended (Skip)
        ];

        (prisma.tenantAccount.findMany as jest.Mock).mockResolvedValue(mockTenants);
        (runSystemReconciliation as jest.Mock).mockResolvedValue({
            summary: { totalFindings: 0, critical: 0, high: 0, medium: 0, low: 0 },
            findings: [],
        });

        const mockJob = { id: 'test-job-1' } as any;

        const result = await systemReconciliationProcessor(mockJob);

        // Verify activeTenantsScanned count is exactly 2 (n11 and n12)
        expect(result.activeTenantsScanned).toBe(2);
        expect(result.findingsByTenant.length).toBe(0);

        // Verify withTenant was run for exactly 'n11' and 'n12' (plus 'n11' for fetching the list)
        expect(withTenant).toHaveBeenCalledWith('n11', expect.any(Function));
        expect(withTenant).toHaveBeenCalledWith('n12', expect.any(Function));
        
        // Excluded subdomains should NOT be executed
        expect(withTenant).not.toHaveBeenCalledWith('test', expect.any(Function));
        expect(withTenant).not.toHaveBeenCalledWith('demo', expect.any(Function));
        expect(withTenant).not.toHaveBeenCalledWith('n7', expect.any(Function));
        expect(withTenant).not.toHaveBeenCalledWith('n8', expect.any(Function));
        expect(withTenant).not.toHaveBeenCalledWith('n9', expect.any(Function));
    });

    it('should log warn on database schema drift / missing column errors and continue processing other tenants', async () => {
        // Setup tenants: 2 valid paying tenants (n11, n12)
        const mockTenants = [
            { subdomain: 'n11', status: 'active', plan: 'enterprise', subscriptionStatus: 'active' }, // Will fail with schema drift
            { subdomain: 'n12', status: 'active', plan: 'professional', subscriptionStatus: 'active' }, // Will succeed
        ];

        (prisma.tenantAccount.findMany as jest.Mock).mockResolvedValue(mockTenants);

        // First call throws a Schema Drift exception; second call succeeds
        (runSystemReconciliation as jest.Mock)
            .mockRejectedValueOnce(new Error('column "deleted_at" does not exist'))
            .mockResolvedValueOnce({
                summary: { totalFindings: 2, critical: 1, high: 1, medium: 0, low: 0 },
                findings: [{}, {}],
            });

        const mockJob = { id: 'test-job-2' } as any;

        const result = await systemReconciliationProcessor(mockJob);

        // Verify worker completes and aggregates stats
        expect(result.status).toBe('completed');
        expect(result.activeTenantsScanned).toBe(2); // Attempted 2
        expect(result.summary.totalFindings).toBe(2); // Only n12 findings are aggregated
        expect(result.findingsByTenant).toEqual([{ tenantId: 'n12', count: 2 }]);

        // Verify Schema Drift log warning was invoked
        expect(logger.warn).toHaveBeenCalledWith(
            { tenantId: 'n11' },
            expect.stringContaining('Skipped tenant due to schema drift / missing column: column "deleted_at" does not exist')
        );

        // Verify unexpected error logger.error was NOT invoked for the schema drift
        expect(logger.error).not.toHaveBeenCalled();

        // Verify logAuditEvent was run for n12 but NOT for n11
        expect(logAuditEvent).toHaveBeenCalledTimes(1);
        expect(logAuditEvent).toHaveBeenCalledWith(expect.any(Object), expect.objectContaining({ tenantId: 'n12' }));
    });
});

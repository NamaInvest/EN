import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { applyAuditMiddleware } from '../lib/prisma-audit';
import { runWithContext } from '../lib/observability/request-context';
import { Prisma } from '@prisma/client';

describe('Field-Level Audit Trail & Compliance Hardening (F-17)', () => {
    let mockPrisma: any;
    let registeredMiddleware: any;

    beforeEach(() => {
        registeredMiddleware = null;
        mockPrisma = {
            $use: jest.fn((mw: any) => {
                registeredMiddleware = mw;
            }),
            auditLog: {
                create: jest.fn(async () => ({ id: 'cuid-123' })),
            },
            Employee: {
                findFirst: jest.fn(),
            },
            Vendor: {
                findFirst: jest.fn(),
            },
            Asset: {
                findFirst: jest.fn(),
            },
            NonCriticalTable: {
                findFirst: jest.fn(),
            }
        };
    });

    describe('Middleware Registration', () => {
        it('should successfully register the audit middleware on the prisma client', () => {
            applyAuditMiddleware(mockPrisma);
            expect(mockPrisma.$use).toHaveBeenCalledTimes(1);
            expect(registeredMiddleware).toBeDefined();
        });
    });

    describe('Audit Diff Calculations & PDPL Masking', () => {
        it('should compute exact before/after field changes on UPDATE of critical tables', async () => {
            applyAuditMiddleware(mockPrisma);

            const beforeRecord = { id: 12, name: 'Ali', phone: '0551111111', role: 'Developer' };
            const afterRecord = { id: 12, name: 'Ali', phone: '0552222222', role: 'Senior Developer' };

            // Mock database lookups for Employee (a critical table)
            let findFirstCallCount = 0;
            mockPrisma.Employee.findFirst = jest.fn(async () => {
                findFirstCallCount++;
                if (findFirstCallCount === 1) return beforeRecord; // before state
                return afterRecord; // after state
            }) as any;

            const params = {
                model: 'Employee',
                action: 'update',
                args: {
                    where: { id: 12 },
                    data: { phone: '0552222222', role: 'Senior Developer' }
                }
            };

            const next = jest.fn(async () => afterRecord);

            const context = {
                requestId: 'req-abc',
                tenantId: 'tenant-42',
                actorId: '99',
                actorRole: 'ADMIN',
                module: 'hr'
            };

            await runWithContext(context, async () => {
                await registeredMiddleware(params, next);
            });

            expect(next).toHaveBeenCalledTimes(1);
            expect(mockPrisma.Employee.findFirst).toHaveBeenCalledTimes(2);

            // Verify AuditLog write payload
            expect(mockPrisma.auditLog.create).toHaveBeenCalledTimes(1);
            const callArgs = mockPrisma.auditLog.create.mock.calls[0][0];

            expect(callArgs.data.tenantId).toBe('tenant-42');
            expect(callArgs.data.userId).toBe(99);
            expect(callArgs.data.action).toBe('UPDATE');
            expect(callArgs.data.tableName).toBe('Employee');
            expect(callArgs.data.recordId).toBe('12');
            expect(callArgs.data.entityType).toBe('Employee');
            expect(callArgs.data.entityId).toBe('12');
            expect(callArgs.data.route).toBe('hr');
            expect(callArgs.data.oldData).toEqual(beforeRecord);
            expect(callArgs.data.newData).toEqual(afterRecord);

            // Diff must only contain changed fields
            expect(callArgs.data.diff).toEqual({
                phone: { before: '0551111111', after: '0552222222' },
                role: { before: 'Developer', after: 'Senior Developer' }
            });
        });

        it('should redact sensitive banking and PII fields under PDPL requirements', async () => {
            applyAuditMiddleware(mockPrisma);

            const beforeRecord = { id: 5, name: 'Vendor Inc.', iban: 'SA93800000000001', secret: 'old-api-key' };
            const afterRecord = { id: 5, name: 'Vendor Inc.', iban: 'SA93800000000002', secret: 'new-api-key' };

            let findFirstCallCount = 0;
            mockPrisma.Vendor.findFirst = jest.fn(async () => {
                findFirstCallCount++;
                if (findFirstCallCount === 1) return beforeRecord;
                return afterRecord;
            }) as any;

            const params = {
                model: 'Vendor',
                action: 'update',
                args: {
                    where: { id: 5 },
                    data: { iban: 'SA93800000000002', secret: 'new-api-key' }
                }
            };

            const next = jest.fn(async () => afterRecord);

            await runWithContext({ requestId: 'r1', tenantId: 'n11', actorId: '3' }, async () => {
                await registeredMiddleware(params, next);
            });

            expect(mockPrisma.auditLog.create).toHaveBeenCalledTimes(1);
            const callArgs = mockPrisma.auditLog.create.mock.calls[0][0];

            // iban and secret must be masked as '***'
            expect(callArgs.data.diff).toEqual({
                iban: { before: '***', after: '***' },
                secret: { before: '***', after: '***' }
            });
        });
    });

    describe('DELETE Operations & Immutability', () => {
        it('should capture whole oldData when a critical record is DELETED', async () => {
            applyAuditMiddleware(mockPrisma);

            const deletedRecord = { id: 88, name: 'Lease Contract A', cost: 120000 };
            mockPrisma.Asset.findFirst = jest.fn(async () => deletedRecord) as any;

            const params = {
                model: 'Asset',
                action: 'delete',
                args: { where: { id: 88 } }
            };

            const next = jest.fn(async () => null); // delete returns nothing

            await runWithContext({ requestId: 'r2', tenantId: 't1', actorId: '5' }, async () => {
                await registeredMiddleware(params, next);
            });

            expect(mockPrisma.auditLog.create).toHaveBeenCalledTimes(1);
            const callArgs = mockPrisma.auditLog.create.mock.calls[0][0];

            expect(callArgs.data.action).toBe('DELETE');
            expect(callArgs.data.tableName).toBe('Asset');
            expect(callArgs.data.recordId).toBe('88');
            expect(callArgs.data.oldData).toEqual(deletedRecord);
            expect(callArgs.data.newData).toEqual(Prisma.JsonNull);
            expect(callArgs.data.diff).toEqual({
                _deleted: { before: deletedRecord, after: null }
            });
        });
    });

    describe('Performance and Scope Selective Enforcement', () => {
        it('should bypass before/after lookups on non-critical tables to save database roundtrips', async () => {
            applyAuditMiddleware(mockPrisma);

            const params = {
                model: 'NonCriticalTable',
                action: 'update',
                args: {
                    where: { id: 100 },
                    data: { settingValue: 'dark-mode' }
                }
            };

            const next = jest.fn(async () => ({ id: 100, settingValue: 'dark-mode' }));

            await registeredMiddleware(params, next);

            // findFirst should NOT be called on non-critical tables
            expect(mockPrisma.NonCriticalTable.findFirst).not.toHaveBeenCalled();
            expect(mockPrisma.auditLog.create).toHaveBeenCalledTimes(1);

            const callArgs = mockPrisma.auditLog.create.mock.calls[0][0];
            expect(callArgs.data.tableName).toBe('NonCriticalTable');
            expect(callArgs.data.diff).toEqual({ settingValue: 'dark-mode' });
        });
    });
});

import { applyFieldPermissions } from '../../src/lib/field-permission';
import { PrismaClient } from '@prisma/client';

// Mock the PrismaClient
jest.mock('@prisma/client', () => {
    const mPrismaClient = {
        roleFieldPermission: {
            findMany: jest.fn().mockResolvedValue([
                { fieldName: 'amount', permission: 'HIDDEN' }
            ])
        }
    };
    return { PrismaClient: jest.fn(() => mPrismaClient) };
});

describe('Field Permissions Middleware', () => {
    let prisma: any;

    beforeEach(() => {
        prisma = new PrismaClient();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should strip HIDDEN fields from response for AR_CLERK', async () => {
        const mockEmployeeResponse = {
            id: 1,
            name: 'Ali',
            amount: 5000,
            department: 'Sales'
        };

        const filtered = await applyFieldPermissions('AR_CLERK', 'Salary', mockEmployeeResponse);

        expect(filtered.amount).toBeUndefined();
        expect(filtered.name).toBe('Ali');
        expect(filtered.id).toBe(1);
    });

    it('should NOT strip fields if role is admin', async () => {
        const mockEmployeeResponse = {
            id: 1,
            name: 'Ali',
            amount: 5000,
        };

        const filtered = await applyFieldPermissions('admin', 'Salary', mockEmployeeResponse);

        expect(filtered.amount).toBe(5000);
    });

    it('should handle arrays of objects correctly', async () => {
        const mockResponses = [
            { id: 1, amount: 5000, name: 'Ali' },
            { id: 2, amount: 6000, name: 'Sami' },
        ];

        const filtered = await applyFieldPermissions('AR_CLERK', 'Salary', mockResponses);

        expect(Array.isArray(filtered)).toBe(true);
        expect(filtered[0].amount).toBeUndefined();
        expect(filtered[1].amount).toBeUndefined();
        expect(filtered[0].name).toBe('Ali');
    });
});

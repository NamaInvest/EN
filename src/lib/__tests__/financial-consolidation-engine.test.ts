/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { FinancialConsolidationEngine } from '../financial-consolidation-engine';
import { Decimal } from '@prisma/client/runtime/library';

// Mock the global prisma client
const mockPrisma: any = {
  consolidationGroup: {
    findFirst: jest.fn(),
  },
  company: {
    findFirst: jest.fn(),
  },
  branch: {
    findMany: jest.fn(),
  },
  account: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
  journalLine: {
    groupBy: jest.fn(),
  },
};

describe('FinancialConsolidationEngine (F-13A) Unit Tests', () => {
  const tenantId = 'tenant-xyz';
  const groupId = 101;
  const fromDate = new Date('2026-05-01');
  const toDate = new Date('2026-05-31');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully consolidate a parent company and a FULL-consolidated subsidiary', async () => {
    // 1. Mock ConsolidationGroup and its members
    mockPrisma.consolidationGroup.findFirst.mockResolvedValue({
      id: groupId,
      tenantId,
      name: 'Nama Holding Group',
      parentCompanyId: 1, // Parent A
      baseCurrency: 'SAR',
      isActive: true,
      members: [
        {
          id: 'member-1',
          tenantId,
          groupId,
          entityId: '2', // Subsidiary B
          ownership: new Decimal(0.8), // 80%
          consolidationMethod: 'FULL',
          active: true,
        },
      ],
      eliminationRules: [],
    });

    // 2. Mock Companies
    mockPrisma.company.findFirst.mockImplementation(({ where }: any) => {
      if (where.id === 1) {
        return Promise.resolve({
          id: 1,
          tenantId,
          name: 'Parent Company A',
        });
      }
      if (where.id === 2) {
        return Promise.resolve({
          id: 2,
          tenantId,
          name: 'Subsidiary Company B',
        });
      }
      return Promise.resolve(null);
    });

    // 3. Mock Branches
    mockPrisma.branch.findMany.mockImplementation(({ where }: any) => {
      if (where.companyId === 1) {
        return Promise.resolve([{ id: 11, companyId: 1, name: 'Parent Branch Main' }]);
      }
      if (where.companyId === 2) {
        return Promise.resolve([{ id: 22, companyId: 2, name: 'Sub Branch Riyadh' }]);
      }
      return Promise.resolve([]);
    });

    // 4. Mock Accounts
    mockPrisma.account.findMany.mockResolvedValue([
      { id: 10, code: '1110', name: 'Cash and Banks', type: 'asset', parentId: null },
      { id: 20, code: '4100', name: 'Sales Revenue', type: 'revenue', parentId: null },
    ]);

    // 5. Mock JournalLine balance queries (grouped by accountId)
    mockPrisma.journalLine.groupBy.mockImplementation(({ where }: any) => {
      const branchFilter = where.entry.branchId;
      
      if (branchFilter && branchFilter.in && branchFilter.in.includes(11)) {
        // Parent A balances
        return Promise.resolve([
          { accountId: 10, _sum: { debit: 5000, credit: 0 } }, // Cash +5000 (debit nature)
          { accountId: 20, _sum: { debit: 0, credit: 5000 } }, // Revenue +5000 (credit nature)
        ]);
      }
      if (branchFilter && branchFilter.in && branchFilter.in.includes(22)) {
        // Subsidiary B balances
        return Promise.resolve([
          { accountId: 10, _sum: { debit: 2000, credit: 0 } }, // Cash +2000
          { accountId: 20, _sum: { debit: 0, credit: 2000 } }, // Revenue +2000
        ]);
      }
      return Promise.resolve([]);
    });

    const engine = new FinancialConsolidationEngine(mockPrisma as any);
    const result = await engine.consolidate(tenantId, groupId, fromDate, toDate);

    expect(result).toBeDefined();
    expect(result.groupId).toBe(groupId);
    expect(result.groupName).toBe('Nama Holding Group');
    expect(result.companies).toHaveLength(2);
    expect(result.isBalanced).toBe(true);

    // Verify correct full rollup balances
    const cashRow = result.rows.find((r) => r.accountCode === '1110');
    expect(cashRow).toBeDefined();
    expect(cashRow?.balances[1].toNumber()).toBe(5000); // Parent balance
    expect(cashRow?.balances[2].toNumber()).toBe(2000); // FULL rolls up 100% of subsidiary B (2000)
    expect(cashRow?.consolidatedNet.toNumber()).toBe(7000); // 5000 + 2000 = 7000

    const revRow = result.rows.find((r) => r.accountCode === '4100');
    expect(revRow).toBeDefined();
    expect(revRow?.balances[1].toNumber()).toBe(5000);
    expect(revRow?.balances[2].toNumber()).toBe(2000);
    expect(revRow?.consolidatedNet.toNumber()).toBe(7000);
  });

  it('should successfully apply PROPORTIONAL consolidation method and scale balances', async () => {
    // 1. Mock ConsolidationGroup and its members
    mockPrisma.consolidationGroup.findFirst.mockResolvedValue({
      id: groupId,
      tenantId,
      name: 'Nama Holding Group',
      parentCompanyId: 1, // Parent A
      baseCurrency: 'SAR',
      isActive: true,
      members: [
        {
          id: 'member-2',
          tenantId,
          groupId,
          entityId: '3', // Subsidiary C (JV)
          ownership: new Decimal(0.5), // 50% joint venture
          consolidationMethod: 'PROPORTIONAL',
          active: true,
        },
      ],
      eliminationRules: [],
    });

    // 2. Mock Companies
    mockPrisma.company.findFirst.mockImplementation(({ where }: any) => {
      if (where.id === 1) {
        return Promise.resolve({ id: 1, tenantId, name: 'Parent Company A' });
      }
      if (where.id === 3) {
        return Promise.resolve({ id: 3, tenantId, name: 'JV Company C' });
      }
      return Promise.resolve(null);
    });

    // 3. Mock Branches
    mockPrisma.branch.findMany.mockImplementation(({ where }: any) => {
      if (where.companyId === 1) {
        return Promise.resolve([{ id: 11, companyId: 1, name: 'Parent Branch Main' }]);
      }
      if (where.companyId === 3) {
        return Promise.resolve([{ id: 33, companyId: 3, name: 'JV Branch Dammam' }]);
      }
      return Promise.resolve([]);
    });

    // 4. Mock Accounts
    mockPrisma.account.findMany.mockResolvedValue([
      { id: 10, code: '1110', name: 'Cash and Banks', type: 'asset', parentId: null },
    ]);

    // 5. Mock JournalLine balances
    mockPrisma.journalLine.groupBy.mockImplementation(({ where }: any) => {
      const branchFilter = where.entry.branchId;
      if (branchFilter && branchFilter.in && branchFilter.in.includes(11)) {
        return Promise.resolve([{ accountId: 10, _sum: { debit: 10000, credit: 0 } }]);
      }
      if (branchFilter && branchFilter.in && branchFilter.in.includes(33)) {
        return Promise.resolve([{ accountId: 10, _sum: { debit: 4000, credit: 0 } }]);
      }
      return Promise.resolve([]);
    });

    const engine = new FinancialConsolidationEngine(mockPrisma as any);
    const result = await engine.consolidate(tenantId, groupId, fromDate, toDate);

    // Verify proportional rollup balances (50% of JV Company C = 2000)
    const cashRow = result.rows.find((r) => r.accountCode === '1110');
    expect(cashRow).toBeDefined();
    expect(cashRow?.balances[1].toNumber()).toBe(10000); // Parent
    expect(cashRow?.balances[3].toNumber()).toBe(2000); // PROPORTIONAL JV C (4000 * 50% = 2000)
    expect(cashRow?.consolidatedNet.toNumber()).toBe(12000); // 10000 + 2000 = 12000
  });

  it('should successfully eliminate intercompany AR/AP balances', async () => {
    // 1. Mock ConsolidationGroup and members with an elimination rule
    mockPrisma.consolidationGroup.findFirst.mockResolvedValue({
      id: groupId,
      tenantId,
      name: 'Nama Holding Group',
      parentCompanyId: 1, // Parent A
      baseCurrency: 'SAR',
      isActive: true,
      members: [
        {
          id: 'member-1',
          tenantId,
          groupId,
          entityId: '2', // Subsidiary B
          ownership: new Decimal(1.0),
          consolidationMethod: 'FULL',
          active: true,
        },
      ],
      eliminationRules: [
        {
          id: 'rule-ar-ap',
          tenantId,
          groupId,
          ruleName: 'Eliminate AR/AP matches',
          ruleType: 'INTERCOMPANY_AR_AP',
          sourceAccount: '1210', // Intercompany Receivables
          targetAccount: '2110', // Intercompany Payables
          active: true,
        },
      ],
    });

    // 2. Mock Companies
    mockPrisma.company.findFirst.mockImplementation(({ where }: any) => {
      if (where.id === 1) return Promise.resolve({ id: 1, tenantId, name: 'Parent Company A' });
      if (where.id === 2) return Promise.resolve({ id: 2, tenantId, name: 'Subsidiary Company B' });
      return Promise.resolve(null);
    });

    // 3. Mock Branches
    mockPrisma.branch.findMany.mockImplementation(({ where }: any) => {
      if (where.companyId === 1) return Promise.resolve([{ id: 11, companyId: 1, name: 'Parent Branch' }]);
      if (where.companyId === 2) return Promise.resolve([{ id: 22, companyId: 2, name: 'Sub Branch' }]);
      return Promise.resolve([]);
    });

    // 4. Mock Accounts
    mockPrisma.account.findMany.mockResolvedValue([
      { id: 11, code: '1210', name: 'Intercompany Receivables', type: 'asset', parentId: null },
      { id: 22, code: '2110', name: 'Intercompany Payables', type: 'liability', parentId: null },
    ]);

    // 5. Mock JournalLine balances showing intercompany matching transactions
    mockPrisma.journalLine.groupBy.mockImplementation(({ where }: any) => {
      const branchFilter = where.entry.branchId;
      if (branchFilter && branchFilter.in && branchFilter.in.includes(11)) {
        // Parent A has 1500 SAR in Receivables (Debit nature)
        return Promise.resolve([
          { accountId: 11, _sum: { debit: 1500, credit: 0 } },
        ]);
      }
      if (branchFilter && branchFilter.in && branchFilter.in.includes(22)) {
        // Subsidiary B has 1500 SAR in Payables (Credit nature)
        return Promise.resolve([
          { accountId: 22, _sum: { debit: 0, credit: 1500 } },
        ]);
      }
      return Promise.resolve([]);
    });

    const engine = new FinancialConsolidationEngine(mockPrisma as any);
    const result = await engine.consolidate(tenantId, groupId, fromDate, toDate);

    // Verify intercompany elimination results in 0 consolidated net balances
    const arRow = result.rows.find((r) => r.accountCode === '1210');
    expect(arRow).toBeDefined();
    expect(arRow?.balances[1].toNumber()).toBe(1500); // Parent
    expect(arRow?.eliminationCredit.toNumber()).toBe(1500); // Credited by 1500 to bring to 0
    expect(arRow?.consolidatedNet.toNumber()).toBe(0); // Successfully eliminated!

    const apRow = result.rows.find((r) => r.accountCode === '2110');
    expect(apRow).toBeDefined();
    expect(apRow?.balances[2].toNumber()).toBe(1500); // Sub B
    expect(apRow?.eliminationDebit.toNumber()).toBe(1500); // Debited by 1500 to bring to 0
    expect(apRow?.consolidatedNet.toNumber()).toBe(0); // Successfully eliminated!
  });
});

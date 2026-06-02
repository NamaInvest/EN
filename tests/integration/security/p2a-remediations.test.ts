import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BOMEngine } from '@/lib/bom-engine';

// Mock getPrisma to mock database responses for BOM
vi.mock('@/lib/prisma', async (importOriginal) => {
  const actual: any = await importOriginal();
  const mockClient = {
    recipeIngredient: {
      findMany: vi.fn().mockImplementation(({ where }) => {
        if (where.recipeId === 1) {
          // Ingredients at depth 0
          return Promise.resolve([
            { id: 101, recipeId: 1, rawProductId: 10, quantity: 2, estimatedCost: 15, rawProduct: { id: 10, name: 'Sugar', barcode: '123' } },
            { id: 102, recipeId: 1, rawProductId: 11, quantity: 1, estimatedCost: 20, rawProduct: { id: 11, name: 'Water', barcode: '456' } },
          ]);
        }
        if (where.recipeId === 2) {
          // Ingredients at depth 1 for Sugar sub-recipe
          return Promise.resolve([
            { id: 103, recipeId: 2, rawProductId: 20, quantity: 5, estimatedCost: 2, rawProduct: { id: 20, name: 'Sugar Cane', barcode: '789' } },
          ]);
        }
        return Promise.resolve([]);
      }),
    },
    recipe: {
      findMany: vi.fn().mockImplementation(({ where }) => {
        const finishedIds = where.finishedProductId.in;
        const list = [];
        if (finishedIds.includes(10)) {
          // Sugar finished product ID 10 resolves to Recipe ID 2
          list.push({ id: 2, finishedProductId: 10, name: 'Sugar Recipe', totalCost: 10 });
        }
        return Promise.resolve(list);
      }),
    },
  };
  return {
    ...actual,
    getPrisma: vi.fn().mockImplementation(() => mockClient),
    default: mockClient,
    prisma: mockClient,
  };
});

describe('P2-A Audit Remediation Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── ISS-04: BOM N+1 Optimization Traversal ──────────────────────────────────
  describe('ISS-04: BOM N+1 Optimization Traversal', () => {
    it('successfully explodes a recursive BOM tree and resolves child sub-recipes', async () => {
      const result = await BOMEngine.explode(1, 0, 5);
      
      expect(result).toBeDefined();
      expect(result.length).toBe(2);
      
      // Sugar item at depth 0
      const sugarItem: any = result.find((r: any) => r.rawProductId === 10);
      expect(sugarItem).toBeDefined();
      expect(sugarItem.name).toBe('Sugar');
      expect(sugarItem.depth).toBe(0);
      expect(sugarItem.quantity).toBe(2);
      expect(sugarItem.estimatedCost).toBe(15);
      
      // Check resolved nested sub-recipes at depth 1
      expect(sugarItem.children).toBeDefined();
      expect(sugarItem.children.length).toBe(1);
      expect(sugarItem.children[0].name).toBe('Sugar Cane');
      expect(sugarItem.children[0].depth).toBe(1);
      expect(sugarItem.children[0].quantity).toBe(5);
      expect(sugarItem.children[0].estimatedCost).toBe(2);
      
      // Water item at depth 0 (should have no children)
      const waterItem: any = result.find((r: any) => r.rawProductId === 11);
      expect(waterItem).toBeDefined();
      expect(waterItem.name).toBe('Water');
      expect(waterItem.children.length).toBe(0);
    });
  });
});

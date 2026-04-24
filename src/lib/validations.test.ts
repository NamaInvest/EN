import { 
  treasuryCreateSchema, 
  expenseCreateSchema, 
  purchaseCreateSchema, 
  salaryCreateSchema,
  amountSchema
} from './validations';

describe('Zod Validations Tests', () => {
  describe('amountSchema', () => {
    it('should validate positive numbers', () => {
      expect(amountSchema.parse(10)).toBe(10);
      expect(amountSchema.parse('15.5')).toBe(15.5);
    });

    it('should reject zero or negative numbers', () => {
      expect(() => amountSchema.parse(0)).toThrow();
      expect(() => amountSchema.parse(-5)).toThrow();
    });
  });

  describe('treasuryCreateSchema', () => {
    it('should validate correct treasury data', () => {
      const validData = {
        type: 'in',
        amount: 1000,
        description: 'إيداع نقدي',
      };
      const result = treasuryCreateSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid type', () => {
      const invalidData = {
        type: 'unknown',
        amount: 100,
      };
      const result = treasuryCreateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('expenseCreateSchema', () => {
    it('should validate correct expense data', () => {
      const validData = {
        category: 'صيانة',
        description: 'صيانة مكيفات',
        amount: 500,
      };
      const result = expenseCreateSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject empty category or description', () => {
      const result1 = expenseCreateSchema.safeParse({ category: '', description: 'test', amount: 10 });
      const result2 = expenseCreateSchema.safeParse({ category: 'cat', description: '', amount: 10 });
      expect(result1.success).toBe(false);
      expect(result2.success).toBe(false);
    });
  });

  describe('purchaseCreateSchema', () => {
    it('should validate purchase with items', () => {
      const validData = {
        supplierId: 1,
        paymentType: 'cash',
        items: [
          { productId: 101, quantity: 5, price: 10 }
        ]
      };
      const result = purchaseCreateSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should strip unknown fields', () => {
      const dataWithUnknown = {
        supplierId: 1,
        paymentType: 'cash',
        items: [],
        hackerField: 'drop database'
      };
      const result = purchaseCreateSchema.safeParse(dataWithUnknown);
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as any).hackerField).toBeUndefined();
      }
    });
  });

  describe('salaryCreateSchema', () => {
    it('should validate correct salary data', () => {
      const validData = {
        employeeId: 5,
        month: 12,
        year: 2024,
        basicSalary: 5000,
      };
      const result = salaryCreateSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid month', () => {
      const invalidData = {
        employeeId: 5,
        month: 13,
        year: 2024,
        basicSalary: 5000,
      };
      const result = salaryCreateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});

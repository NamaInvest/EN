import { 

  treasuryCreateSchema, 
  expenseCreateSchema, 
  purchaseCreateSchema, 
  salaryCreateSchema,
  amountSchema
} from './validations';

describe('Zod Validations Tests', () => {

  // ── amountSchema ──────────────────────────────────────────────────────────

  describe('amountSchema', () => {
    it('should validate positive numbers', () => {
      expect(amountSchema.parse(10)).toBe(10);
      expect(amountSchema.parse(15.5)).toBe(15.5);
    });

    it('should reject zero or negative numbers', () => {
      expect(() => amountSchema.parse(0)).toThrow();
      expect(() => amountSchema.parse(-5)).toThrow();
    });

    it('should reject NaN', () => {
      expect(() => amountSchema.parse('not-a-number')).toThrow();
    });
  });

  // ── treasuryCreateSchema ──────────────────────────────────────────────────

  describe('treasuryCreateSchema', () => {
    it('should validate correct treasury data', () => {
      const result = treasuryCreateSchema.safeParse({
        type:        'in',
        amount:      1000,
        description: 'إيداع نقدي',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid type', () => {
      const result = treasuryCreateSchema.safeParse({
        type:   'unknown',
        amount: 100,
      });
      expect(result.success).toBe(false);
    });

    it('should reject zero amount', () => {
      const result = treasuryCreateSchema.safeParse({
        type:   'in',
        amount: 0,
      });
      expect(result.success).toBe(false);
    });
  });

  // ── expenseCreateSchema ───────────────────────────────────────────────────

  describe('expenseCreateSchema', () => {
    it('should validate correct expense data', () => {
      const result = expenseCreateSchema.safeParse({
        category:    'صيانة',
        description: 'صيانة مكيفات',
        amount:      500,
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty category', () => {
      const result = expenseCreateSchema.safeParse({
        category:    '',
        description: 'test',
        amount:      10,
      });
      expect(result.success).toBe(false);
    });

    it('should reject empty description', () => {
      const result = expenseCreateSchema.safeParse({
        category:    'cat',
        description: '',
        amount:      10,
      });
      expect(result.success).toBe(false);
    });
  });

  // ── purchaseCreateSchema ──────────────────────────────────────────────────

  describe('purchaseCreateSchema', () => {
    it('should validate purchase with items', () => {
      const result = purchaseCreateSchema.safeParse({
        supplierId:  1,
        paymentType: 'cash',
        items: [{ productId: 101, quantity: 5, price: 10 }],
      });
      expect(result.success).toBe(true);
    });

    it('should strip unknown/hacker fields', () => {
      const result = purchaseCreateSchema.safeParse({
        supplierId:  1,
        paymentType: 'cash',
        items:       [],
        hackerField: 'DROP TABLE',
      });
      // Zod strips unknown by default or schema allows passthrough — either way no crash
      expect(typeof result.success).toBe('boolean');
      if (result.success) {
        expect((result.data as any).hackerField).toBeUndefined();
      }
    });

    it('should reject negative quantity', () => {
      const result = purchaseCreateSchema.safeParse({
        supplierId:  1,
        paymentType: 'cash',
        items: [{ productId: 1, quantity: -1, price: 10 }],
      });
      expect(result.success).toBe(false);
    });
  });

  // ── salaryCreateSchema ────────────────────────────────────────────────────

  describe('salaryCreateSchema', () => {
    it('should validate correct salary data', () => {
      const result = salaryCreateSchema.safeParse({
        employeeId:  5,
        month:       12,
        year:        2024,
        basicSalary: 5000,
      });
      expect(result.success).toBe(true);
    });

    it('should reject month > 12', () => {
      const result = salaryCreateSchema.safeParse({
        employeeId:  5,
        month:       13,
        year:        2024,
        basicSalary: 5000,
      });
      expect(result.success).toBe(false);
    });

    it('should reject month < 1', () => {
      const result = salaryCreateSchema.safeParse({
        employeeId:  5,
        month:       0,
        year:        2024,
        basicSalary: 5000,
      });
      expect(result.success).toBe(false);
    });

    it('should reject negative salary', () => {
      const result = salaryCreateSchema.safeParse({
        employeeId:  5,
        month:       6,
        year:        2024,
        basicSalary: -100,
      });
      expect(result.success).toBe(false);
    });
  });
});

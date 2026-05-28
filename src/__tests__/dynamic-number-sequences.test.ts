import { describe, it, expect, jest } from '@jest/globals';
import { getNextNumber, peekNextNumber } from '../lib/numbering';
import { format } from 'date-fns';

describe('Dynamic Number Sequences (F-15)', () => {
  describe('getNextNumber formatting and substitutions', () => {
    it('should substitute date tokens correctly in prefix and suffix', async () => {
      // Mock numbering_sequences DB response
      const mockSequence = {
        id: 1,
        code: 'INV',
        prefix: 'INV-{YYYY}-{MM}-',
        suffix: '-{DD}',
        pad_length: 5,
        current: '10',
        reset_frequency: 'never',
        last_reset: null,
      };

      const mockTx: any = {
        $queryRawUnsafe: async () => [mockSequence],
        $executeRawUnsafe: jest.fn(async () => 1) as any,
      };

      const result = await getNextNumber(mockTx, 'INV');

      // 10 + 1 = 11. Padded to 5 chars is '00011'
      // YYYY = 2026, MM = 05, DD = 28 (based on current time)
      const now = new Date();
      const expectedPrefix = `INV-${format(now, 'yyyy')}-${format(now, 'MM')}-`;
      const expectedSuffix = `-${format(now, 'dd')}`;
      expect(result.formatted).toBe(`${expectedPrefix}00011${expectedSuffix}`);
      expect(result.current).toBe(11);

      // Verify that database was updated with the new current value (11)
      expect(mockTx.$executeRawUnsafe).toHaveBeenCalledWith(
        expect.any(String),
        BigInt(11),
        expect.any(Date),
        1
      );
    });

    it('should reset sequence correctly on monthly frequency', async () => {
      const lastResetDate = new Date();
      // Set last reset date to last month
      lastResetDate.setMonth(lastResetDate.getMonth() - 1);

      const mockSequence = {
        id: 2,
        code: 'JE',
        prefix: 'JE-{YY}-',
        suffix: '',
        pad_length: 4,
        current: '250',
        reset_frequency: 'monthly',
        last_reset: lastResetDate,
      };

      const mockTx: any = {
        $queryRawUnsafe: async () => [mockSequence],
        $executeRawUnsafe: async () => 1,
      };

      const result = await getNextNumber(mockTx, 'JE');

      // Reset frequency is monthly, and now is a different month.
      // So current should reset to 1
      expect(result.current).toBe(1);
      const now = new Date();
      expect(result.formatted).toBe(`JE-${format(now, 'yy')}-0001`);
    });
  });

  describe('Fallback logic', () => {
    it('should fallback to global sequence if branch sequence not found', async () => {
      const mockGlobalSequence = {
        id: 100,
        code: 'PI',
        prefix: 'PI-',
        suffix: '',
        pad_length: 6,
        current: '5',
        reset_frequency: 'never',
        last_reset: null,
      };

      let callCount = 0;
      const mockTx: any = {
        $queryRawUnsafe: async () => {
          callCount++;
          if (callCount === 1) return [];
          return [mockGlobalSequence];
        },
        $executeRawUnsafe: async () => 1,
      };

      const result = await getNextNumber(mockTx, 'PI', 3); // branchId = 3

      expect(result.current).toBe(6);
      expect(result.formatted).toBe('PI-000006');
    });

    it('should throw an error if neither branch nor global sequence exist', async () => {
      const mockTx: any = {
        $queryRawUnsafe: async () => [],
      };

      await expect(getNextNumber(mockTx, 'XYZ')).rejects.toThrow(
        'Numbering sequence not found for code XYZ'
      );
    });
  });

  describe('peekNextNumber functionality', () => {
    it('should peek the next formatted sequence number without incrementing or updating DB', async () => {
      const mockSequence = {
        id: 42,
        code: 'WO',
        prefix: 'WO-',
        suffix: '',
        pad_length: 5,
        current: '99',
      };

      const mockTx: any = {
        $queryRawUnsafe: async () => [mockSequence],
        $executeRawUnsafe: jest.fn() as any,
      };

      const nextFormatted = await peekNextNumber(mockTx, 'WO');

      expect(nextFormatted).toBe('WO-00100');
      // Verify DB was NOT updated
      expect(mockTx.$executeRawUnsafe).not.toHaveBeenCalled();
    });
  });

  describe('Concurrency & Thread safety simulation', () => {
    it('should guarantee sequential unique values when called consecutively inside locked transactions', async () => {
      let currentVal = BigInt(100);
      
      // Simulate consecutive atomic database locks
      const mockSequence = {
        id: 5,
        code: 'INV',
        prefix: 'INV-',
        pad_length: 6,
        reset_frequency: 'never',
      };

      const mockTx: any = {
        $queryRawUnsafe: async () => {
          return [{
            ...mockSequence,
            current: currentVal.toString(),
          }];
        },
        $executeRawUnsafe: async (sql: any, current: any) => {
          currentVal = BigInt(current);
          return 1;
        },
      };

      // Fire 3 consecutive sequence acquisitions
      const res1 = await getNextNumber(mockTx, 'INV');
      const res2 = await getNextNumber(mockTx, 'INV');
      const res3 = await getNextNumber(mockTx, 'INV');

      expect(res1.current).toBe(101);
      expect(res2.current).toBe(102);
      expect(res3.current).toBe(103);

      expect(res1.formatted).toBe('INV-000101');
      expect(res2.formatted).toBe('INV-000102');
      expect(res3.formatted).toBe('INV-000103');
    });
  });
});

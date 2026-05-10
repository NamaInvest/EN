import { logger } from '@/lib/logger';

const log = logger.child({ service: 'money' });

/**
 * Money utility — Saudi Riyal precision (halala = 2 decimals)
 * Use this for ALL financial calculations to prevent floating point errors
 */
export const round2 = (n: number): number => Math.round(n * 100) / 100;

/**
 * Validate a monetary amount — prevents NaN, Infinity, negative, and absurdly large values
 * @param value - The value to validate
 * @param fieldName - Human-readable field name for error messages
 * @param options - { allowNegative?: boolean, maxValue?: number }
 * @returns The validated number, or throws an Error
 */
export function validateMoney(
    value: unknown,
    fieldName: string = 'المبلغ',
    options: { allowNegative?: boolean; maxValue?: number } = {}
): number {
    const { allowNegative = false, maxValue = 999_999_999_999 } = options;
    const num = Number(value);

    if (isNaN(num) || !isFinite(num)) {
        throw new Error(`${fieldName} غير صالح`);
    }
    if (!allowNegative && num < 0) {
        throw new Error(`${fieldName} لا يمكن أن يكون سالباً`);
    }
    if (num > maxValue) {
        throw new Error(`${fieldName} تجاوز الحد الأقصى (${maxValue.toLocaleString()})`);
    }
    return round2(num);
}

import { logger } from '@/lib/logger';

const log = logger.child({ module: 'tax-validation' });

/**
 * Validates a given tax rate against allowed rates configured in system settings.
 * Normalizes decimal rates (e.g. 0.15) to percentage rates (e.g. 15).
 * 
 * @param taxRate The tax rate to validate (either decimal like 0.15 or percentage like 15).
 * @param tenantId The current tenant ID context.
 * @param prisma The Prisma client instance (or transactional client).
 * @returns An object containing validation status, normalized rate, and allowed rates list.
 */
export async function validateTaxRate(
  taxRate: number,
  tenantId: string,
  prisma: any
): Promise<{ valid: boolean; normalizedRate: number; allowedRates: number[]; error?: string }> {
  if (taxRate === undefined || taxRate === null || isNaN(taxRate)) {
    return {
      valid: false,
      normalizedRate: 0,
      allowedRates: [0, 15],
      error: 'نسبة الضريبة غير محددة أو غير صالحة.'
    };
  }

  // Normalize rate: if <= 1 (e.g. 0.15) and > 0, convert to percentage percentage (15)
  // We round to 4 decimal places to prevent floating point inaccuracies (e.g. 0.15000000000000002)
  let normalizedRate = taxRate;
  if (taxRate > 0 && taxRate <= 1) {
    normalizedRate = taxRate * 100;
  }
  normalizedRate = Math.round(normalizedRate * 10000) / 10000;

  // Retrieve allowed tax rates setting for this tenant
  let allowedRates: number[] = [0, 15]; // Default allowed rates (0% and 15% standard KSA rate)
  try {
    const setting = await prisma.setting.findFirst({
      where: { key: 'ALLOWED_TAX_RATES', tenantId }
    });

    if (setting && setting.value) {
      const parsedRates = setting.value
        .split(',')
        .map((r: string) => parseFloat(r.trim()))
        .filter((r: number) => !isNaN(r));
      
      if (parsedRates.length > 0) {
        allowedRates = parsedRates;
      }
    }
  } catch (err: any) {
    log.error('Error fetching ALLOWED_TAX_RATES setting', { err: err?.message, tenantId });
    // Fall back to default KSA rates [0, 15] on database lookup errors
  }

  // Verify if normalized rate is present in the white-list
  const isValid = allowedRates.some(rate => Math.abs(rate - normalizedRate) < 0.0001);

  if (!isValid) {
    const ratesString = allowedRates.map(r => `${r}%`).join(', ');
    return {
      valid: false,
      normalizedRate,
      allowedRates,
      error: `نسبة الضريبة المرسلة (${normalizedRate}%) غير معتمدة في إعدادات النظام المالي. النسب المسموح بها للمستأجر هي: ${ratesString}`
    };
  }

  return {
    valid: true,
    normalizedRate,
    allowedRates
  };
}

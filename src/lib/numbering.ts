import { PrismaClient } from '@prisma/client';
import { format } from 'date-fns';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'D:.namasoft9-3-main.src.lib.numbering.ts' });

export async function getNextNumber(
  tx: any, 
  code: string, 
  branchId?: number | null, 
  fiscalYear?: number | null, 
  fiscalMonth?: number | null
): Promise<{ formatted: string; current: number }> {
  // Safe handling of nullable columns for the SELECT FOR UPDATE
  const branchQuery = branchId ? `= ${branchId}` : 'IS NULL';
  const yearQuery = fiscalYear ? `= ${fiscalYear}` : 'IS NULL';
  const monthQuery = fiscalMonth ? `= ${fiscalMonth}` : 'IS NULL';

  let sequences = (await tx.$queryRawUnsafe(
    `SELECT * FROM "numbering_sequences" 
     WHERE "code" = $1 
       AND "branch_id" ${branchQuery}
       AND "fiscal_year" ${yearQuery}
       AND "fiscal_month" ${monthQuery}
     FOR UPDATE`,
    code
  )) as any[];

  if (!sequences || sequences.length === 0) {
    // Fallback to global sequence if specific one is not found
    sequences = (await tx.$queryRawUnsafe(
      `SELECT * FROM "numbering_sequences" 
       WHERE "code" = $1 AND "branch_id" IS NULL AND "fiscal_year" IS NULL AND "fiscal_month" IS NULL 
       FOR UPDATE`,
      code
    )) as any[];
    if (!sequences || sequences.length === 0) {
      throw new Error(`Numbering sequence not found for code ${code}`);
    }
  }

  const sequence = sequences[0];
  const now = new Date();
  
  // current is BigInt in DB, which may come back as a string or BigInt
  let current = BigInt(sequence.current);
  const lastReset = sequence.last_reset ? new Date(sequence.last_reset) : null;
  let shouldReset = false;

  if (lastReset) {
    if (sequence.reset_frequency === 'yearly' && now.getFullYear() !== lastReset.getFullYear()) {
      shouldReset = true;
    } else if (
      sequence.reset_frequency === 'monthly' &&
      (now.getFullYear() !== lastReset.getFullYear() || now.getMonth() !== lastReset.getMonth())
    ) {
      shouldReset = true;
    }
  }

  if (shouldReset) {
    current = BigInt(1);
  } else {
    current += BigInt(1);
  }

  // Formatting logic
  let prefix = sequence.prefix || '';
  let suffix = sequence.suffix || '';
  const padLength = sequence.pad_length || 6;
  
  // Replace dynamic tags if any
  prefix = prefix.replace('{YYYY}', format(now, 'yyyy'))
                 .replace('{YY}', format(now, 'yy'))
                 .replace('{MM}', format(now, 'MM'))
                 .replace('{DD}', format(now, 'dd'));

  suffix = suffix.replace('{YYYY}', format(now, 'yyyy'))
                 .replace('{YY}', format(now, 'yy'))
                 .replace('{MM}', format(now, 'MM'))
                 .replace('{DD}', format(now, 'dd'));

  const paddedCurrent = current.toString().padStart(padLength, '0');
  const result = `${prefix}${paddedCurrent}${suffix}`;

  // Update the sequence record
  await tx.$executeRawUnsafe(
    `UPDATE "numbering_sequences" SET "current" = $1, "last_reset" = $2 WHERE "id" = $3`,
    current,
    shouldReset || !lastReset ? now : lastReset,
    sequence.id
  );

  return { formatted: result, current: Number(current) };
}

export const NUMBERING_DEFAULTS = [
    { code: 'INV', name: 'Invoice', prefix: 'INV-{YYYY}-', padLength: 6 },
    { code: 'PO', name: 'Purchase Order', prefix: 'PO-{YYYY}-', padLength: 6 },
    { code: 'JE', name: 'Journal Entry', prefix: 'JE-{YY}{MM}-', padLength: 5 },
    { code: 'WO', name: 'Work Order', prefix: 'WO-', padLength: 6 },
];

export async function peekNextNumber(
  tx: any,
  code: string,
  options?: { branchId?: number | null }
): Promise<string> {
  // Logic to peek the next number without incrementing it
  // We can do a simple read
  const branchQuery = options?.branchId ? `= ${options.branchId}` : 'IS NULL';
  
  let sequences = (await tx.$queryRawUnsafe(
    `SELECT * FROM "numbering_sequences" WHERE "code" = $1 AND "branch_id" ${branchQuery} LIMIT 1`,
    code
  )) as any[];

  if (!sequences || sequences.length === 0) {
    sequences = (await tx.$queryRawUnsafe(
      `SELECT * FROM "numbering_sequences" WHERE "code" = $1 AND "branch_id" IS NULL LIMIT 1`,
      code
    )) as any[];
    if (!sequences || sequences.length === 0) {
      return `${code}-000001`; // fallback peek
    }
  }

  const sequence = sequences[0];
  const nextVal = BigInt(sequence.current) + BigInt(1);
  const now = new Date();
  
  let prefix = sequence.prefix || '';
  let suffix = sequence.suffix || '';
  const padLength = sequence.pad_length || 6;
  
  prefix = prefix.replace('{YYYY}', format(now, 'yyyy'))
                 .replace('{YY}', format(now, 'yy'))
                 .replace('{MM}', format(now, 'MM'))
                 .replace('{DD}', format(now, 'dd'));

  const paddedCurrent = nextVal.toString().padStart(padLength, '0');
  return `${prefix}${paddedCurrent}${suffix}`;
}

export async function resetSequence(
  tx: any,
  code: string,
  branchId?: number | null,
  fiscalYear?: number | null,
  fiscalMonth?: number | null
): Promise<void> {
  const branchQuery = branchId ? `= ${branchId}` : 'IS NULL';
  const yearQuery = fiscalYear ? `= ${fiscalYear}` : 'IS NULL';
  const monthQuery = fiscalMonth ? `= ${fiscalMonth}` : 'IS NULL';
  
  await tx.$executeRawUnsafe(
    `UPDATE "numbering_sequences" SET "current" = 0, "last_reset" = $1 
     WHERE "code" = $2 AND "branch_id" ${branchQuery} AND "fiscal_year" ${yearQuery} AND "fiscal_month" ${monthQuery}`,
    new Date(),
    code
  );
}

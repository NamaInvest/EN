/**
 * Decimal Utilities — Safe Prisma.Decimal ↔ number conversions
 *
 * Prisma returns `Decimal` objects for fields defined as `Decimal` in the schema.
 * JavaScript arithmetic operators (+, -, *, /) don't work on Decimal objects.
 * This module provides type-safe helpers to convert Decimals to numbers.
 *
 * Reference: IMPROVEMENT_PLAN/10_DATA_STORAGE.md — Float → Decimal migration
 */

import { Prisma } from '@prisma/client';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'D:.namasoft9-3-main.src.lib.decimal-util' });

/**
 * Converts a Prisma Decimal (or null/undefined) to a JavaScript number.
 * Returns 0 for null/undefined values.
 *
 * @example
 *   const total = n(invoice.total); // Decimal → number
 *   const sum = n(agg._sum.amount); // Decimal | null → number
 */
export function n(value: Prisma.Decimal | number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseFloat(value) || 0;
  // Prisma.Decimal has a toNumber() method
  return (value as any).toNumber?.() ?? Number(value) ?? 0;
}

/**
 * Converts a JavaScript number to a Prisma Decimal for database writes.
 *
 * @example
 *   await prisma.invoice.create({
 *     data: { total: d(calculatedTotal) }
 *   });
 */
export function d(value: number | string | null | undefined): Prisma.Decimal {
  return new Prisma.Decimal(value ?? 0);
}

/**
 * Safely sum an array of Decimal/number values.
 *
 * @example
 *   const total = sumD(items.map(i => i.lineTotal));
 */
export function sumD(values: (Prisma.Decimal | number | null | undefined)[]): number {
  return values.reduce((acc: number, val) => acc + n(val), 0);
}

/**
 * Round a number to a specified number of decimal places.
 * Default is 2 decimal places (for currency).
 */
export function roundN(value: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

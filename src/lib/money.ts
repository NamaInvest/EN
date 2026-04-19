/**
 * Money utility — rounds to 2 decimal places (halala precision)
 * Use this for ALL financial calculations to prevent floating point errors
 */
export const round2 = (n: number): number => Math.round(n * 100) / 100;

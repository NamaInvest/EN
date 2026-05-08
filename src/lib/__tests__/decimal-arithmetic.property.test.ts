import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import { Decimal } from '@prisma/client/runtime/library';

describe('Decimal arithmetic properties', () => {
  it('addition is commutative', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 1e9, noNaN: true }),
        fc.float({ min: 0, max: 1e9, noNaN: true }),
        (a: number, b: number) => {
          const x = new Decimal(a).add(b);
          const y = new Decimal(b).add(a);
          return x.equals(y);
        }
      )
    );
  });

  it('multiplication distributes over addition', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 1000, noNaN: true }),
        fc.float({ min: 0, max: 1000, noNaN: true }),
        fc.float({ min: 0, max: 1000, noNaN: true }),
        (a: number, b: number, c: number) => {
          const x = new Decimal(a).mul(new Decimal(b).add(c));
          const y = new Decimal(a).mul(b).add(new Decimal(a).mul(c));
          return x.minus(y).abs().lte('0.0001');
        }
      )
    );
  });
});

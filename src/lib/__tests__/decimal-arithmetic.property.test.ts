/**
 * Property-based tests for Decimal arithmetic
 * Tests mathematical properties: commutativity, distributivity
 */
import { Decimal } from '@prisma/client/runtime/library';

// Simple property test helper (replaces fast-check for jest compatibility)
function forAll(count: number, gen: () => number[], test: (...args: number[]) => boolean): void {
  for (let i = 0; i < count; i++) {
    const args = gen();
    const result = test(...args);
    if (!result) {
      throw new Error(`Property violated with args: ${JSON.stringify(args)}`);
    }
  }
}

function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

describe('Decimal arithmetic properties', () => {
  it('addition is commutative: a+b === b+a', () => {
    forAll(50, () => [randomFloat(0, 1e6), randomFloat(0, 1e6)], (a, b) => {
      const x = new Decimal(a).add(b);
      const y = new Decimal(b).add(a);
      return x.equals(y);
    });
  });

  it('multiplication distributes over addition: a*(b+c) === a*b + a*c', () => {
    forAll(50, () => [randomFloat(0, 1000), randomFloat(0, 1000), randomFloat(0, 1000)], (a, b, c) => {
      const x = new Decimal(a).mul(new Decimal(b).add(c));
      const y = new Decimal(a).mul(b).add(new Decimal(a).mul(c));
      return x.minus(y).abs().lte('0.0001');
    });
  });

  it('additive identity: a + 0 === a', () => {
    forAll(30, () => [randomFloat(-1e6, 1e6)], (a) => {
      return new Decimal(a).add(0).equals(new Decimal(a));
    });
  });

  it('multiplicative identity: a * 1 === a', () => {
    forAll(30, () => [randomFloat(-1e6, 1e6)], (a) => {
      return new Decimal(a).mul(1).equals(new Decimal(a));
    });
  });

  it('round2 is idempotent: round2(round2(x)) === round2(x)', () => {
    const round2 = (n: Decimal) => n.toDecimalPlaces(2);
    forAll(30, () => [randomFloat(0, 100000)], (a) => {
      const once  = round2(new Decimal(a));
      const twice = round2(once);
      return once.equals(twice);
    });
  });
});

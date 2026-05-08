export interface MatchParams {
  poId: string;
  grnId: string;
  invoiceId: string;
}

export interface MatchResult {
  status: 'matched' | 'exception';
  exceptions: string[];
}

export class ThreeWayMatchService {
  async match({ poId, grnId, invoiceId }: MatchParams): Promise<MatchResult> {
    // Stub: 1. Quantity match (PO vs GRN vs Invoice)
    // 2. Price match (PO vs Invoice within tolerance)
    // 3. Item match (SKU consistency)
    // 4. Tax match
    // 5. Date validation
    return { status: 'matched', exceptions: [] };
  }
}

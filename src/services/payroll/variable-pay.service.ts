export class VariablePayService {
  async calculateCommission(employeeId: string, sales: number) {
    // Stub: Commission rules per role
    return { commissionAmount: 0 };
  }

  async calculateBonus(employeeId: string, performanceScore: number) {
    // Stub: Performance-based bonuses
    return { bonusAmount: 0 };
  }
}

export class LeaveService {
  async requestLeave(employeeId: string, type: string, days: number) {
    // Stub: Saudi labor law compliance, annual, sick, etc.
    return { success: true, status: 'PENDING_APPROVAL' };
  }

  async calculateAccrual(employeeId: string) {
    // Stub: Accrual rules, carryover
    return { accruedDays: 0 };
  }
}

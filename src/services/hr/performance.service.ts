export class PerformanceService {
  async setGoals(employeeId: string, goals: any[]) {
    // Stub: OKRs / SMART goals
    return { success: true };
  }

  async initiateReview(employeeId: string, type: '360' | 'QUARTERLY') {
    // Stub: 360 feedback, Quarterly reviews
    return { reviewId: 'rev-1' };
  }
}

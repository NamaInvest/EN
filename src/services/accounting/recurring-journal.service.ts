export class RecurringJournalService {
  async processRecurring(date: Date, tenantId: string) {
    // Stub: Process scheduled recurring journal entries (e.g., monthly accruals)
    return { success: true, processedCount: 0 };
  }

  async processReversals(date: Date, tenantId: string) {
    // Stub: Process auto-reversals for the new period
    return { success: true, processedCount: 0 };
  }
}

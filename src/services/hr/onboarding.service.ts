export class OnboardingService {
  async createChecklist(employeeId: string) {
    // Stub: Pre-boarding checklist, Document collection
    return { success: true, checklistId: 'chk-1' };
  }

  async assignTraining(employeeId: string, courses: string[]) {
    return { success: true };
  }
}

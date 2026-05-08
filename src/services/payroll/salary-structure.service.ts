export class SalaryStructureService {
  async getComponents(employeeId: string) {
    // Stub: Basic, Housing, Transport, Other
    return { basic: 0, housing: 0, transport: 0, allowances: [] };
  }
}

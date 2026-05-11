export interface EmployeePerformance {
  id: string;
  name: string;
  role: string;
  department: string;
  performanceScore: number; // 1 to 5
  potentialScore: number; // 1 to 5
  flightRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  readiness: 'NOW' | '1-2_YEARS' | '3-5_YEARS';
  keyStrengths: string[];
}

export interface NineBoxReport {
  asOfDate: Date;
  tenantId: string;
  matrix: Record<string, EmployeePerformance[]>; // Keyed by box (e.g., 'high_high', 'low_low')
  summary: {
    totalEmployeesEvaluated: number;
    highPotentials: number; // top right box
    underperformers: number; // bottom left box
    highFlightRisk: number;
  };
}

export class SuccessionEngine {
  static getBoxCategory(performance: number, potential: number): string {
    const pLevel = performance >= 4 ? 'high' : performance >= 2.5 ? 'med' : 'low';
    const potLevel = potential >= 4 ? 'high' : potential >= 2.5 ? 'med' : 'low';
    return `${pLevel}_${potLevel}`;
  }

  static async generateNineBox(tenantId: string): Promise<NineBoxReport> {
    const mockEmployees: EmployeePerformance[] = [
      { id: 'E-101', name: 'Khalid Al-Dawsari', role: 'Sales Director', department: 'Sales', performanceScore: 4.8, potentialScore: 4.5, flightRisk: 'LOW', readiness: 'NOW', keyStrengths: ['Leadership', 'Negotiation'] },
      { id: 'E-102', name: 'Sarah Ahmed', role: 'Marketing Manager', department: 'Marketing', performanceScore: 4.2, potentialScore: 3.8, flightRisk: 'MEDIUM', readiness: '1-2_YEARS', keyStrengths: ['Creativity', 'Digital Ads'] },
      { id: 'E-103', name: 'Omar Fahad', role: 'Software Engineer', department: 'IT', performanceScore: 4.9, potentialScore: 4.9, flightRisk: 'HIGH', readiness: 'NOW', keyStrengths: ['Architecture', 'Problem Solving'] },
      { id: 'E-104', name: 'Noura Saad', role: 'HR Specialist', department: 'HR', performanceScore: 2.1, potentialScore: 2.5, flightRisk: 'LOW', readiness: '3-5_YEARS', keyStrengths: ['Administration'] },
      { id: 'E-105', name: 'Ali Youssef', role: 'Operations Lead', department: 'Operations', performanceScore: 3.5, potentialScore: 4.2, flightRisk: 'MEDIUM', readiness: '1-2_YEARS', keyStrengths: ['Process Optimization', 'Team Management'] },
      { id: 'E-106', name: 'Fatima Al-Zahra', role: 'Finance Analyst', department: 'Finance', performanceScore: 3.1, potentialScore: 3.0, flightRisk: 'LOW', readiness: '3-5_YEARS', keyStrengths: ['Excel', 'Reconciliation'] },
      { id: 'E-107', name: 'Majed Abdullah', role: 'Customer Support', department: 'Support', performanceScore: 1.8, potentialScore: 1.5, flightRisk: 'HIGH', readiness: '3-5_YEARS', keyStrengths: ['Patience'] },
    ];

    const matrix: Record<string, EmployeePerformance[]> = {
      'high_high': [], 'high_med': [], 'high_low': [],
      'med_high': [],  'med_med': [],  'med_low': [],
      'low_high': [],  'low_med': [],  'low_low': []
    };

    let highPotentials = 0;
    let underperformers = 0;
    let highFlightRisk = 0;

    for (const emp of mockEmployees) {
      const box = this.getBoxCategory(emp.performanceScore, emp.potentialScore);
      if (matrix[box]) {
        matrix[box].push(emp);
      }

      if (box === 'high_high') highPotentials++;
      if (box === 'low_low') underperformers++;
      if (emp.flightRisk === 'HIGH') highFlightRisk++;
    }

    return {
      asOfDate: new Date(),
      tenantId,
      matrix,
      summary: {
        totalEmployeesEvaluated: mockEmployees.length,
        highPotentials,
        underperformers,
        highFlightRisk
      }
    };
  }
}

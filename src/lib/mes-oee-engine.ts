export interface MachineStatus {
  machineId: string;
  name: string;
  status: 'RUNNING' | 'DOWNTIME' | 'MAINTENANCE' | 'IDLE';
  currentJob: string | null;
  operator: string | null;
  uptimeMinutes: number;
  downtimeMinutes: number;
  producedUnits: number;
  defectiveUnits: number;
  targetUnits: number;
}

export interface OEEData {
  machineId: string;
  availability: number; // %
  performance: number; // %
  quality: number; // %
  oeeScore: number; // % (A * P * Q)
}

export interface MESReport {
  asOfDate: Date;
  tenantId: string;
  machines: (MachineStatus & { oee: OEEData })[];
  factorySummary: {
    overallOEE: number;
    totalProduced: number;
    totalDefects: number;
    activeMachinesCount: number;
    downtimeAlerts: number;
  };
}

/**
 * MES (Manufacturing Execution System) & OEE (Overall Equipment Effectiveness) Engine
 * Monitors shop floor machines in real-time, calculates OEE metrics.
 */
export class MesOeeEngine {
  static async getFactoryStatus(tenantId: string): Promise<MESReport> {
    try {
      const mockMachines = [
        { id: 'MCH-01', name: 'CNC Lathe A', status: 'RUNNING', job: 'WO-2026-089', op: 'Ahmed Ali', up: 420, down: 15, prod: 850, def: 12, target: 1000 },
        { id: 'MCH-02', name: 'Injection Molder B', status: 'RUNNING', job: 'WO-2026-091', op: 'Sara K.', up: 380, down: 45, prod: 4500, def: 85, target: 5000 },
        { id: 'MCH-03', name: 'Packaging Line 1', status: 'DOWNTIME', job: 'WO-2026-090', op: 'Omar S.', up: 120, down: 240, prod: 1200, def: 10, target: 3000 },
        { id: 'MCH-04', name: 'Robotic Welder X', status: 'MAINTENANCE', job: null, op: null, up: 0, down: 480, prod: 0, def: 0, target: 0 },
        { id: 'MCH-05', name: 'CNC Milling C', status: 'RUNNING', job: 'WO-2026-095', op: 'Khalid F.', up: 460, down: 5, prod: 300, def: 2, target: 350 },
      ];

      const machines: (MachineStatus & { oee: OEEData })[] = [];
      let totalOeeScore = 0;
      let totalProduced = 0;
      let totalDefects = 0;
      let activeMachinesCount = 0;
      let downtimeAlerts = 0;

      for (const m of mockMachines) {
        const totalTime = m.up + m.down || 1; // Prevent division by zero
        
        // Availability = Uptime / Total Scheduled Time
        const availability = (m.up / totalTime) * 100;
        
        // Performance = Ideal Cycle Time * Total Units / Uptime
        // Simplified: (Produced / Target) assuming target is scaled to uptime
        let performance = m.target > 0 ? (m.prod / (m.target * (m.up / totalTime))) * 100 : 0;
        performance = Math.min(100, Math.max(0, performance)); // Cap at 100%

        // Quality = Good Units / Total Produced
        let quality = m.prod > 0 ? ((m.prod - m.def) / m.prod) * 100 : 0;

        // Overall Equipment Effectiveness (OEE)
        const oeeScore = (availability / 100) * (performance / 100) * (quality / 100) * 100;

        const oee: OEEData = {
          machineId: m.id,
          availability: Math.round(availability * 10) / 10,
          performance: Math.round(performance * 10) / 10,
          quality: Math.round(quality * 10) / 10,
          oeeScore: Math.round(oeeScore * 10) / 10
        };

        if (m.status === 'RUNNING') activeMachinesCount++;
        if (m.status === 'DOWNTIME') downtimeAlerts++;
        
        totalProduced += m.prod;
        totalDefects += m.def;
        totalOeeScore += oeeScore;

        machines.push({
          machineId: m.id,
          name: m.name,
          status: m.status as any,
          currentJob: m.job,
          operator: m.op,
          uptimeMinutes: m.up,
          downtimeMinutes: m.down,
          producedUnits: m.prod,
          defectiveUnits: m.def,
          targetUnits: m.target,
          oee
        });
      }

      const overallOEE = machines.length > 0 ? totalOeeScore / machines.length : 0;

      return {
        asOfDate: new Date(),
        tenantId,
        machines,
        factorySummary: {
          overallOEE: Math.round(overallOEE * 10) / 10,
          totalProduced,
          totalDefects,
          activeMachinesCount,
          downtimeAlerts
        }
      };

    } catch (error: any) {
      console.error('MesOeeEngine Error:', error);
      throw new Error(`Failed to process MES/OEE status: ${error.message}`);
    }
  }
}

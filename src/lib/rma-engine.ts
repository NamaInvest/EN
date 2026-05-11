import { logger } from '@/lib/logger';

const log = logger.child({ service: 'rma-engine' });

/**
 * O-12: RMA Multi-Step — in-memory store (returnOrder not in schema)
 * Stages: REQUESTED → APPROVED → RECEIVED → INSPECTED → RESOLVED
 */
interface RMALine { productId: number; qty: number; defectDescription: string; disposition: string }
interface RMARecord {
  id: string; rmaNumber: string; tenantId: string; customerId: number;
  salesOrderId?: number; reason: string; status: string;
  requestedBy: number; approvedBy?: number; receivedBy?: number; resolvedBy?: number;
  resolution?: string; createdAt: Date; resolvedAt?: Date; receivedAt?: Date;
  lines: RMALine[];
}

const rmaStore = new Map<string, RMARecord>();
let seq = 1;

export class RMAEngine {
  static create(tenantId: string, data: { customerId: number; salesOrderId?: number; reason: string; items: RMALine[]; requestedBy: number }): RMARecord {
    const id = `rma_${seq++}`;
    const rma: RMARecord = { id, rmaNumber: `RMA-${Date.now()}`, tenantId, customerId: data.customerId, salesOrderId: data.salesOrderId, reason: data.reason, status: 'REQUESTED', requestedBy: data.requestedBy, createdAt: new Date(), lines: data.items.map(i => ({ ...i, disposition: 'PENDING' })) };
    rmaStore.set(id, rma);
    log.info(`RMA created: ${rma.rmaNumber}`);
    return rma;
  }

  static approve(id: string, approvedBy: number): RMARecord {
    const rma = rmaStore.get(id); if (!rma) throw new Error(`RMA ${id} not found`);
    rma.status = 'APPROVED'; rma.approvedBy = approvedBy;
    return rma;
  }

  static receive(id: string, receivedBy: number): RMARecord {
    const rma = rmaStore.get(id); if (!rma) throw new Error(`RMA ${id} not found`);
    rma.status = 'RECEIVED'; rma.receivedBy = receivedBy; rma.receivedAt = new Date();
    return rma;
  }

  static inspect(id: string, lineIndex: number, disposition: 'RESTOCK' | 'SCRAP' | 'REPAIR' | 'RETURN_TO_VENDOR'): RMARecord {
    const rma = rmaStore.get(id); if (!rma) throw new Error(`RMA ${id} not found`);
    if (rma.lines[lineIndex]) { rma.lines[lineIndex].disposition = disposition; rma.status = 'INSPECTED'; }
    return rma;
  }

  static resolve(id: string, resolution: 'REFUND' | 'REPLACEMENT' | 'CREDIT_NOTE', resolvedBy: number): RMARecord {
    const rma = rmaStore.get(id); if (!rma) throw new Error(`RMA ${id} not found`);
    rma.status = 'RESOLVED'; rma.resolution = resolution; rma.resolvedBy = resolvedBy; rma.resolvedAt = new Date();
    return rma;
  }

  static getMetrics(tenantId: string) {
    const all = Array.from(rmaStore.values()).filter(r => r.tenantId === tenantId);
    const open     = all.filter(r => !['RESOLVED'].includes(r.status)).length;
    const resolved = all.filter(r => r.status === 'RESOLVED').length;
    return { total: all.length, open, resolved, resolutionRate: all.length > 0 ? (resolved / all.length * 100).toFixed(1) + '%' : '0%' };
  }
}

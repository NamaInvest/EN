/**
 * Qiwa Engine (Phase 33 - HRSD Platform Integration)
 * ──────────────────────────────────────────────────────────
 * Manages the integration with the Saudi Qiwa platform.
 * Tracks Nitaqat Saudization status, synchronizes e-contracts, and manages work permits/visa quotas.
 */
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'QiwaEngine' });

export type NitaqatColor = 'PLATINUM' | 'HIGH_GREEN' | 'MID_GREEN' | 'LOW_GREEN' | 'YELLOW' | 'RED';

export interface NitaqatStatus {
    saudizationPercentage: number;
    currentColor: NitaqatColor;
    totalSaudiEmployees: number;
    totalExpatEmployees: number;
    requiredForNextLevel: number; // Saudis needed to jump to next tier
}

export interface QiwaContract {
    contractId: string;
    employeeNationalId: string;
    type: 'FIXED_TERM' | 'UNLIMITED';
    basicSalary: number;
    allowances: number;
    startDate: Date;
    endDate?: Date;
    status: 'ACTIVE' | 'PENDING_EMPLOYEE_APPROVAL' | 'EXPIRED' | 'TERMINATED';
}

export class QiwaEngine {

    /**
     * Syncs Nitaqat details from Qiwa and calculates internal hiring capacity.
     */
    static async syncNitaqatStatus(tenantId: string): Promise<NitaqatStatus> {
        try {
            log.info('Fetching Nitaqat status from Qiwa API...');

            // Mocking API call to Qiwa: GET /v1/establishments/{id}/nitaqat
            await new Promise(r => setTimeout(r, 600));

            // Simulating a calculation from our local DB to ensure sync
            const p = prisma as any;
            let totalSaudi = 20;
            let totalExpat = 80;

            if (p.employee) {
                const employees = await p.employee.findMany({ where: { tenantId, status: 'ACTIVE' }, select: { nationality: true } });
                totalSaudi = employees.filter((e: any) => e.nationality === 'SA' || e.nationality === 'Saudi').length;
                totalExpat = employees.length - totalSaudi;
            }

            const total = totalSaudi + totalExpat;
            const percentage = total > 0 ? (totalSaudi / total) * 100 : 0;

            let color: NitaqatColor = 'LOW_GREEN';
            if (percentage >= 40) color = 'PLATINUM';
            else if (percentage >= 30) color = 'HIGH_GREEN';
            else if (percentage >= 20) color = 'MID_GREEN';
            else if (percentage >= 10) color = 'LOW_GREEN';
            else if (percentage >= 5) color = 'YELLOW';
            else color = 'RED';

            const status: NitaqatStatus = {
                saudizationPercentage: Number(percentage.toFixed(2)),
                currentColor: color,
                totalSaudiEmployees: totalSaudi,
                totalExpatEmployees: totalExpat,
                requiredForNextLevel: 5 // Mock required hires
            };

            log.info(`Nitaqat synced. Status: ${color} (${percentage.toFixed(1)}%)`);
            return status;

        } catch (error: any) {
            log.error('Failed to sync Nitaqat status', { error: error.message });
            throw new Error(`Nitaqat Sync failed: ${error.message}`);
        }
    }

    /**
     * Publishes an employee's employment contract to the Qiwa portal.
     * Contracts must be authenticated by the employee via Absher.
     */
    static async publishContract(tenantId: string, employeeId: number, contractData: any): Promise<QiwaContract> {
        try {
            log.info(`Publishing contract for Employee ${employeeId} to Qiwa...`);

            // Validate mandatory fields
            if (!contractData.nationalId) throw new Error('National ID / Iqama is required for Qiwa Contract.');
            if (!contractData.basicSalary || contractData.basicSalary < 3000) throw new Error('Basic salary cannot be less than 3,000 SAR for Saudization.');

            // Mocking API call: POST /v1/contracts
            await new Promise(r => setTimeout(r, 800));

            const qiwaContract: QiwaContract = {
                contractId: `QW-CTR-${Date.now()}`,
                employeeNationalId: contractData.nationalId,
                type: contractData.type || 'FIXED_TERM',
                basicSalary: contractData.basicSalary,
                allowances: contractData.allowances || 0,
                startDate: contractData.startDate || new Date(),
                status: 'PENDING_EMPLOYEE_APPROVAL'
            };

            log.info(`Contract ${qiwaContract.contractId} published. Waiting for employee approval via Absher.`);
            return qiwaContract;

        } catch (error: any) {
            log.error('Failed to publish Qiwa contract', { error: error.message });
            throw new Error(`Qiwa Contract Publishing failed: ${error.message}`);
        }
    }
}

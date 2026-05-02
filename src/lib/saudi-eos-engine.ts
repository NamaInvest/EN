import prisma from './prisma';
import { createJournalEntry, ACCOUNTS } from './auto-journal';

export type EOSReason = 'RESIGNATION' | 'TERMINATION' | 'TERMINATION_FOR_CAUSE' | 'RETIREMENT' | 'DEATH' | 'FORCE_MAJEURE';

export interface EOSResult {
    employeeId: number;
    calculationDate: Date;
    joinDate: Date;
    endDate: Date;
    reasonForLeaving: EOSReason;
    yearsOfService: number;
    lastBasicSalary: number;
    lastFullSalary: number;
    
    firstFiveYearsAmount: number;
    remainingYearsAmount: number;
    resignationFactor: number;
    
    unpaidVacationAmount: number;
    unpaidOvertimeAmount: number;
    outstandingLoanAmount: number;
    
    totalEOS: number;
    netSettlement: number;
}

export class SaudiEOSEngine {
    static async calculate(employeeId: number, endDate: Date, reason: EOSReason): Promise<EOSResult> {
        const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
        if (!employee) throw new Error(`Employee ${employeeId} not found`);
        if (!employee.startDate) throw new Error(`Employee ${employeeId} has no start date`);

        const joinDate = new Date(employee.startDate);
        const calcEndDate = new Date(endDate);
        
        // Calculate exact years of service (including fractions)
        const diffTime = Math.abs(calcEndDate.getTime() - joinDate.getTime());
        const yearsOfService = diffTime / (1000 * 60 * 60 * 24 * 365.25);
        
        const lastBasicSalary = employee.salary || 0;
        const allowances = (employee.housingAllowance || 0) + (employee.transportAllowance || 0) + (employee.otherAllowance || 0);
        const lastFullSalary = lastBasicSalary + allowances;

        // Article 84: First 5 years = half month salary per year, remaining = full month salary per year
        let firstFiveYearsAmount = 0;
        let remainingYearsAmount = 0;
        
        if (yearsOfService <= 5) {
            firstFiveYearsAmount = yearsOfService * (lastFullSalary / 2);
        } else {
            firstFiveYearsAmount = 5 * (lastFullSalary / 2);
            remainingYearsAmount = (yearsOfService - 5) * lastFullSalary;
        }

        let totalEOSBeforeFactor = firstFiveYearsAmount + remainingYearsAmount;
        let resignationFactor = 1.0;

        // Article 85: Resignation
        if (reason === 'RESIGNATION') {
            if (yearsOfService < 2) {
                resignationFactor = 0.0;
            } else if (yearsOfService >= 2 && yearsOfService < 5) {
                resignationFactor = 1 / 3;
            } else if (yearsOfService >= 5 && yearsOfService < 10) {
                resignationFactor = 2 / 3;
            } else {
                resignationFactor = 1.0;
            }
        }
        
        // Article 87 (Termination for cause by employee fault): No EOS
        if (reason === 'TERMINATION_FOR_CAUSE') {
            resignationFactor = 0.0;
        }

        const totalEOS = totalEOSBeforeFactor * resignationFactor;

        // Mocks for additions/deductions (can be connected to actual DB models later)
        const unpaidVacationAmount = 0;
        const unpaidOvertimeAmount = 0;
        const outstandingLoanAmount = 0;

        const netSettlement = totalEOS + unpaidVacationAmount + unpaidOvertimeAmount - outstandingLoanAmount;

        return {
            employeeId,
            calculationDate: new Date(),
            joinDate,
            endDate: calcEndDate,
            reasonForLeaving: reason,
            yearsOfService,
            lastBasicSalary,
            lastFullSalary,
            firstFiveYearsAmount,
            remainingYearsAmount,
            resignationFactor,
            unpaidVacationAmount,
            unpaidOvertimeAmount,
            outstandingLoanAmount,
            totalEOS,
            netSettlement
        };
    }

    static async saveDraft(eosResult: EOSResult) {
        return await prisma.endOfServiceCalculation.create({
            data: {
                employeeId: eosResult.employeeId,
                joinDate: eosResult.joinDate,
                endDate: eosResult.endDate,
                reasonForLeaving: eosResult.reasonForLeaving,
                yearsOfService: eosResult.yearsOfService,
                lastBasicSalary: eosResult.lastBasicSalary,
                lastFullSalary: eosResult.lastFullSalary,
                firstFiveYearsAmount: eosResult.firstFiveYearsAmount,
                remainingYearsAmount: eosResult.remainingYearsAmount,
                resignationFactor: eosResult.resignationFactor,
                unpaidVacationAmount: eosResult.unpaidVacationAmount,
                unpaidOvertimeAmount: eosResult.unpaidOvertimeAmount,
                outstandingLoanAmount: eosResult.outstandingLoanAmount,
                totalEOS: eosResult.totalEOS,
                netSettlement: eosResult.netSettlement,
                status: 'DRAFT'
            }
        });
    }

    static async approve(eosId: number, approverId: number): Promise<void> {
        const eos = await prisma.endOfServiceCalculation.findUnique({ where: { id: eosId } });
        if (!eos) throw new Error(`EOS ${eosId} not found`);
        if (eos.status !== 'DRAFT') throw new Error(`EOS ${eosId} is not in DRAFT status`);

        await prisma.endOfServiceCalculation.update({
            where: { id: eosId },
            data: {
                status: 'APPROVED',
                approvedBy: approverId,
                approvedAt: new Date()
            }
        });
    }

    static async pay(eosId: number, payerId: number): Promise<void> {
        const eos = await prisma.endOfServiceCalculation.findUnique({ 
            where: { id: eosId },
            include: { employee: true }
        });
        if (!eos) throw new Error(`EOS ${eosId} not found`);
        if (eos.status !== 'APPROVED') throw new Error(`EOS ${eosId} is not APPROVED`);

        // Create Journal Entry via AutoJournalEngine
        const jeResult = await createJournalEntry({
            description: `تسوية نهاية خدمة للموظف ${eos.employee.name}`,
            reference: `EOS-${eosId}`,
            lines: [
                { accountCode: ACCOUNTS.SALARIES, debit: Number(eos.netSettlement), credit: 0, description: `مصروف نهاية خدمة ${eos.employee.name}` },
                { accountCode: ACCOUNTS.CASH, debit: 0, credit: Number(eos.netSettlement), description: `سداد نهاية خدمة ${eos.employee.name}` }
            ],
            userId: payerId,
            date: new Date().toISOString().split('T')[0]
        });

        if (!jeResult.success) {
            throw new Error(`Failed to create Journal Entry: ${jeResult.error}`);
        }

        await prisma.endOfServiceCalculation.update({
            where: { id: eosId },
            data: {
                status: 'PAID',
                paidAt: new Date(),
                journalEntryId: jeResult.entryId
            }
        });
    }
}

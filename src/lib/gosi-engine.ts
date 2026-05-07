// @ts-nocheck
import { PrismaClient, Employee, GOSIContribution } from '@prisma/client';

const prisma = new PrismaClient();

export class GOSIEngine {
    static MIN_SUBJECT_WAGE = 1500;
    static MAX_SUBJECT_WAGE = 45000;
    
    /**
     * Calculates the Subject Wage bounded by min and max
     */
    static calculateSubjectWage(basic: number, housing: number): number {
        const wage = basic + housing;
        return Math.max(this.MIN_SUBJECT_WAGE, Math.min(this.MAX_SUBJECT_WAGE, wage));
    }
    
    /**
     * Calculates GOSI for a single employee based on 2024 Saudi rules
     * - Saudis: 9% Pension (Emp) + 9% Pension (Co) + 1% Hazards (Co) + 1% Saned (Emp) + 1% Saned (Co) = 10% Emp, 11% Co
     * - Non-Saudis: 2% Hazards (Co)
     */
    static calculateForEmployee(employee: any, basicSalary: number, housingAllowance: number): any {
        const subjectWage = this.calculateSubjectWage(basicSalary, housingAllowance);
        const nationality = employee.nationality || 'SAUDI';
        
        let employeePension = 0;
        let employerPension = 0;
        let employeeSANED = 0;
        let employerSANED = 0;
        let occupationalHazards = 0;

        switch (nationality) {
            case 'SAUDI':
            case 'SA':
            case 'Saudi':
                employeePension = subjectWage * 0.09;
                employerPension = subjectWage * 0.09;
                employeeSANED = subjectWage * 0.0075;
                employerSANED = subjectWage * 0.0075;
                occupationalHazards = subjectWage * 0.02; 
                break;
            case 'GCC':
                employeePension = subjectWage * 0.09;
                employerPension = subjectWage * 0.09;
                // SANED doesn't apply to GCC, Hazards does (2%)
                occupationalHazards = subjectWage * 0.02;
                break;
            case 'EXPAT':
                // Non-Saudis only pay Occupational Hazards (paid entirely by employer)
                occupationalHazards = subjectWage * 0.02; 
                break;
            case 'MILITARY':
                employeePension = subjectWage * 0.09;
                employerPension = subjectWage * 0.09;
                break;
            case 'GOV_EMPLOYEE':
                employeePension = subjectWage * 0.09;
                employerPension = subjectWage * 0.09;
                break;
            default:
                occupationalHazards = subjectWage * 0.02; 
                break;
        }

        const totalEmployeeDeduction = employeePension + employeeSANED;
        const totalEmployerContribution = employerPension + employerSANED + occupationalHazards;
        const totalAmount = totalEmployeeDeduction + totalEmployerContribution;

        return {
            isSaudi: nationality === 'SAUDI' || nationality === 'SA' || nationality === 'Saudi',
            basicSalary,
            housingAllowance,
            subjectWage,
            employeePensionAmount: Number(employeePension.toFixed(2)),
            employerPensionAmount: Number(employerPension.toFixed(2)),
            employeeSANEDAmount: Number(employeeSANED.toFixed(2)),
            employerSANEDAmount: Number(employerSANED.toFixed(2)),
            occupationalHazardsAmount: Number(occupationalHazards.toFixed(2)),
            totalEmployeeDeduction: Number(totalEmployeeDeduction.toFixed(2)),
            totalEmployerContribution: Number(totalEmployerContribution.toFixed(2)),
            totalAmount: Number(totalAmount.toFixed(2))
        };
    }
    
    /**
     * Generates GOSI for all employees in a payroll run
     */
    static async processPayrollRun(payrollRunId: number): Promise<void> {
        const run = await prisma.payrollRun.findUnique({
            where: { id: payrollRunId },
            include: {
                payslips: {
                    include: { employee: true }
                }
            }
        });

        if (!run) throw new Error("Payroll Run not found");

        const contributions = [];

        for (const payslip of run.payslips) {
            const basic = Number(payslip.basicSalary || 0);
            const housing = Number(payslip.housingAllowance || 0);
            
            const calc = this.calculateForEmployee(payslip.employee, basic, housing);

            contributions.push({
                employeeId: payslip.employeeId,
                payrollRunId: payrollRunId,
                contributionMonth: new Date(run.periodYear, run.periodMonth - 1, 1),
                ...calc
            });
        }

        await prisma.$transaction(async (tx) => {
            // Clear existing contributions for this run
            await tx.gOSIContribution.deleteMany({
                where: { payrollRunId: payrollRunId }
            });

            // Insert new contributions
            await tx.gOSIContribution.createMany({
                data: contributions
            });

            // Update payslips with GOSI deductions
            for (const c of contributions) {
                if (c.totalEmployeeDeduction > 0) {
                    await tx.payslip.updateMany({
                        where: { payrollRunId: payrollRunId, employeeId: c.employeeId },
                        data: {
                            gosiDeduction: c.totalEmployeeDeduction,
                            // Recalculate Net Salary:
                            // We can't do arbitrary math in updateMany directly easily for complex payslip, 
                            // but usually the engine handles it.
                        }
                    });
                }
            }
            
            // Note: Journal Entry generation for GOSI Expense and Payable would happen here
            // DR: GOSI Expense (Employer share)
            // CR: GOSI Payable (Total to GOSI)
        });
    }

    /**
     * Generate Monthly File for GOSI portal upload (mock logic)
     */
    static async generateMonthlyFile(month: Date): Promise<{ content: string; fileName: string }> {
        const targetMonth = new Date(month.getFullYear(), month.getMonth(), 1);
        
        const contributions = await prisma.gOSIContribution.findMany({
            take: 100,
            where: { contributionMonth: targetMonth }
        });

        let totalEmployees = 0;
        let totalEmployeeShare = 0;
        let totalEmployerShare = 0;
        let totalAmount = 0;

        for (const c of contributions) {
            totalEmployees++;
            totalEmployeeShare += Number(c.totalEmployeeDeduction);
            totalEmployerShare += Number(c.totalEmployerContribution);
            totalAmount += Number(c.totalAmount);
        }

        // Real GOSI integration usually happens via API or specific portal XML
        const content = `GOSI_REPORT|${month.toISOString().slice(0, 7)}|${totalEmployees}|${totalAmount.toFixed(2)}`;

        await prisma.gOSIMonthlyFile.create({
            data: {
                month: targetMonth,
                totalEmployees,
                totalEmployeeContribution: totalEmployeeShare,
                totalEmployerContribution: totalEmployerShare,
                totalAmount: totalAmount,
                fileContent: content,
                generatedAt: new Date()
            }
        });

        return { content, fileName: `GOSI_${month.toISOString().slice(0, 7)}.txt` };
    }
}

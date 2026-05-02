// @ts-nocheck
import { PrismaClient, WPSBatch, Employee } from '@prisma/client';

const prisma = new PrismaClient();

export class WPSGenerator {
    
    /**
     * SIF Format (per SAMA spec):
     * Line 1 (Header): EmployerID|EmployerName|BankCode|FileDate|TotalRecords|TotalAmount
     * Lines 2..N (Detail): EmployeeID|IBAN|BasicSalary|HousingAllowance|OtherAllowance|Net|MOLNumber
     * Line N+1 (Trailer): END|TotalRecords|TotalAmount
     */
    static async generateSIF(payrollRunId: number, bankCode: string, employerId: string, employerName: string): Promise<{ content: string; fileName: string }> {
        // Find the payroll run and related payslips
        const run = await prisma.payrollRun.findUnique({
            where: { id: payrollRunId },
            include: {
                payslips: {
                    include: { employee: true }
                }
            }
        });

        if (!run) throw new Error("Payroll Run not found");

        const batchNumber = `WPS-${run.periodYear}-${run.periodMonth}-${Date.now().toString().slice(-4)}`;
        
        let totalAmount = 0;
        let totalRecords = 0;
        const detailsLines: string[] = [];
        const batchItems: any[] = [];

        for (const payslip of run.payslips) {
            // Validate IBAN roughly
            const iban = payslip.employee.bankIban;
            if (!iban || iban.length < 24) continue; // Skip employees without valid IBAN

            const basic = Number(payslip.basicSalary || 0);
            const housing = Number(payslip.housingAllowance || 0);
            // We sum up all other allowances
            const otherAllowance = Number(payslip.totalAllowances || 0) - housing;
            const net = Number(payslip.netSalary || 0);
            
            // Assuming employee ID is their national ID / MOL number for SIF
            const empId = payslip.employee.nationalId || payslip.employee.id.toString();
            
            // Format amounts to 2 decimal places as required by SAMA
            const line = `${empId}|${iban}|${basic.toFixed(2)}|${housing.toFixed(2)}|${otherAllowance.toFixed(2)}|${net.toFixed(2)}|${empId}`;
            detailsLines.push(line);
            
            totalAmount += net;
            totalRecords++;

            batchItems.push({
                employeeId: payslip.employeeId,
                iban: iban,
                basicSalary: basic,
                housingAllowance: housing,
                otherAllowance: otherAllowance,
                totalSalary: net
            });
        }

        if (totalRecords === 0) throw new Error("No valid employees with IBAN found in this payroll run.");

        // Construct Header
        const fileDate = new Date().toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD
        const header = `${employerId}|${employerName}|${bankCode}|${fileDate}|${totalRecords}|${totalAmount.toFixed(2)}`;
        
        // Construct Trailer
        const trailer = `END|${totalRecords}|${totalAmount.toFixed(2)}`;

        // Combine
        const fileContent = [header, ...detailsLines, trailer].join('\n');
        const fileName = `${employerId}_${fileDate}_${bankCode}.sif`;

        // Save to Database
        await prisma.wPSBatch.create({
            data: {
                payrollRunId: payrollRunId,
                bankCode: bankCode,
                batchNumber: batchNumber,
                totalAmount: totalAmount,
                totalEmployees: totalRecords,
                fileFormat: 'SIF_V2',
                fileContent: fileContent,
                fileGeneratedAt: new Date(),
                status: 'GENERATED',
                items: {
                    create: batchItems
                }
            }
        });

        return { content: fileContent, fileName };
    }

    static async validateIBANs(employees: Employee[]): Promise<{ valid: number, invalid: number, errors: string[] }> {
        // ... (existing logic)
        let valid = 0;
        let invalid = 0;
        const errors: string[] = [];

        for (const emp of employees) {
            if (!emp.bankIban) {
                invalid++;
                errors.push(`Employee ${emp.fullName} has no IBAN.`);
            } else if (!emp.bankIban.startsWith('SA')) {
                invalid++;
                errors.push(`Employee ${emp.fullName} has an invalid IBAN format (must start with SA).`);
            } else if (emp.bankIban.length !== 24) {
                invalid++;
                errors.push(`Employee ${emp.fullName} IBAN length is incorrect (${emp.bankIban.length} instead of 24).`);
            } else {
                valid++;
            }
        }

        return { valid, invalid, errors };
    }

    static async submitToBank(batchId: number): Promise<void> {
        // Mark as uploaded in the system. Actual bank API integration would go here.
        await prisma.wPSBatch.update({
            where: { id: batchId },
            data: { 
                status: 'UPLOADED',
                uploadedAt: new Date()
            }
        });
    }
}

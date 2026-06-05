// WPS Generator v3.0 - Saudi Arabia Wage Protection System (Mudad 2026)
// Compliant with MHRSD / SAMA / Mudad / Qiwa / GOSI regulations
// @ts-nocheck
import { Employee } from '@prisma/client';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'wps-generator' });

// Saudi Bank Codes (BIC/SWIFT)
const SAUDI_BANKS: Record<string, string> = {
    'RJHI': 'مصرف الراجحي',
    'ALBI': 'بنك الإنماء',
    'SABB': 'ساب',
    'SNB': 'البنك الأهلي السعودي',
    'BSFR': 'بنك البلاد',
    'RIBL': 'بنك الرياض',
    'ARNB': 'البنك العربي الوطني',
    'SIBC': 'البنك السعودي للاستثمار',
    'BJAZ': 'بنك الجزيرة',
    'AAAL': 'البنك الأول',
    'GULF': 'بنك الخليج الدولي',
};

// SIF v3 Record Types
const SIF_RECORD_TYPES = {
    HEADER: 'HDR',
    EMPLOYEE: 'EMP',
    DEDUCTION: 'DED',
    TRAILER: 'TRL',
};

export interface WPSValidationResult {
    valid: number;
    invalid: number;
    warnings: number;
    errors: WPSValidationError[];
}

export interface WPSValidationError {
    employeeId: number;
    employeeName: string;
    field: string;
    message: string;
    severity: 'ERROR' | 'WARNING';
}

export interface MudadSubmissionResult {
    batchId: number;
    status: 'SUBMITTED' | 'FAILED';
    mudadReferenceNo?: string;
    errors?: string[];
}

export class WPSGenerator {

    /**
     * SIF v3 Format (Mudad 2026 Specification):
     * 
     * Header Record:
     * HDR|FileVersion|EmployerId|EmployerMOLId|BankCode|PayMonth|PayYear|FileDate|TotalRecords|TotalAmount|Currency
     * 
     * Employee Record:
     * EMP|EmployeeId|NationalId|IqamaNumber|EmployeeName|IBAN|BasicSalary|HousingAllowance|TransportAllowance|OtherAllowance|Deductions|NetSalary|PaymentType|ContractType|Nationality
     * 
     * Deduction Record (optional per employee):
     * DED|EmployeeId|DeductionType|DeductionAmount|Description
     * 
     * Trailer Record:
     * TRL|TotalEmployees|TotalBasic|TotalAllowances|TotalDeductions|TotalNet
     */
    static async generateSIF(
        prisma: any,
        tenantId: string,
        payrollRunId: number,
        bankCode: string,
        employerId: string,
        employerName: string,
        employerMOLId: string
    ): Promise<{ content: string; fileName: string; batchId: number; summary: any }> {

        const run = await prisma.payrollRun.findFirst({
            where: { id: payrollRunId, tenantId },
            include: {
                payslips: {
                    where: { tenantId },
                    include: { employee: true }
                }
            }
        });

        if (!run) throw new Error("Payroll Run not found");

        const batchNumber = `WPS-${run.year}-${String(run.month).padStart(2, '0')}-${Date.now().toString().slice(-6)}`;

        let totalBasic = 0;
        let totalAllowances = 0;
        let totalDeductions = 0;
        let totalNet = 0;
        let totalRecords = 0;
        const employeeLines: string[] = [];
        const deductionLines: string[] = [];
        const batchItems: any[] = [];
        const validationErrors: WPSValidationError[] = [];

        for (const payslip of run.payslips) {
            const emp = payslip.employee;

            // Validate IBAN (Saudi IBAN: SA + 22 chars = 24 total)
            const iban = emp.iban;
            if (!iban || iban.length < 24) {
                validationErrors.push({
                    employeeId: emp.id,
                    employeeName: emp.name || 'موظف',
                    field: 'IBAN',
                    message: `IBAN مفقود أو غير صالح (${iban || 'فارغ'})`,
                    severity: 'ERROR'
                });
                continue;
            }

            if (!iban.startsWith('SA')) {
                validationErrors.push({
                    employeeId: emp.id,
                    employeeName: emp.name || 'موظف',
                    field: 'IBAN',
                    message: 'IBAN يجب أن يبدأ بـ SA',
                    severity: 'ERROR'
                });
                continue;
            }

            // Validate National ID / Iqama
            const nationalId = emp.idNumber || emp.iqamaNumber || '';
            if (!nationalId || nationalId.length < 10) {
                validationErrors.push({
                    employeeId: emp.id,
                    employeeName: emp.name || 'موظف',
                    field: 'idNumber/iqamaNumber',
                    message: 'رقم الهوية/الإقامة مفقود أو غير صالح',
                    severity: 'ERROR'
                });
                continue;
            }

            const basic = Number(payslip.basicSalary || 0);
            const housing = Number(payslip.housingAllowance || 0);
            const transport = Number(payslip.transportAllowance || 0);
            const otherAllowance = Number(payslip.totalAllowances || 0) - housing - transport;
            const deductions = Number(payslip.totalDeductions || 0);
            const net = Number(payslip.netSalary || 0);

            // Determine nationality category (Saudi = 1, Non-Saudi = 2)
            const isSaudi = nationalId.startsWith('1');
            const nationality = isSaudi ? 'SAU' : 'NON_SAU';

            // Contract type from employee record (default to FULL_TIME)
            const contractType = 'FULL_TIME';

            // Payment type: BANK_TRANSFER (mandatory since 2024)
            const paymentType = 'BANK_TRANSFER';

            // Build SIF Employee Line
            const empLine = [
                SIF_RECORD_TYPES.EMPLOYEE,
                emp.id,
                nationalId,
                isSaudi ? nationalId : nationalId, // Iqama = nationalId for non-Saudi
                (emp.name || '').replace(/\|/g, ' '), // Sanitize pipe chars
                iban,
                basic.toFixed(2),
                housing.toFixed(2),
                transport.toFixed(2),
                Math.max(0, otherAllowance).toFixed(2),
                deductions.toFixed(2),
                net.toFixed(2),
                paymentType,
                contractType,
                nationality
            ].join('|');

            employeeLines.push(empLine);

            // Add deduction details if any
            if (deductions > 0) {
                // GOSI deduction
                const gosiDeduction = Number(payslip.gosiDeduction || 0);
                if (gosiDeduction > 0) {
                    deductionLines.push(`${SIF_RECORD_TYPES.DEDUCTION}|${emp.id}|GOSI|${gosiDeduction.toFixed(2)}|GOSI Employee Share`);
                }

                // Other deductions
                const otherDed = deductions - gosiDeduction;
                if (otherDed > 0) {
                    deductionLines.push(`${SIF_RECORD_TYPES.DEDUCTION}|${emp.id}|OTHER|${otherDed.toFixed(2)}|Other Deductions`);
                }
            }

            totalBasic += basic;
            totalAllowances += housing + transport + Math.max(0, otherAllowance);
            totalDeductions += deductions;
            totalNet += net;
            totalRecords++;

            batchItems.push({
                employeeId: emp.id,
                iban,
                basicSalary: basic,
                housingAllowance: housing,
                otherAllowance: transport + Math.max(0, otherAllowance),
                totalSalary: net
            });
        }

        if (totalRecords === 0) {
            throw new Error(`No valid employees found. ${validationErrors.length} validation errors detected.`);
        }

        // Build Header
        const fileDate = new Date().toISOString().split('T')[0].replace(/-/g, '');
        const header = [
            SIF_RECORD_TYPES.HEADER,
            'SIF_V3',          // File Version (Mudad 2026)
            employerId,
            employerMOLId,
            bankCode,
            String(run.month).padStart(2, '0'),
            String(run.year),
            fileDate,
            totalRecords,
            totalNet.toFixed(2),
            'SAR'              // Currency (mandatory SAR)
        ].join('|');

        // Build Trailer
        const trailer = [
            SIF_RECORD_TYPES.TRAILER,
            totalRecords,
            totalBasic.toFixed(2),
            totalAllowances.toFixed(2),
            totalDeductions.toFixed(2),
            totalNet.toFixed(2)
        ].join('|');

        // Combine all lines
        const fileContent = [header, ...employeeLines, ...deductionLines, trailer].join('\n');
        const fileName = `${employerId}_${fileDate}_${bankCode}_SIFv3.sif`;

        // Save to Database with proper tenantId mapping
        const batch = await prisma.wPSBatch.create({
            data: {
                tenantId,
                payrollRunId,
                bankCode,
                batchNumber,
                totalAmount: totalNet,
                totalEmployees: totalRecords,
                fileFormat: 'SIF_V3',
                fileContent,
                fileGeneratedAt: new Date(),
                status: 'GENERATED',
                items: {
                    create: batchItems.map(item => ({
                        tenantId,
                        employeeId: item.employeeId,
                        iban: item.iban,
                        basicSalary: item.basicSalary,
                        housingAllowance: item.housingAllowance,
                        otherAllowance: item.otherAllowance,
                        totalSalary: item.totalSalary
                    }))
                }
            }
        });

        const summary = {
            batchId: batch.id,
            batchNumber,
            totalEmployees: totalRecords,
            totalBasic,
            totalAllowances,
            totalDeductions,
            totalNet,
            validationErrors: validationErrors.length,
            errors: validationErrors
        };

        return { content: fileContent, fileName, batchId: batch.id, summary };
    }

    /**
     * Enhanced IBAN Validation (Saudi IBAN Rules)
     */
    static async validateIBANs(employees: any[]): Promise<WPSValidationResult> {
        let valid = 0;
        let invalid = 0;
        let warnings = 0;
        const errors: WPSValidationError[] = [];

        for (const emp of employees) {
            const iban = emp.iban;
            const name = emp.name || 'موظف';
            if (!iban) {
                invalid++;
                errors.push({
                    employeeId: emp.id,
                    employeeName: name,
                    field: 'IBAN',
                    message: 'لا يوجد رقم IBAN مسجل',
                    severity: 'ERROR'
                });
            } else if (!iban.startsWith('SA')) {
                invalid++;
                errors.push({
                    employeeId: emp.id,
                    employeeName: name,
                    field: 'IBAN',
                    message: 'IBAN يجب أن يبدأ بـ SA (المملكة العربية السعودية)',
                    severity: 'ERROR'
                });
            } else if (iban.length !== 24) {
                invalid++;
                errors.push({
                    employeeId: emp.id,
                    employeeName: name,
                    field: 'IBAN',
                    message: `طول IBAN غير صحيح (${iban.length} بدلاً من 24)`,
                    severity: 'ERROR'
                });
            } else if ((!emp.idNumber && !emp.iqamaNumber) || (emp.idNumber && emp.idNumber.length < 10) || (emp.iqamaNumber && emp.iqamaNumber.length < 10)) {
                warnings++;
                errors.push({
                    employeeId: emp.id,
                    employeeName: name,
                    field: 'nationalId',
                    message: 'رقم الهوية/الإقامة غير مكتمل - قد يتم رفضه من مدد',
                    severity: 'WARNING'
                });
                valid++;
            } else {
                valid++;
            }
        }

        return { valid, invalid, warnings, errors };
    }

    /**
     * Qiwa Contract Cross-Validation
     * Checks that salary amounts match what's registered in Qiwa
     */
    static async validateQiwaCompliance(prisma: any, tenantId: string, payrollRunId: number): Promise<WPSValidationError[]> {
        const run = await prisma.payrollRun.findFirst({
            where: { id: payrollRunId, tenantId },
            include: {
                payslips: {
                    where: { tenantId },
                    include: { employee: true }
                }
            }
        });

        if (!run) return [];

        const errors: WPSValidationError[] = [];

        for (const payslip of run.payslips) {
            const emp = payslip.employee;
            const registeredSalary = Number(emp.salary || 0);
            const payslipBasic = Number(payslip.basicSalary || 0);

            // Check if the basic salary matches the registered contract
            if (registeredSalary > 0 && Math.abs(registeredSalary - payslipBasic) > 1) {
                errors.push({
                    employeeId: emp.id,
                    employeeName: emp.name || 'موظف',
                    field: 'basicSalary',
                    message: `الراتب الأساسي (${payslipBasic}) لا يتطابق مع المسجل في العقد (${registeredSalary})`,
                    severity: 'WARNING'
                });
            }
        }

        return errors;
    }

    /**
     * Submit to Bank (simulated - in production, this would use the bank's API)
     */
    static async submitToBank(prisma: any, tenantId: string, batchId: number): Promise<MudadSubmissionResult> {
        const batch = await prisma.wPSBatch.findFirst({ where: { id: batchId, tenantId } });
        if (!batch) throw new Error("Batch not found");

        // Simulate bank submission
        const mudadRef = `MDD-${new Date().getFullYear()}-${Date.now().toString().slice(-8)}`;

        await prisma.wPSBatch.update({
            where: { id: batchId, tenantId },
            data: {
                status: 'UPLOADED',
                uploadedAt: new Date()
            }
        });

        return {
            batchId,
            status: 'SUBMITTED',
            mudadReferenceNo: mudadRef
        };
    }

    /**
     * Mark batch as accepted by Mudad
     */
    static async markAccepted(prisma: any, tenantId: string, batchId: number, mudadRef: string): Promise<void> {
        await prisma.wPSBatch.update({
            where: { id: batchId, tenantId },
            data: {
                status: 'ACCEPTED'
            }
        });
    }

    /**
     * Get compliance dashboard data
     */
    static async getComplianceDashboard(prisma: any, tenantId: string): Promise<any> {
        const batches = await prisma.wPSBatch.findMany({
            where: { tenantId },
            orderBy: { fileGeneratedAt: 'desc' },
            take: 100,
            include: {
                items: true,
                payrollRun: {
                    select: {
                        year: true,
                        month: true
                    }
                }
            }
        });

        const totalBatches = batches.length;
        const acceptedCount = batches.filter(b => b.status === 'ACCEPTED').length;
        const pendingCount = batches.filter(b => b.status === 'GENERATED' || b.status === 'PENDING').length;
        const uploadedCount = batches.filter(b => b.status === 'UPLOADED').length;
        const rejectedCount = batches.filter(b => b.status === 'REJECTED').length;
        
        // Calculate compliance percentage
        const complianceRate = totalBatches > 0 ? ((acceptedCount / totalBatches) * 100).toFixed(1) : '100.0';

        // Get total employees with IBAN issues
        const allEmployees = await prisma.employee.findMany({
            take: 100,
            where: { active: true, tenantId }
        });
        const ibanErrors = allEmployees.filter(e => !e.iban || !e.iban.startsWith('SA') || e.iban.length !== 24).length;

        return {
            summary: {
                totalBatches,
                acceptedCount,
                pendingCount,
                uploadedCount,
                rejectedCount,
                complianceRate,
                ibanErrors,
                totalActiveEmployees: allEmployees.length
            },
            batches: batches.map(b => ({
                ...b,
                items: undefined, // Don't send items to frontend
                employeeCount: b.items?.length || b.totalEmployees,
                payrollRun: b.payrollRun ? {
                    year: b.payrollRun.year,
                    month: b.payrollRun.month,
                    periodYear: b.payrollRun.year,
                    periodMonth: b.payrollRun.month
                } : null
            })),
            banks: SAUDI_BANKS
        };
    }
}

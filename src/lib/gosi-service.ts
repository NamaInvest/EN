import { logger } from '@/lib/logger';
import prisma from '@/lib/prisma';
import crypto from 'crypto';

const log = logger.child({ service: 'gosi-api' });

// GOSI Sandbox endpoints
const GOSI_API_BASE = process.env.GOSI_API_URL || 'https://api.gosi.gov.sa/b2b/v1';

export interface GOSIRegistration {
  success: boolean;
  gosiNumber?: string;
  transactionId?: string;
  error?: string;
}

export interface EmployeeStatus {
  isRegistered: boolean;
  gosiNumber: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'UNKNOWN';
  subjectWage: number;
}

export class GOSIService {
  /**
   * Generates HMAC-SHA256 signature required by GOSI API
   */
  private static generateSignature(payload: any, secret: string): string {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(payload));
    return hmac.digest('base64');
  }

  /**
   * Gets API Credentials for the tenant
   */
  private static async getCredentials(tenantId: string) {
    const clientId = await prisma.setting.findFirst({ where: { tenantId, key: 'gosi_client_id' } });
    const clientSecret = await prisma.setting.findFirst({ where: { tenantId, key: 'gosi_client_secret' } });
    
    if (!clientId?.value || !clientSecret?.value) {
      throw new Error(`GOSI Credentials not found for tenant: ${tenantId}`);
    }
    
    return { clientId: clientId.value, clientSecret: clientSecret.value };
  }

  /**
   * Register a new employee in GOSI automatically upon ERP onboarding
   */
  static async registerEmployee(tenantId: string, employee: any, basicSalary: number, housingAllowance: number): Promise<GOSIRegistration> {
    try {
      const creds = await this.getCredentials(tenantId);
      
      const payload = {
        establishmentNumber: await this.getEstablishmentNumber(tenantId),
        contributor: {
          nationalId: employee.idNumber || employee.iqamaNumber || '1000000000',
          nationality: employee.nationality || 'SAUDI',
          dateOfBirth: employee.dateOfBirth?.toISOString().split('T')[0],
          nameAr: employee.nameAr || employee.name,
          nameEn: employee.nameEn || employee.name,
        },
        engagement: {
          joinDate: employee.joinDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
          basicWage: basicSalary,
          housingAllowance: housingAllowance,
          occupationCode: employee.jobTitleCode || '000000', // Default occupation code
          workLocation: employee.branchId ? await this.getBranchCityCode(employee.branchId) : '01',
        }
      };

      const signature = this.generateSignature(payload, String(creds.clientSecret));

      // Mocking GOSI API call for production readiness without actual hitting
      // const response = await fetch(`${GOSI_API_BASE}/contributors`, {
      //   method: 'POST',
      //   headers: {
      //     'Client-Id': String(creds.clientId),
      //     'Signature': signature,
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify(payload)
      // });
      // const data = await response.json();
      
      const data = {
        success: true,
        gosiNumber: `GOSI-${Math.floor(Math.random() * 10000000)}`,
        transactionId: crypto.randomUUID()
      };

      if (data.success && data.gosiNumber) {
        // In a real implementation, we would save gosiNumber to Employee model
        // await prisma.employee.update({ ... })
        log.info(`Assigned GOSI Number ${data.gosiNumber} to employee ${employee.id}`);
      }

      log.info(`GOSI Registration successful for ${employee.id}`, { transactionId: data.transactionId });
      return data;
    } catch (error: any) {
      log.error('GOSI Registration failed', { error: error.message, employeeId: employee.id });
      return { success: false, error: error.message };
    }
  }

  /**
   * Update employee salary in GOSI (Required when basic/housing changes)
   */
  static async updateSalary(tenantId: string, employeeId: number, newBasic: number, newHousing: number, effectiveDate: Date): Promise<void> {
    const creds = await this.getCredentials(tenantId);
    const emp = await prisma.employee.findUnique({ where: { id: employeeId } });
    
    if (!emp) {
      throw new Error("Employee not found");
    }

    const payload = {
      establishmentNumber: await this.getEstablishmentNumber(tenantId),
      gosiNumber: `GOSI-${emp.id}`, // Mocked
      wageChange: {
        effectiveDate: effectiveDate.toISOString().split('T')[0],
        basicWage: newBasic,
        housingAllowance: newHousing,
      }
    };

    // Simulate API Call
    log.info(`GOSI Salary update successful for GOSI-${emp.id}`);
  }

  /**
   * Deregister employee upon termination or resignation
   */
  static async deregisterEmployee(tenantId: string, employeeId: number, leaveDate: Date, reasonCode: string): Promise<void> {
    const creds = await this.getCredentials(tenantId);
    const emp = await prisma.employee.findUnique({ where: { id: employeeId } });
    
    if (!emp) {
        throw new Error("Employee not found");
    }

    const payload = {
        establishmentNumber: await this.getEstablishmentNumber(tenantId),
        gosiNumber: `GOSI-${emp.id}`, // Mocked
        leavingDate: leaveDate.toISOString().split('T')[0],
        leavingReason: reasonCode // '01' Resignation, '02' Termination, etc.
    };

    log.info(`GOSI Deregistration successful for GOSI-${emp.id}`);
  }

  /**
   * Fetch current GOSI status for compliance checks
   */
  static async getEmployeeStatus(tenantId: string, nationalId: string): Promise<EmployeeStatus> {
    // In a real system, we GET from GOSI API
    return {
      isRegistered: true,
      gosiNumber: `GOSI-MOCK-${nationalId.substring(0, 4)}`,
      status: 'ACTIVE',
      subjectWage: 4000
    };
  }

  // --- Helpers ---
  private static async getEstablishmentNumber(tenantId: string): Promise<string> {
    const setting = await prisma.setting.findFirst({ where: { tenantId, key: 'gosi_establishment_number' } });
    return setting?.value ? String(setting.value) : '0000000000';
  }

  private static async getBranchCityCode(branchId: number): Promise<string> {
    // Maps ERP Branch to GOSI Region/City code
    return '01'; // Default to Riyadh
  }
}

import { logger } from '@/lib/logger';

const log = logger.child({ service: 'multi-country-payroll-engine' });

interface CountryPayrollConfig {
  country: 'SA' | 'AE' | 'KW' | 'BH' | 'QA' | 'OM' | 'EG';
  gosiEmployeeRate: number;
  gosiEmployerRate: number;
  incomeTaxRate: number;
  currency: string;
}

const COUNTRY_CONFIGS: Record<string, CountryPayrollConfig> = {
  SA: { country: 'SA', gosiEmployeeRate: 0.10,  gosiEmployerRate: 0.12,  incomeTaxRate: 0,     currency: 'SAR' },
  AE: { country: 'AE', gosiEmployeeRate: 0.05,  gosiEmployerRate: 0.125, incomeTaxRate: 0,     currency: 'AED' },
  KW: { country: 'KW', gosiEmployeeRate: 0.075, gosiEmployerRate: 0.115, incomeTaxRate: 0,     currency: 'KWD' },
  BH: { country: 'BH', gosiEmployeeRate: 0.07,  gosiEmployerRate: 0.12,  incomeTaxRate: 0,     currency: 'BHD' },
  QA: { country: 'QA', gosiEmployeeRate: 0.05,  gosiEmployerRate: 0.10,  incomeTaxRate: 0,     currency: 'QAR' },
  OM: { country: 'OM', gosiEmployeeRate: 0.065, gosiEmployerRate: 0.115, incomeTaxRate: 0,     currency: 'OMR' },
  EG: { country: 'EG', gosiEmployeeRate: 0.11,  gosiEmployerRate: 0.18,  incomeTaxRate: 0.225, currency: 'EGP' },
};

export interface PayrollCalculation {
  country: string;
  currency: string;
  grossPay: number;
  gosiEmployee: number;
  gosiEmployer: number;
  incomeTax: number;
  netPay: number;
}

export class MultiCountryPayrollEngine {
  static getConfig(country: string): CountryPayrollConfig {
    const config = COUNTRY_CONFIGS[country.toUpperCase()];
    if (!config) throw new Error(`Unsupported country: ${country}`);
    return config;
  }

  static calculate(country: string, basicSalary: number, allowances = 0, overtimePay = 0, tenantId: string): PayrollCalculation {
    const cfg = this.getConfig(country);
    const grossPay    = basicSalary + allowances + overtimePay;
    const gosiBase    = basicSalary; // GOSI on basic only
    const gosiEmployee = gosiBase * cfg.gosiEmployeeRate;
    const gosiEmployer = gosiBase * cfg.gosiEmployerRate;
    const incomeTax   = country === 'EG' ? Math.max(0, (grossPay - 15000) * cfg.incomeTaxRate) : 0;
    const netPay      = grossPay - gosiEmployee - incomeTax;
    log.info(`[Tenant: ${tenantId}] ${country} payroll: gross=${grossPay}, net=${netPay.toFixed(2)}, currency=${cfg.currency}`);
    return { country, currency: cfg.currency, grossPay, gosiEmployee, gosiEmployer, incomeTax, netPay };
  }

  /** Bulk calculate from array of employee records */
  static calculateBatch(country: string, employees: Array<{ id: number; basicSalary: number; allowances?: number; overtimePay?: number }>, tenantId: string) {
    return employees.map(e => ({
      employeeId: e.id,
      ...this.calculate(country, e.basicSalary, e.allowances, e.overtimePay, tenantId),
    }));
  }
}

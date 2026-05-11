/**
 * Mudad API Integration (موارد / نظام حماية الأجور)
 * ══════════════════════════════════════════════════════
 * Mudad is Saudi Arabia's payroll middleware connecting employers
 * to the Wage Protection System (WPS) via bank networks.
 *
 * This module provides:
 *   1. HMAC-signed API calls to Mudad's sandbox/production endpoints
 *   2. Employer registration status checks
 *   3. Payroll file submission (SIF)
 *   4. Payment status tracking
 *   5. Violation query (non-compliant employees)
 *
 * Docs: https://developer.mudad.com.sa
 * Note: Sandbox base URL is different from production.
 */

import { logger } from '@/lib/logger';
import crypto from 'crypto';

const log = logger.child({ service: 'mudad-api' });

const MUDAD_SANDBOX_URL  = 'https://sandbox.mudad.com.sa/api/v1';
const MUDAD_PROD_URL     = 'https://api.mudad.com.sa/api/v1';

export interface MudadConfig {
  apiKey:        string;
  secretKey:     string;
  employerId:    string;   // MOL Establishment ID
  environment:   'sandbox' | 'production';
}

export interface MudadPayrollFile {
  payrollMonth:    string;   // YYYY-MM
  bankCode:        string;
  sifContent:      string;
  totalAmount:     number;
  totalEmployees:  number;
}

export interface MudadPaymentStatus {
  referenceId:   string;
  status:        'PENDING' | 'PROCESSING' | 'COMPLETED' | 'REJECTED' | 'FAILED';
  processedAt?:  string;
  rejectionCode?: string;
  rejectionMsg?:  string;
  employeeStatuses?: Array<{
    iqamaOrId: string;
    iban:      string;
    amount:    number;
    status:    string;
  }>;
}

export interface MudadEmployerStatus {
  establishmentId:    string;
  complianceStatus:   'COMPLIANT' | 'NON_COMPLIANT' | 'UNDER_REVIEW';
  registrationStatus: 'ACTIVE' | 'SUSPENDED' | 'PENDING';
  lastPayrollDate?:   string;
  violations?:        number;
}

export class MudadAPI {

  private config: MudadConfig;
  private baseUrl: string;

  constructor(config: MudadConfig) {
    this.config  = config;
    this.baseUrl = config.environment === 'production' ? MUDAD_PROD_URL : MUDAD_SANDBOX_URL;
  }

  /** Generate HMAC-SHA256 signature for Mudad API authentication */
  private sign(payload: string): string {
    return crypto
      .createHmac('sha256', this.config.secretKey)
      .update(payload)
      .digest('hex');
  }

  private headers(body: string = ''): Record<string, string> {
    const timestamp = new Date().toISOString();
    const signature = this.sign(`${this.config.apiKey}${timestamp}${body}`);
    return {
      'Content-Type':       'application/json',
      'X-API-Key':          this.config.apiKey,
      'X-Timestamp':        timestamp,
      'X-Signature':        signature,
      'X-Employer-Id':      this.config.employerId,
      'Accept':             'application/json',
    };
  }

  private async request<T>(method: 'GET' | 'POST', path: string, body?: any): Promise<T> {
    const bodyStr = body ? JSON.stringify(body) : '';
    const url     = `${this.baseUrl}${path}`;

    log.info(`Mudad ${method} ${url}`);

    const res = await fetch(url, {
      method,
      headers: this.headers(bodyStr),
      body:    bodyStr || undefined,
    });

    if (!res.ok) {
      const err = await res.text().catch(() => res.statusText);
      log.error(`Mudad API error ${res.status}: ${err}`);
      throw new Error(`Mudad API ${res.status}: ${err}`);
    }

    return res.json() as Promise<T>;
  }

  /** Check employer compliance and registration status */
  async getEmployerStatus(): Promise<MudadEmployerStatus> {
    return this.request<MudadEmployerStatus>('GET', `/employers/${this.config.employerId}/status`);
  }

  /** Submit a SIF payroll file to Mudad */
  async submitPayrollFile(payload: MudadPayrollFile): Promise<{
    referenceId:  string;
    submittedAt:  string;
    status:       string;
    message:      string;
  }> {
    const body = {
      employerId:     this.config.employerId,
      payrollMonth:   payload.payrollMonth,
      bankCode:       payload.bankCode,
      fileContent:    Buffer.from(payload.sifContent).toString('base64'),
      totalAmount:    payload.totalAmount,
      totalEmployees: payload.totalEmployees,
    };

    return this.request('POST', '/payroll/submit', body);
  }

  /** Get payment batch status by reference ID */
  async getPaymentStatus(referenceId: string): Promise<MudadPaymentStatus> {
    return this.request<MudadPaymentStatus>('GET', `/payroll/${referenceId}/status`);
  }

  /** List WPS violations for the employer */
  async getViolations(month?: string): Promise<Array<{
    employeeId:  string;
    iqama:       string;
    name:        string;
    violationType: string;
    amount:      number;
    dueDate:     string;
  }>> {
    const qs = month ? `?month=${month}` : '';
    return this.request('GET', `/employers/${this.config.employerId}/violations${qs}`);
  }

  /** Confirm salary payment (Mudad acknowledgement) */
  async confirmPayment(referenceId: string): Promise<{ confirmed: boolean; confirmedAt: string }> {
    return this.request('POST', `/payroll/${referenceId}/confirm`, { referenceId });
  }

  /** Sandbox: simulate Mudad response for testing */
  static mockResponse(type: 'submit' | 'status' | 'employer'): any {
    if (type === 'submit') {
      return {
        referenceId: `MUDAD-TEST-${Date.now()}`,
        submittedAt: new Date().toISOString(),
        status:      'PROCESSING',
        message:     '[Sandbox] ملف الرواتب في قيد المعالجة',
      };
    }
    if (type === 'status') {
      return {
        referenceId: 'MUDAD-TEST-000',
        status:      'COMPLETED',
        processedAt: new Date().toISOString(),
        employeeStatuses: [],
      };
    }
    return {
      establishmentId:    'TEST-EMPLOYER',
      complianceStatus:   'COMPLIANT',
      registrationStatus: 'ACTIVE',
      lastPayrollDate:    new Date().toISOString(),
      violations:         0,
    };
  }
}

/** Factory: build MudadAPI from DB settings */
export async function getMudadClient(prismaClient: any): Promise<MudadAPI | null> {
  try {
    const settings = await prismaClient.setting.findFirst({
      select: {
        mudadApiKey:   true,
        mudadSecret:   true,
        mudadEmployerId: true,
        mudadEnv:      true,
      },
    });

    if (!settings?.mudadApiKey) {
      log.warn('Mudad API key not configured');
      return null;
    }

    return new MudadAPI({
      apiKey:      settings.mudadApiKey,
      secretKey:   settings.mudadSecret || '',
      employerId:  settings.mudadEmployerId || '',
      environment: (settings.mudadEnv === 'production') ? 'production' : 'sandbox',
    });
  } catch (e) {
    log.error('Failed to initialize Mudad client:', e);
    return null;
  }
}

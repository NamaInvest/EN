import { getProvisioningQueueAdapter } from './provisioning-queue';
import { ProvisioningJobState, ProvisioningJobStep } from './provisioning-job-types';
import { validateSubdomainCandidate } from './reserved-subdomains';
import { logger } from '@/lib/logger';
import { isWorkerEnabled, validateRealWriteAllowed, isDryRunEnabled, acquireProvisioningLock } from './provisioning-guard';
import { Client } from 'pg';
import { exec } from 'child_process';
import { PrismaClient } from '@prisma/client';
import { seedCompanyData } from '@/app/api/tenant/provision/route';

const log = logger.child({ service: 'tenant/provisioning-worker' });

export interface DryRunStepResult {
  provisioningRunId: string;
  correlationId: string;
  step: ProvisioningJobStep;
  status: 'COMPLETED' | 'FAILED';
  startedAt: Date;
  finishedAt: Date;
  durationMs: number;
  dryRun: boolean;
  wouldWrite: boolean;
  writeTarget: string;
  message: string;
  warnings: string[];
}

export interface DryRunResult {
  success: boolean;
  runId: string;
  correlationId: string;
  status: 'READY' | 'FAILED';
  timeline: DryRunStepResult[];
  errorMessage?: string;
  errorCode?: string;
}

function getDbUrl(tenant: string): string {
  const base = process.env.DATABASE_URL;
  if (!base) throw new Error('DATABASE_URL is required');
  return base.replace(/\/([^/?]+)(\?|$)/, `/${tenant}_db$2`);
}

function getMasterDbUrl(): string {
  const base = process.env.DATABASE_URL;
  if (!base) throw new Error('DATABASE_URL is required');
  if (process.env.NODE_ENV === 'test') {
    return base;
  }
  return base.replace(/\/([^/?]+)(\?|$)/, `/n11_db$2`);
}

function getPostgresRootUrl(): string {
  const base = process.env.DATABASE_URL;
  if (!base) throw new Error('DATABASE_URL is required');
  return base.replace(/\/([^/?]+)(\?|$)/, `/postgres$2`);
}

export async function executeRealProvisioningStep(
  step: ProvisioningJobStep,
  subdomain: string,
  runId: string,
  correlationId: string
): Promise<Omit<DryRunStepResult, 'startedAt' | 'finishedAt' | 'durationMs'>> {
  
  if (step === 'VALIDATE_REQUEST') {
    const validation = validateSubdomainCandidate(subdomain);
    if (!validation.valid) {
      throw { message: validation.message, code: validation.code };
    }
    const guard = validateRealWriteAllowed(subdomain, runId);
    if (!guard.allowed) {
      throw { message: guard.message, code: guard.code };
    }
    return {
      provisioningRunId: runId,
      correlationId,
      step,
      status: 'COMPLETED',
      dryRun: false,
      wouldWrite: true,
      writeTarget: 'Security Guards Validation',
      message: 'تم التحقق من الحواجز الأمنية وصلاحية النطاق للعمل الفعلي.',
      warnings: [],
    };
  }

  if (step === 'RESERVE_SUBDOMAIN') {
    const masterPrisma = new PrismaClient({ datasources: { db: { url: getMasterDbUrl() } } });
    const existing = await masterPrisma.tenantAccount.findUnique({ where: { subdomain } });
    await masterPrisma.$disconnect();
    if (existing) {
      throw { message: 'اسم النطاق الفرعي محجوز بالفعل في الماستر.', code: 'SUBDOMAIN_ALREADY_EXISTS' };
    }
    acquireProvisioningLock(subdomain);
    return {
      provisioningRunId: runId,
      correlationId,
      step,
      status: 'COMPLETED',
      dryRun: false,
      wouldWrite: true,
      writeTarget: 'n11_db.TenantAccount check & local locks',
      message: `تم التحقق من عدم حجز النطاق وتأمين القفل للعميل: ${subdomain}`,
      warnings: [],
    };
  }

  if (step === 'CREATE_TENANT_RECORD') {
    const dbName = `${subdomain.toLowerCase()}_db`;
    const client = new Client({ connectionString: getPostgresRootUrl() });
    await client.connect();
    const res = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
    if (res.rowCount === 0) {
      await client.query(`CREATE DATABASE "${dbName}"`);
      try {
        await client.query(`ALTER DATABASE "${dbName}" OWNER TO n11_db`);
        await client.query(`GRANT ALL PRIVILEGES ON DATABASE "${dbName}" TO n11_db`);
      } catch (ownerErr: any) {
        log.warn(`[CREATE_TENANT_RECORD] Failed to alter owner to n11_db, ignoring: ${ownerErr.message}`);
      }
    }
    await client.end();
    return {
      provisioningRunId: runId,
      correlationId,
      step,
      status: 'COMPLETED',
      dryRun: false,
      wouldWrite: true,
      writeTarget: `PostgreSQL database: ${dbName}`,
      message: 'تم إنشاء قاعدة البيانات الفيزيائية للعميل بنجاح.',
      warnings: [],
    };
  }

  if (step === 'VERIFY_SCHEMA') {
    const dbUrl = getDbUrl(subdomain);
    await new Promise<void>((resolve, reject) => {
      exec('npx prisma db push --schema=prisma/schema.prisma --accept-data-loss', {
        env: { ...process.env, DATABASE_URL: dbUrl }
      }, (error: any, stdout: any, stderr: any) => {
        if (error) {
          reject({ message: `Prisma schema push failed: ${stderr || error.message}`, code: 'SCHEMA_PUSH_FAILED' });
        } else {
          resolve();
        }
      });
    });
    return {
      provisioningRunId: runId,
      correlationId,
      step,
      status: 'COMPLETED',
      dryRun: false,
      wouldWrite: true,
      writeTarget: `PostgreSQL schema: ${subdomain}_db`,
      message: 'تم تطبيق جداول المخطط وتأكيد المزامنة لقاعدة بيانات العميل.',
      warnings: [],
    };
  }

  if (step === 'SEED_INITIAL_DATA') {
    const adapter = getProvisioningQueueAdapter();
    const payload = await adapter.getProvisioningJobPayload(runId);
    if (!payload) {
      throw { message: 'تعذر العثور على حمولة الطلب في الطابور للتأسيس الفعلي.', code: 'PAYLOAD_NOT_FOUND' };
    }
    const seedResult = await seedCompanyData({
      subdomain,
      companyNameAr: payload.tenantName,
      companyNameEn: payload.tenantName,
      vatNumber: '',
      crnNumber: '',
      mobile: '',
      city: 'الرياض',
      district: '',
      address: '',
      buildingNo: '',
      postalCode: '',
      businessDomain: '',
      branchName: 'الفرع الرئيسي',
      zatcaBranchNameEn: 'Main Branch',
      zatcaCityEn: 'Riyadh',
      clerkEmail: payload.ownerEmail,
      password: payload.password || 'admin7773',
      adminName: payload.ownerName,
      username: payload.username,
    });
    if (!seedResult.ok) {
      throw { message: `فشل زرع البيانات المحاسبية ودليل SOCPA: ${seedResult.error}`, code: 'SEED_DATA_FAILED' };
    }
    return {
      provisioningRunId: runId,
      correlationId,
      step,
      status: 'COMPLETED',
      dryRun: false,
      wouldWrite: true,
      writeTarget: `PostgreSQL seed: SOCPA CoA on ${subdomain}_db`,
      message: 'تم زرع دليل الحسابات والبيانات الافتراضية للشركة.',
      warnings: [],
    };
  }

  if (step === 'CREATE_OWNER_USER' || step === 'CREATE_DEFAULT_ROLES' || step === 'CONFIGURE_SUBDOMAIN') {
    return {
      provisioningRunId: runId,
      correlationId,
      step,
      status: 'COMPLETED',
      dryRun: false,
      wouldWrite: true,
      writeTarget: 'Skip (seeded in previous step)',
      message: `تم تنفيذ الخطوة (${step}) تلقائياً مع خطوة بذر البيانات المحاسبية.`,
      warnings: [],
    };
  }

  if (step === 'VERIFY_TENANT_HEALTH') {
    const dbUrl = getDbUrl(subdomain);
    const tenantPrisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });
    try {
      await tenantPrisma.user.findFirst();
    } catch (e: any) {
      throw { message: `فشل الاتصال بقاعدة بيانات العميل: ${e.message}`, code: 'HEALTH_CHECK_FAILED' };
    } finally {
      await tenantPrisma.$disconnect();
    }
    return {
      provisioningRunId: runId,
      correlationId,
      step,
      status: 'COMPLETED',
      dryRun: false,
      wouldWrite: false,
      writeTarget: 'None',
      message: 'تم فحص الاستجابة والاتصال بقاعدة بيانات العميل بنجاح.',
      warnings: [],
    };
  }

  if (step === 'MARK_READY') {
    const adapter = getProvisioningQueueAdapter();
    const payload = await adapter.getProvisioningJobPayload(runId);
    if (!payload) {
      throw { message: 'تعذر العثور على حمولة الطلب في الطابور للتأسيس الفعلي.', code: 'PAYLOAD_NOT_FOUND' };
    }
    const masterPrisma = new PrismaClient({ datasources: { db: { url: getMasterDbUrl() } } });
    const account = await masterPrisma.tenantAccount.upsert({
      where: { userEmail: payload.ownerEmail },
      update: {
        subdomain,
        status: 'active',
        orgName: payload.tenantName,
        vatNumber: '',
        subscriptionStatus: 'trial',
        trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      create: {
        userEmail: payload.ownerEmail,
        orgName: payload.tenantName,
        vatNumber: '',
        subdomain,
        status: 'active',
        subscriptionStatus: 'trial',
        trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    await masterPrisma.desktopLicense.create({
      data: {
        licenseKey: `TRIAL-${subdomain}-${Date.now()}`,
        tenantAccountId: account.id,
        status: 'trial',
        trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        companyNameAr: payload.tenantName,
        contactEmail: payload.ownerEmail,
        activatedAt: new Date(),
      }
    });
    await masterPrisma.$disconnect();
    return {
      provisioningRunId: runId,
      correlationId,
      step,
      status: 'COMPLETED',
      dryRun: false,
      wouldWrite: true,
      writeTarget: 'n11_db.TenantAccount & n11_db.DesktopLicense records',
      message: 'تم تفعيل حساب المستأجر بالكامل وإصدار رخصة ديسكتوب تجريبية.',
      warnings: [],
    };
  }

  throw new Error(`Unknown step: ${step}`);
}

export function validateWorkerDryRunInput(subdomain: string): { valid: boolean; code: string; message: string } {
  return validateSubdomainCandidate(subdomain);
}

export async function executeProvisioningStepDryRun(
  step: ProvisioningJobStep,
  subdomain: string,
  runId: string,
  correlationId: string
): Promise<Omit<DryRunStepResult, 'startedAt' | 'finishedAt' | 'durationMs'>> {
  const warnings: string[] = [];
  
  if (step === 'VALIDATE_REQUEST') {
    const validation = validateWorkerDryRunInput(subdomain);
    if (!validation.valid) {
      throw { message: validation.message, code: validation.code };
    }
    return {
      provisioningRunId: runId,
      correlationId,
      step,
      status: 'COMPLETED',
      dryRun: true,
      wouldWrite: false,
      writeTarget: 'None',
      message: 'تم التحقق من صحة النطاق الفرعي والبيانات الممررة بنجاح.',
      warnings,
    };
  }

  // Simulated failures for testing
  if (step === 'CREATE_TENANT_RECORD' && subdomain.includes('fail-db')) {
    throw { message: 'تعذر إعداد قاعدة البيانات للمستأجر (خطأ محاكاة).', code: 'DATABASE_CREATION_FAILED' };
  }
  if (step === 'SEED_INITIAL_DATA' && subdomain.includes('fail-seed')) {
    throw { message: 'فشل زرع البيانات المحاسبية ودليل الحسابات SOCPA.', code: 'SEED_DATA_FAILED' };
  }
  if (step === 'VERIFY_TENANT_HEALTH' && subdomain.includes('fail-health')) {
    throw { message: 'المنشأة غير مستقرة، فشل فحص الاستجابة الصحي.', code: 'HEALTH_CHECK_FAILED' };
  }

  switch (step) {
    case 'RESERVE_SUBDOMAIN':
      return {
        provisioningRunId: runId,
        correlationId,
        step,
        status: 'COMPLETED',
        dryRun: true,
        wouldWrite: true,
        writeTarget: 'InMemory Lock (provisioningLocks) & Redis lock',
        message: `محاكاة حجز النطاق الفرعي: ${subdomain}`,
        warnings,
      };
    case 'CREATE_TENANT_RECORD':
      return {
        provisioningRunId: runId,
        correlationId,
        step,
        status: 'COMPLETED',
        dryRun: true,
        wouldWrite: true,
        writeTarget: 'n11_db.TenantAccount record',
        message: 'محاكاة إنشاء سجل الحساب للمستأجر في قاعدة الماستر.',
        warnings,
      };
    case 'VERIFY_SCHEMA':
      return {
        provisioningRunId: runId,
        correlationId,
        step,
        status: 'COMPLETED',
        dryRun: true,
        wouldWrite: false,
        writeTarget: 'None',
        message: 'محاكاة التحقق من مجلد النشر ومخطط البيانات على السيرفر.',
        warnings,
      };
    case 'SEED_INITIAL_DATA':
      return {
        provisioningRunId: runId,
        correlationId,
        step,
        status: 'COMPLETED',
        dryRun: true,
        wouldWrite: true,
        writeTarget: `PostgreSQL database: ${subdomain}_db`,
        message: 'محاكاة إنشاء قاعدة البيانات الفيزيائية للمستأجر.',
        warnings,
      };
    case 'CREATE_OWNER_USER':
      return {
        provisioningRunId: runId,
        correlationId,
        step,
        status: 'COMPLETED',
        dryRun: true,
        wouldWrite: true,
        writeTarget: 'PostgreSQL schema structures & SOCPA Chart of Accounts',
        message: 'محاكاة تطبيق جداول المخطط وزرع دليل الحسابات الافتراضي.',
        warnings,
      };
    case 'CREATE_DEFAULT_ROLES':
      return {
        provisioningRunId: runId,
        correlationId,
        step,
        status: 'COMPLETED',
        dryRun: true,
        wouldWrite: true,
        writeTarget: `${subdomain}_db.User record (Admin User)`,
        message: 'محاكاة إنشاء المستخدم المدير الأول وحفظ كلمة المرور المشفرة.',
        warnings,
      };
    case 'CONFIGURE_SUBDOMAIN':
      return {
        provisioningRunId: runId,
        correlationId,
        step,
        status: 'COMPLETED',
        dryRun: true,
        wouldWrite: true,
        writeTarget: `${subdomain}_db.Role records`,
        message: 'محاكاة إعداد الصلاحيات والأدوار الافتراضية للفروع.',
        warnings,
      };
    case 'VERIFY_TENANT_HEALTH':
      return {
        provisioningRunId: runId,
        correlationId,
        step,
        status: 'COMPLETED',
        dryRun: true,
        wouldWrite: false,
        writeTarget: 'None',
        message: 'محاكاة فحص استجابة قاعدة البيانات ومنافذ الاتصال للعميل.',
        warnings,
      };
    case 'MARK_READY':
      return {
        provisioningRunId: runId,
        correlationId,
        step,
        status: 'COMPLETED',
        dryRun: true,
        wouldWrite: true,
        writeTarget: 'n11_db.TenantAccount activation status',
        message: 'محاكاة تفعيل الحساب وإصدار رخصة تجريبية للمستأجر.',
        warnings,
      };
    default:
      throw new Error(`Unknown step: ${step}`);
  }
}

export async function runProvisioningWorkerDryRun(
  payload: {
    provisioningRunId: string;
    requestedSubdomain: string;
    correlationId?: string;
  },
  options: { realWrites?: boolean } = {}
): Promise<DryRunResult> {
  if (options.realWrites) {
    const guard = validateRealWriteAllowed(payload.requestedSubdomain, payload.provisioningRunId);
    if (!guard.allowed) {
      throw { message: guard.message, code: guard.code };
    }
    throw new Error('REAL_PROVISIONING_WORKER_DISABLED');
  }

  const runId = payload.provisioningRunId;
  const correlationId = payload.correlationId || runId;
  const subdomain = payload.requestedSubdomain;

  const steps: ProvisioningJobStep[] = [
    'VALIDATE_REQUEST',
    'RESERVE_SUBDOMAIN',
    'CREATE_TENANT_RECORD',
    'VERIFY_SCHEMA',
    'SEED_INITIAL_DATA',
    'CREATE_OWNER_USER',
    'CREATE_DEFAULT_ROLES',
    'CONFIGURE_SUBDOMAIN',
    'VERIFY_TENANT_HEALTH',
    'MARK_READY',
  ];

  const timeline: DryRunStepResult[] = [];

  for (const step of steps) {
    const startedAt = new Date();
    try {
      const stepResult = await executeProvisioningStepDryRun(step, subdomain, runId, correlationId);
      const finishedAt = new Date();
      timeline.push({
        ...stepResult,
        startedAt,
        finishedAt,
        durationMs: finishedAt.getTime() - startedAt.getTime(),
      } as DryRunStepResult);
    } catch (err: any) {
      const finishedAt = new Date();
      timeline.push({
        provisioningRunId: runId,
        correlationId,
        step,
        status: 'FAILED',
        startedAt,
        finishedAt,
        durationMs: finishedAt.getTime() - startedAt.getTime(),
        dryRun: true,
        wouldWrite: false,
        writeTarget: 'None',
        message: err.message || 'Unknown step failure',
        warnings: [],
      });

      return {
        success: false,
        runId,
        correlationId,
        status: 'FAILED',
        timeline,
        errorMessage: err.message,
        errorCode: err.code || 'STEP_FAILURE',
      };
    }
  }

  return {
    success: true,
    runId,
    correlationId,
    status: 'READY',
    timeline,
  };
}

export class InMemoryProvisioningWorker {
  private intervalId: NodeJS.Timeout | null = null;
  private isProcessing = false;
  private stepDelayMs = 50;

  start() {
    if (this.intervalId) return;
    
    if (!isWorkerEnabled()) {
      log.warn('[InMemoryWorker] Background provisioning worker is disabled in configurations.');
      return;
    }
    
    log.info('[InMemoryWorker] Starting background provisioning worker...');
    
    this.intervalId = setInterval(async () => {
      if (this.isProcessing) return;
      
      if (!isWorkerEnabled()) {
        log.warn('[InMemoryWorker] Provisioning worker has been dynamically disabled. Stopping polling.');
        this.stop();
        return;
      }
      
      await this.processPendingJobs();
    }, 100);
  }

  stop() {
    if (this.intervalId) {
      log.info('[InMemoryWorker] Stopping background provisioning worker...');
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private async processPendingJobs() {
    if (!isWorkerEnabled()) return;
    this.isProcessing = true;
    try {
      const adapter = getProvisioningQueueAdapter() as any;
      if (!adapter || typeof adapter.listProvisioningJobs !== 'function') {
        return;
      }

      const jobs: ProvisioningJobState[] = await adapter.listProvisioningJobs();
      const activeJobs = jobs.filter(j => j.status === 'PENDING' || j.status === 'RETRYING');

      for (const job of activeJobs) {
        await this.processJob(adapter, job);
      }
    } catch (err: any) {
      log.error('[InMemoryWorker] Error processing jobs:', err);
    } finally {
      this.isProcessing = false;
    }
  }

  private async processJob(adapter: any, job: ProvisioningJobState) {
    const runId = job.runId;
    log.info(`[InMemoryWorker] Starting job ${runId} for subdomain ${job.subdomain}`);

    const steps: ProvisioningJobStep[] = [
      'VALIDATE_REQUEST',
      'RESERVE_SUBDOMAIN',
      'CREATE_TENANT_RECORD',
      'VERIFY_SCHEMA',
      'SEED_INITIAL_DATA',
      'CREATE_OWNER_USER',
      'CREATE_DEFAULT_ROLES',
      'CONFIGURE_SUBDOMAIN',
      'VERIFY_TENANT_HEALTH',
      'MARK_READY',
    ];

    adapter.__updateJobState(runId, {
      status: 'PROVISIONING',
      startedAt: new Date(),
    }, [
      { step: 'VALIDATE_REQUEST', status: 'PROVISIONING' }
    ]);

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      adapter.__updateJobState(runId, { currentStep: step });

      await new Promise(resolve => setTimeout(resolve, this.stepDelayMs));

      try {
        await this.executeStep(step, job.subdomain, runId);
        
        adapter.__updateJobState(runId, {}, [
          { step, status: 'COMPLETED' }
        ]);

      } catch (err: any) {
        log.error(`[InMemoryWorker] Job ${runId} failed at step ${step}: ${err.message}`);
        
        adapter.__updateJobState(runId, {
          status: 'FAILED',
          currentStep: step,
          failedAt: new Date(),
          lastErrorCode: err.code || 'STEP_FAILURE',
          lastErrorMessage: err.message,
        }, [
          { step, status: 'FAILED' }
        ]);
        return;
      }
    }

    adapter.__updateJobState(runId, {
      status: 'READY',
      currentStep: 'MARK_READY',
      completedAt: new Date(),
    }, [
      { step: 'MARK_READY', status: 'READY' }
    ]);

    log.info(`[InMemoryWorker] Job ${runId} completed successfully!`);
  }

  private async executeStep(step: ProvisioningJobStep, subdomain: string, runId: string): Promise<void> {
    const isReal = !isDryRunEnabled();

    if (isReal) {
      const res = await executeRealProvisioningStep(step, subdomain, runId, runId);
      if (res.status === 'FAILED') {
        throw new Error(res.message);
      }
      return;
    }

    if (step === 'VALIDATE_REQUEST') {
      const validation = validateSubdomainCandidate(subdomain);
      if (!validation.valid) {
        const err = new Error(validation.message) as any;
        err.code = validation.code;
        throw err;
      }
    }

    if (step === 'CREATE_TENANT_RECORD' && subdomain.includes('fail-db')) {
      const err = new Error('تعذر إعداد قاعدة البيانات للمستأجر (خطأ محاكاة).') as any;
      err.code = 'DATABASE_CREATION_FAILED';
      throw err;
    }

    if (step === 'SEED_INITIAL_DATA' && subdomain.includes('fail-seed')) {
      const err = new Error('فشل زرع البيانات المحاسبية ودليل الحسابات SOCPA.') as any;
      err.code = 'SEED_DATA_FAILED';
      throw err;
    }

    if (step === 'VERIFY_TENANT_HEALTH' && subdomain.includes('fail-health')) {
      const err = new Error('المنشأة غير مستقرة، فشل فحص الاستجابة الصحي.') as any;
      err.code = 'HEALTH_CHECK_FAILED';
      throw err;
    }
  }
}

let workerInstance: InMemoryProvisioningWorker | null = null;

export function startProvisioningWorker() {
  if (!workerInstance) {
    workerInstance = new InMemoryProvisioningWorker();
  }
  workerInstance.start();
}

export function stopProvisioningWorker() {
  if (workerInstance) {
    workerInstance.stop();
    workerInstance = null;
  }
}

import { getProvisioningQueueAdapter } from './provisioning-queue';
import { ProvisioningJobState, ProvisioningJobStep } from './provisioning-job-types';
import { validateSubdomainCandidate } from './reserved-subdomains';
import { logger } from '@/lib/logger';
import { isWorkerEnabled, validateRealWriteAllowed } from './provisioning-guard';

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
      });
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
  private stepDelayMs = 50; // simulated step execution delay

  start() {
    if (this.intervalId) return;
    
    if (!isWorkerEnabled()) {
      log.warn('[InMemoryWorker] Background provisioning worker is disabled in configurations.');
      return;
    }
    
    log.info('[InMemoryWorker] Starting background provisioning worker...');
    
    // Poll the queue every 100ms for PENDING or RETRYING jobs
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

    // Steps list in order
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

    // Transition to active processing status
    adapter.__updateJobState(runId, {
      status: 'PROVISIONING',
      startedAt: new Date(),
    }, [
      { step: 'VALIDATE_REQUEST', status: 'PROVISIONING' }
    ]);

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      adapter.__updateJobState(runId, { currentStep: step });

      // Simulated step execution delay
      await new Promise(resolve => setTimeout(resolve, this.stepDelayMs));

      try {
        await this.executeStep(step, job.subdomain);
        
        // Log step completion to timeline
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
        return; // Stop processing this job
      }
    }

    // Mark job as READY upon complete success
    adapter.__updateJobState(runId, {
      status: 'READY',
      currentStep: 'MARK_READY',
      completedAt: new Date(),
    }, [
      { step: 'MARK_READY', status: 'READY' }
    ]);

    log.info(`[InMemoryWorker] Job ${runId} completed successfully!`);
  }

  private async executeStep(step: ProvisioningJobStep, subdomain: string): Promise<void> {
    // 1. Validation Step
    if (step === 'VALIDATE_REQUEST') {
      const validation = validateSubdomainCandidate(subdomain);
      if (!validation.valid) {
        const err = new Error(validation.message) as any;
        err.code = validation.code;
        throw err;
      }
    }

    // 2. Simulated failure triggers for testing and retry checks
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

    // All other steps are simulated as instant passes
  }
}

// Singleton worker instance
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

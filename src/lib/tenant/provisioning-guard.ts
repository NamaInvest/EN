// Process-local in-memory lock registry to prevent concurrent provisioning requests for the same subdomain.
export const provisioningLocks = new Set<string>();

/**
 * Tries to acquire a lock for the given subdomain.
 * @param subdomain The subdomain candidate to lock.
 * @returns true if lock was acquired successfully, false if already locked.
 */
export function acquireProvisioningLock(subdomain: string): boolean {
  if (!subdomain) return false;
  const normalized = subdomain.toLowerCase().trim();
  if (provisioningLocks.has(normalized)) {
    return false;
  }
  provisioningLocks.add(normalized);
  return true;
}

/**
 * Releases the lock for the given subdomain.
 * @param subdomain The subdomain to unlock.
 */
export function releaseProvisioningLock(subdomain: string): void {
  if (!subdomain) return;
  const normalized = subdomain.toLowerCase().trim();
  provisioningLocks.delete(normalized);
}

// ─── Feature Flags & Env Config (Strict Fail-Closed Defaults) ───────────────

export function isQueueEnabled(): boolean {
  return process.env.CUSTOMER_ONBOARDING_QUEUE_ENABLED === 'true';
}

export function isWorkerEnabled(): boolean {
  return process.env.CUSTOMER_ONBOARDING_WORKER_ENABLED === 'true';
}

export function isDryRunEnabled(): boolean {
  // Defaults to true (simulation only) unless explicitly set to 'false'
  return process.env.CUSTOMER_ONBOARDING_WORKER_DRY_RUN !== 'false';
}

export function isRealWritesEnabled(): boolean {
  return process.env.CUSTOMER_ONBOARDING_PROVISIONING_REAL_WRITES_ENABLED === 'true';
}

export function getAllowedEnv(): string {
  return process.env.CUSTOMER_ONBOARDING_WORKER_ALLOWED_ENV || 'development';
}

export function getMaxConcurrency(): number {
  const val = parseInt(process.env.CUSTOMER_ONBOARDING_WORKER_MAX_CONCURRENCY || '1', 10);
  return isNaN(val) ? 1 : val;
}

export interface GuardResult {
  allowed: boolean;
  code: string;
  message: string;
}

/**
 * Multi-layer security guard that validates permissions before executing any real provisioning writes.
 * Ensures the system fails closed by default.
 */
export function validateRealWriteAllowed(subdomain: string, runId: string): GuardResult {
  // 1. Base Param Validation
  if (!runId) {
    return {
      allowed: false,
      code: 'RUN_ID_REQUIRED',
      message: 'معرف تشغيل العملية (runId) مطلوب لإثبات صحة الطلب.',
    };
  }

  if (!subdomain) {
    return {
      allowed: false,
      code: 'SUBDOMAIN_REQUIRED',
      message: 'اسم النطاق الفرعي مطلوب لإتمام عملية الفحص.',
    };
  }

  // 2. Runtime Kill Switch
  if (process.env.CUSTOMER_ONBOARDING_KILL_SWITCH === 'true') {
    return {
      allowed: false,
      code: 'KILL_SWITCH_ACTIVE',
      message: 'تم تفعيل مفتاح الإيقاف الطارئ (Kill Switch). المعالجة الحقيقية معطلة بالكامل.',
    };
  }

  // 3. Queue & Worker Activation Check
  if (!isWorkerEnabled()) {
    return {
      allowed: false,
      code: 'WORKER_DISABLED',
      message: 'عامل التأسيس الخلفي (Worker) معطل حالياً في هذا النطاق.',
    };
  }

  // 4. Dry-Run Check (Strict safety default)
  if (isDryRunEnabled()) {
    return {
      allowed: false,
      code: 'DRY_RUN_ENABLED',
      message: 'وضع المحاكاة (Dry-Run) مفعل. الكتابة الفعلية في قاعدة البيانات محظورة.',
    };
  }

  // 5. Real Writes Feature Flag
  if (!isRealWritesEnabled()) {
    return {
      allowed: false,
      code: 'REAL_WRITES_DISABLED',
      message: 'الكتابة الحقيقية غير مصرح بها حالياً عبر إعدادات النظام.',
    };
  }

  // 6. Env Matching & Production Fail-Closed
  const currentEnv = process.env.NODE_ENV || 'production'; // Fallback to production to be safe
  const allowedEnv = getAllowedEnv();
  if (currentEnv !== allowedEnv) {
    return {
      allowed: false,
      code: 'ENVIRONMENT_MISMATCH',
      message: `البيئة الحالية (${currentEnv}) لا تتطابق مع البيئة المصرح بها للتأسيس الحقيقي (${allowedEnv}).`,
    };
  }

  // 7. Explicit Allowlist Check (Strict Single-Tenant Enforcement - Mandatory)
  const allowlistEnv = process.env.CUSTOMER_ONBOARDING_ALLOWLIST;
  if (!allowlistEnv) {
    return {
      allowed: false,
      code: 'SUBDOMAIN_NOT_ALLOWED',
      message: 'قائمة النطاقات الفرعية المسموح بها غير متوفرة. التأسيس الحقيقي محظور تلقائياً (Fail-Closed).',
    };
  }

  const allowedSubdomains = allowlistEnv.split(',').map(s => s.trim().toLowerCase());
  if (!allowedSubdomains.includes(subdomain.toLowerCase())) {
    return {
      allowed: false,
      code: 'SUBDOMAIN_NOT_ALLOWED',
      message: 'النطاق الفرعي المطلوب غير مدرج في قائمة النطاقات المسموح لها بالتأسيس الحقيقي حالياً.',
    };
  }

  return {
    allowed: true,
    code: '',
    message: 'التأسيس الحقيقي مسموح به ومصرح به.',
  };
}


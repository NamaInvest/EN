/**
 * Environment Variables Validator
 * ══════════════════════════════════════════════════════════════════════════════
 * Validates all required and optional environment variables at startup.
 * Called from: instrumentation.ts or middleware.ts
 *
 * Usage:
 *   import { validateEnvironment } from '@/lib/env-validator';
 *   validateEnvironment();  // throws EnvValidationError if critical vars missing
 *
 * Categories:
 *   CRITICAL  — App crashes without these
 *   IMPORTANT — Degraded functionality (warnings logged)
 *   OPTIONAL  — Nice to have (info logged if missing)
 */

import { logger } from '@/lib/logger';

const log = logger.child({ service: 'env-validator' });

// ─── Variable Definitions ─────────────────────────────────────────────────────

interface EnvVar {
  key:         string;
  severity:    'CRITICAL' | 'IMPORTANT' | 'OPTIONAL';
  description: string;
  validator?:  (value: string) => boolean;
  hint?:       string;
}

const ENV_VARS: EnvVar[] = [
  // ── Database ──────────────────────────────────────────────────────────────
  {
    key:         'DATABASE_URL',
    severity:    'CRITICAL',
    description: 'Prisma database connection string',
    validator:   (v) => v.startsWith('postgresql://') || v.startsWith('mysql://') || v.startsWith('mongodb'),
    hint:        'postgresql://user:password@host:5432/namasoft',
  },

  // ── Auth ──────────────────────────────────────────────────────────────────
  {
    key:         'JWT_SECRET',
    severity:    'CRITICAL',
    description: 'JWT signing secret (min 32 chars)',
    validator:   (v) => v.length >= 32,
    hint:        'Generate: openssl rand -hex 32',
  },
  {
    key:         'NEXTAUTH_SECRET',
    severity:    'IMPORTANT',
    description: 'NextAuth.js secret',
    hint:        'Same as JWT_SECRET or separate secret',
  },
  {
    key:         'NEXTAUTH_URL',
    severity:    'IMPORTANT',
    description: 'Base URL of the application',
    validator:   (v) => v.startsWith('http'),
    hint:        'https://your-domain.com',
  },

  // ── Cron ──────────────────────────────────────────────────────────────────
  {
    key:         'CRON_SECRET',
    severity:    'IMPORTANT',
    description: 'Secret for authorizing cron endpoint calls',
    validator:   (v) => v.length >= 16,
    hint:        'Generate: openssl rand -hex 16',
  },

  // ── Telegram Notifications ────────────────────────────────────────────────
  {
    key:         'TELEGRAM_BOT_TOKEN',
    severity:    'IMPORTANT',
    description: 'Telegram Bot API token for alerts',
    hint:        'Get from @BotFather on Telegram',
  },
  {
    key:         'TELEGRAM_ADMIN_CHAT_ID',
    severity:    'IMPORTANT',
    description: 'Telegram chat ID for admin alerts',
    hint:        'Use @userinfobot to find your chat ID',
  },

  // ── ZATCA ─────────────────────────────────────────────────────────────────
  {
    key:         'ZATCA_API_URL',
    severity:    'IMPORTANT',
    description: 'ZATCA e-invoicing API base URL',
    hint:        'https://gw-fatoora.zatca.gov.sa/e-invoicing/developer-portal',
  },
  {
    key:         'ZATCA_CCSID',
    severity:    'IMPORTANT',
    description: 'ZATCA Compliance CSID (from onboarding)',
    hint:        'Obtained after ZATCA CSR onboarding',
  },
  {
    key:         'ZATCA_API_SECRET',
    severity:    'IMPORTANT',
    description: 'ZATCA API secret',
    hint:        'Obtained after ZATCA onboarding',
  },
  {
    key:         'ZATCA_VAT_NUMBER',
    severity:    'IMPORTANT',
    description: 'Seller VAT registration number (15 digits)',
    validator:   (v) => /^\d{15}$/.test(v),
    hint:        'Example: 300012345600003',
  },

  // ── Storage ───────────────────────────────────────────────────────────────
  {
    key:         'STORAGE_BUCKET',
    severity:    'OPTIONAL',
    description: 'S3/GCS bucket for document storage',
  },
  {
    key:         'STORAGE_ACCESS_KEY',
    severity:    'OPTIONAL',
    description: 'Cloud storage access key',
  },

  // ── Email ─────────────────────────────────────────────────────────────────
  {
    key:         'SMTP_HOST',
    severity:    'OPTIONAL',
    description: 'SMTP server for email sending',
  },
  {
    key:         'SMTP_USER',
    severity:    'OPTIONAL',
    description: 'SMTP username',
  },

  // ── AI / LLM ─────────────────────────────────────────────────────────────
  {
    key:         'GEMINI_API_KEY',
    severity:    'OPTIONAL',
    description: 'Google Gemini API key (for AI-CFO module)',
  },
  {
    key:         'OPENAI_API_KEY',
    severity:    'OPTIONAL',
    description: 'OpenAI API key (alternative AI provider)',
  },

  // ── Monitoring ───────────────────────────────────────────────────────────
  {
    key:         'SENTRY_DSN',
    severity:    'OPTIONAL',
    description: 'Sentry error tracking DSN',
  },
];

// ─── Error ────────────────────────────────────────────────────────────────────

export class EnvValidationError extends Error {
  constructor(public readonly missing: string[]) {
    super(`Critical environment variables missing: ${missing.join(', ')}`);
    this.name = 'EnvValidationError';
  }
}

// ─── Validator ────────────────────────────────────────────────────────────────

export function validateEnvironment(opts: { throwOnCritical?: boolean } = {}): {
  ok:        boolean;
  critical:  string[];
  important: string[];
  optional:  string[];
  invalid:   { key: string; hint: string }[];
} {
  const critical:  string[] = [];
  const important: string[] = [];
  const optional:  string[] = [];
  const invalid:   { key: string; hint: string }[] = [];

  for (const def of ENV_VARS) {
    const value = process.env[def.key];

    if (!value) {
      if (def.severity === 'CRITICAL')  critical.push(def.key);
      if (def.severity === 'IMPORTANT') important.push(def.key);
      if (def.severity === 'OPTIONAL')  optional.push(def.key);
      continue;
    }

    // Validate format if validator provided
    if (def.validator && !def.validator(value)) {
      invalid.push({ key: def.key, hint: def.hint ?? 'Check the value format' });
    }
  }

  // Log results
  if (critical.length > 0) {
    log.error('🔴 CRITICAL env vars missing — app will not function:', { missing: critical });
  }
  if (important.length > 0) {
    log.warn('🟡 IMPORTANT env vars missing — some features degraded:', { missing: important });
  }
  if (optional.length > 0) {
    log.info('⚪ Optional env vars not set:', { missing: optional });
  }
  if (invalid.length > 0) {
    log.warn('⚠️ Env vars with invalid format:', { invalid });
  }
  if (critical.length === 0 && important.length === 0) {
    log.info('✅ All required environment variables are set');
  }

  const result = {
    ok:       critical.length === 0,
    critical,
    important,
    optional,
    invalid,
  };

  if (opts.throwOnCritical && critical.length > 0) {
    throw new EnvValidationError(critical);
  }

  return result;
}

// ─── Startup check for GET /api/health ────────────────────────────────────────

export function getEnvSummary(): Record<string, 'SET' | 'MISSING' | 'INVALID'> {
  const summary: Record<string, 'SET' | 'MISSING' | 'INVALID'> = {};
  for (const def of ENV_VARS) {
    const value = process.env[def.key];
    if (!value) {
      summary[def.key] = 'MISSING';
    } else if (def.validator && !def.validator(value)) {
      summary[def.key] = 'INVALID';
    } else {
      summary[def.key] = 'SET';
    }
  }
  return summary;
}

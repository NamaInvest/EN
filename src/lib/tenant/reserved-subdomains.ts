export const RESERVED_SUBDOMAINS = new Set([
  'admin',
  'api',
  'www',
  'mail',
  'smtp',
  'imap',
  'pop',
  'support',
  'help',
  'status',
  'security',
  'privacy',
  'terms',
  'legal',
  'master',
  'master-panel',
  'dashboard',
  'login',
  'logout',
  'signup',
  'sign-up',
  'signin',
  'sign-in',
  'root',
  'system',
  'tenant',
  'tenants',
  'app',
  'apps',
  'static',
  'assets',
  'cdn',
  'ftp',
  'ssh',
  'sftp',
  'test',
  'demo',
  'dev',
  'development',
  'staging',
  'stage',
  'prod',
  'production',
  'namainvist',
  'nama',
  'n1',
  'n11',
  'main',
  'portal',
  'billing',
  'invoices',
  'accounts',
  'accounting',
  'sales',
  'hr',
  'pos',
  'inventory',
  'warehouse',
  'manufacturing',
  'pharmacy',
  'api-docs',
  'docs',
  'doc',
  'robots',
  'favicon',
  '_next',
  'next',
  'vercel',
  'localhost',
]);

export function normalizeSubdomainCandidate(name: string): string {
  if (typeof name !== 'string') return '';
  return name.toLowerCase().trim();
}

export function isReservedSubdomain(subdomain: string): boolean {
  const normalized = normalizeSubdomainCandidate(subdomain);
  return RESERVED_SUBDOMAINS.has(normalized);
}

export function validateSubdomainCandidate(subdomain: string): {
  valid: boolean;
  code: string;
  message: string;
} {
  if (!subdomain) {
    return {
      valid: false,
      code: 'REQUIRED_SUBDOMAIN',
      message: 'اسم النطاق الفرعي مطلوب.',
    };
  }

  const normalized = normalizeSubdomainCandidate(subdomain);

  if (!normalized) {
    return {
      valid: false,
      code: 'REQUIRED_SUBDOMAIN',
      message: 'اسم النطاق الفرعي مطلوب.',
    };
  }

  if (normalized.length < 3) {
    return {
      valid: false,
      code: 'SUBDOMAIN_TOO_SHORT',
      message: 'اسم النطاق الفرعي يجب أن يتكون من 3 رموز على الأقل.',
    };
  }

  if (normalized.length > 20) {
    return {
      valid: false,
      code: 'SUBDOMAIN_TOO_LONG',
      message: 'اسم النطاق الفرعي يجب ألا يتجاوز 20 رمزاً.',
    };
  }

  // Strict check on format: letters, numbers, and hyphens. No spaces, underscores, dots, or unicode.
  // Must start and end with a letter or number. No double hyphens.
  const subdomainRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;
  if (!subdomainRegex.test(normalized)) {
    return {
      valid: false,
      code: 'INVALID_SUBDOMAIN',
      message: 'اسم النطاق الفرعي غير صالح. يجب أن يحتوي فقط على أحرف وأرقام إنجليزية صغيرة، ويمكن استخدام الشرطة (-) في المنتصف فقط.',
    };
  }

  if (isReservedSubdomain(normalized)) {
    return {
      valid: false,
      code: 'RESERVED_SUBDOMAIN',
      message: 'هذا النطاق محجوز لأغراض تشغيلية، يرجى اختيار اسم منشأة آخر.',
    };
  }

  return {
    valid: true,
    code: '',
    message: '',
  };
}

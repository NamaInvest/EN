/**
 * Safety guards to verify database isolation and prevent production writes.
 */

export function assertNotProductionDatabaseUrl(url: string): void {
  const normalized = url.toLowerCase();
  
  // Forbidden production keywords
  const prodKeywords = [
    'prod',
    'production',
    'live',
    'namainvist.com',
    'namainvest',
    'hetzner',
    'main-db',
    'erp-prod'
  ];

  for (const keyword of prodKeywords) {
    if (normalized.includes(keyword)) {
      throw new Error(`CRITICAL: Production database URL keyword "${keyword}" detected in URL: "${url}"`);
    }
  }
}

export function assertTestDatabaseUrl(url: string): void {
  const normalized = url.toLowerCase();
  
  // Require explicit test indicators
  const hasTestIndicator = normalized.includes('test') || normalized.includes('disposable') || normalized.includes('localhost') || normalized.includes('127.0.0.1');
  
  if (!hasTestIndicator) {
    throw new Error(`CRITICAL: Database URL "${url}" does not contain required test/disposable/localhost indicators.`);
  }
}

export function requireExplicitTestMode(env: Record<string, string | undefined>): void {
  const nodeEnv = env.NODE_ENV;
  const testMode = env.TEST_MODE;
  
  if (nodeEnv !== 'test' && testMode !== 'true') {
    throw new Error('CRITICAL: Explicit test mode guard violation. NODE_ENV must be "test" or TEST_MODE must be "true".');
  }
}

export function validateDisposableDatabaseName(url: string): void {
  // Extract database name from connection strings (e.g. postgresql://user:pass@host:5432/dbname?schema=public)
  try {
    let dbName = '';
    
    if (url.startsWith('file:')) {
      dbName = url.split(':')[1] || '';
    } else {
      const parsedUrl = new URL(url);
      dbName = parsedUrl.pathname.substring(1) || '';
    }
    
    const dbNameLower = dbName.toLowerCase();
    
    if (!dbNameLower.includes('test') && !dbNameLower.includes('disposable') && !dbNameLower.includes('sqlite')) {
      throw new Error(`CRITICAL: Database name "${dbName}" in connection URL must contain "test", "disposable", or "sqlite".`);
    }
  } catch (error: any) {
    if (error.message.startsWith('CRITICAL:')) {
      throw error;
    }
    throw new Error(`CRITICAL: Failed to parse and validate database name in connection string: ${url}`);
  }
}

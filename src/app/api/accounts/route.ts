import { logger } from '@/lib/logger';

const log = logger.child({ service: 'accounts' });

// /api/accounts — proxy to /api/accounting/accounts for backwards compatibility
export { GET, POST, PUT, DELETE } from '@/app/api/accounting/accounts/route';

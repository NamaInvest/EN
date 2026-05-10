import { logger } from '@/lib/logger';

const log = logger.child({ service: 'packaging-units' });

// Alias for /api/units — same functionality
export { GET, POST, DELETE } from '../units/route';

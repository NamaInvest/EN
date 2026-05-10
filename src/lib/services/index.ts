import { logger } from '@/lib/logger';

const log = logger.child({ service: 'D:.namasoft9-3-main.src.lib.services.ind' });

/**
 * Service Layer — Barrel Export
 * Usage: import { AccountingService, SalesService, HRService } from '@/lib/services';
 */
export { AccountingService } from './accounting.service';
export { SalesService } from './sales.service';
export { HRService } from './hr.service';

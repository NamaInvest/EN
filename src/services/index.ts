/**
 * Services barrel export
 * Import services from here: import { JournalService, CreditManagementService } from '@/services';
 */

// Accounting
export { JournalService }         from './accounting/journal.service';
export { AllocationService }      from './accounting/allocation.service';
export { RecurringJournalService } from './accounting/recurring-je.service';
export type { AllocationRule, AllocationMethod, AllocationDryRun } from './accounting/allocation.service';
export type { RecurringFrequency } from './accounting/recurring-je.service';

// AR
export { CreditManagementService } from './ar/credit-management.service';
export type { CreditDecision, CustomerAgingReport, HoldDecision, AgingBucket } from './ar/credit-management.service';

// Sales — (InvoiceService to be added in next sprint)
// export { InvoiceService } from './sales/invoice.service';

// Shared
export { BaseService }    from './shared/base.service';
export { eventBus }       from './shared/event-bus.service';
export type { BusinessContext } from './shared/event-bus.service';

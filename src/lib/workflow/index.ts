import { logger } from '@/lib/logger';

const log = logger.child({ service: 'workflow.index' });

/**
 * Workflow Module — Unified exports
 * ─────────────────────────────────────────────────────────────────────────────
 * Architecture:
 *   StateMachineEngine  — drives document state transitions (DB-backed rules)
 *   ApprovalRuntime     — multi-level approval with escalation
 *   EventBus            — domain events with afterCommit queuing
 *   Saga<T>             — multi-step operations with compensation
 *
 * Business Sagas implemented:
 *   SalesInvoiceSaga    — validate stock → create invoice → reduce inventory → audit
 *   PayrollRunSaga      — validate period → calc salaries → deduct loans → audit
 *   MonthCloseSaga      — check tasks → execute → close fiscal period
 *   PurchaseOrderSaga   — validate supplier → create PO → submit approval → audit
 *   GRNSaga             — validate PO → create GRN → update inventory → audit
 */

// Core engines
export { StateMachineEngine } from './engine/state-machine';
export { ApprovalRuntime }    from './approval/runtime';
export { Saga }               from './saga/coordinator';

// Business sagas
export { buildSalesInvoiceSaga, buildPayrollRunSaga, buildMonthCloseSaga } from './saga/sagas';
export { buildPurchaseOrderSaga, buildGRNSaga }                            from './saga/purchase-sagas';

// Types
export type { SalesInvoiceSagaCtx, PayrollRunSagaCtx, MonthCloseSagaCtx } from './saga/sagas';
export type { PurchaseOrderSagaCtx, GRNSagaCtx }                          from './saga/purchase-sagas';
export type { TransitionResult, AutoAction }                               from './engine/state-machine';

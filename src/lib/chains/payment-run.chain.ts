import { BaseChain, ChainContext } from './index';
// Mocks for services since we are building orchestrators
import { eventBus } from '@/services/shared/event-bus.service';

export class PaymentRunChain extends BaseChain {
  protected chainName = 'payment-run';

  protected async executeNodes(stateId: number, context: ChainContext) {
    console.log(`[${this.chainName}] VALIDATE node`);
    // VALIDATE
    if (!context.payload.budgetApproved) {
      // Pause for authorization
      console.log(`[${this.chainName}] AUTHORIZE node - pausing for approval`);
      return { paused: true, data: { resumeUrl: `/approvals/${stateId}` } };
    }

    console.log(`[${this.chainName}] EXECUTE node`);
    // EXECUTE
    // Generate SIF, Upload WPS

    console.log(`[${this.chainName}] POST_JE node`);
    // POST_JE
    // auto-journal.createEntry

    console.log(`[${this.chainName}] NOTIFY node`);
    // NOTIFY

    console.log(`[${this.chainName}] AUDIT node`);
    // AUDIT
    eventBus.publish({ name: 'payment.run.completed', tenantId: context.tenantId, payload: { stateId } });

    return { paused: false, data: { status: 'Success' } };
  }

  protected async compensate(stateId: number) {
    console.log(`[${this.chainName}] COMPENSATE executing for state ${stateId}`);
    // Rollback bank file, reverse JE
  }
}

export const paymentRunChain = new PaymentRunChain();

import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'saga-orchestrator' });

export class SagaOrchestrator {
  static async startSaga(journeyType: string, initialContext: Record<string, any>) {
    return prisma.sagaTransaction.create({
      data: {
        journeyType,
        currentState: 'STARTED',
        context: initialContext,
        status: 'ACTIVE'
      }
    });
  }

  static async updateSagaState(sagaId: string, newState: string, stepName: string, status: 'SUCCESS' | 'FAILED' | 'ROLLED_BACK') {
    return prisma.$transaction(async (tx) => {
      await tx.orchestrationStep.create({
        data: {
          sagaId,
          stepName,
          status
        }
      });

      return tx.sagaTransaction.update({
        where: { id: sagaId },
        data: {
          currentState: newState,
          status: status === 'FAILED' ? 'COMPENSATING' : 'ACTIVE'
        }
      });
    });
  }

  static async completeSaga(sagaId: string) {
    return prisma.sagaTransaction.update({
      where: { id: sagaId },
      data: {
        currentState: 'COMPLETED',
        status: 'COMPLETED'
      }
    });
  }
}

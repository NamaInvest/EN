import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface ChainContext {
  stateId?: number;
  tenantId: string;
  actor: string;
  payload: any;
}

export abstract class BaseChain {
  protected abstract chainName: string;

  async invoke(context: ChainContext) {
    console.log(`Starting chain ${this.chainName} for tenant ${context.tenantId}`);
    
    // Create new state
    const state = await prisma.chainState.create({
      data: {
        chainName: this.chainName,
        tenantId: context.tenantId,
        actor: context.actor,
        status: 'RUNNING',
        payload: context.payload || {},
      }
    });

    try {
      const result = await this.executeNodes(state.id, context);
      await prisma.chainState.update({
        where: { id: state.id },
        data: { status: result.paused ? 'PAUSED' : 'COMPLETED', results: result.data || {} }
      });
      return result;
    } catch (err: any) {
      await prisma.chainState.update({
        where: { id: state.id },
        data: { status: 'FAILED', errors: { message: err.message } }
      });
      await this.compensate(state.id);
      throw err;
    }
  }

  async resume(stateId: number, additionalPayload: any) {
    const state = await prisma.chainState.findUnique({ where: { id: stateId } });
    if (!state || state.chainName !== this.chainName) {
      throw new Error('Invalid chain state');
    }

    if (state.status !== 'PAUSED') {
      throw new Error(`Cannot resume chain in state ${state.status}`);
    }

    await prisma.chainState.update({
      where: { id: stateId },
      data: { status: 'RUNNING', payload: { ...(state.payload as any), ...additionalPayload } }
    });

    try {
      const result = await this.executeNodes(stateId, {
        stateId,
        tenantId: state.tenantId,
        actor: state.actor || 'system',
        payload: { ...(state.payload as any), ...additionalPayload }
      });
      await prisma.chainState.update({
        where: { id: stateId },
        data: { status: result.paused ? 'PAUSED' : 'COMPLETED', results: result.data || {} }
      });
      return result;
    } catch (err: any) {
      await prisma.chainState.update({
        where: { id: stateId },
        data: { status: 'FAILED', errors: { message: err.message } }
      });
      await this.compensate(stateId);
      throw err;
    }
  }

  protected abstract executeNodes(stateId: number, context: ChainContext): Promise<any>;
  protected abstract compensate(stateId: number): Promise<void>;
}

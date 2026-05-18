import { OverrideContext } from './period-lock';

export function buildOverrideContextFromRequest(
  req: Request,
  context: { tenantId: string; actorId: string; actorRole: string; requestId?: string }
): OverrideContext | undefined {
  const reason = req.headers.get('X-Soft-Lock-Override-Reason');
  const confirmationCode = req.headers.get('X-Soft-Lock-Confirmation');

  if (!reason && !confirmationCode) {
    return undefined;
  }

  return {
    tenantId: context.tenantId,
    actorId: context.actorId,
    actorRole: context.actorRole,
    reason: reason || '',
    confirmationCode: confirmationCode || '',
    operationType: 'UNKNOWN', // Will be populated by the engine
    module: 'UNKNOWN',        // Will be populated by the engine
    postingDate: new Date(),  // Will be overridden by the engine if needed
    requestId: context.requestId || crypto.randomUUID(),
  };
}

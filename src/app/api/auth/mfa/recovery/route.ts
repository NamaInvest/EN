import { NextResponse } from 'next/server';
import { withRoute, RouteContext } from '@/lib/api/with-route';
import { MfaEngine } from '@/lib/mfa-engine';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const log = logger.child({ service: 'auth.mfa.recovery' });

const POST_SCHEMA = z.object({
  action: z.enum(['CREATE', 'APPROVE', 'REJECT']),
  targetUserId: z.number().optional(),
  reason: z.string().optional(),
  evidenceFileUrl: z.string().optional(),
  requestId: z.number().optional(),
  notes: z.string().optional(),
});

// GET — List all recovery requests for the active tenant
async function _GET(ctx: RouteContext) {
  const { prisma, auth } = ctx;
  try {
    const requests = await prisma.mfaRecoveryRequest.findMany({
      where: { tenantId: auth.tenantId },
      include: {
        user: { select: { id: true, name: true, email: true, username: true } }
      },
      orderBy: { requestedAt: 'desc' }
    });
    return NextResponse.json(requests);
  } catch (e: unknown) {
    const err = e instanceof Error ? e : new Error(String(e));
    log.error('Failed to list MFA recovery requests:', err);
    return NextResponse.json({ error: 'Failed to list recovery requests' }, { status: 500 });
  }
}

// POST — Handle creation, approval, and rejection of recovery requests
async function _POST(ctx: RouteContext) {
  const { req, prisma, auth } = ctx;
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = POST_SCHEMA.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request parameters', details: parsed.error.flatten() }, { status: 400 });
    }

    const { action, targetUserId, reason, evidenceFileUrl, requestId, notes } = parsed.data;

    // ── CREATE Action ────────────────────────────────────────────────────────
    if (action === 'CREATE') {
      if (!targetUserId || !reason) {
        return NextResponse.json({ error: 'targetUserId and reason are required' }, { status: 400 });
      }

      // Check if target user exists in the tenant
      const targetUser = await prisma.user.findFirst({
        where: { id: targetUserId, tenantId: auth.tenantId }
      });
      if (!targetUser) {
        return NextResponse.json({ error: 'Target user not found on this tenant' }, { status: 404 });
      }

      // Target user cannot open their own request if they are the administrator
      if (targetUserId === auth.userId) {
        return NextResponse.json({ error: 'Users cannot request recovery for themselves' }, { status: 400 });
      }

      const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';

      const newRequest = await prisma.mfaRecoveryRequest.create({
        data: {
          tenantId: auth.tenantId,
          userId: targetUserId,
          reason,
          evidenceFileUrl: evidenceFileUrl || null,
          ipAddress,
          status: 'PENDING',
        }
      });

      // Audit Log
      await prisma.auditLog.create({
        data: {
          tenantId: auth.tenantId,
          action: 'MFA_RECOVERY_REQUESTED',
          entityType: 'MfaRecoveryRequest',
          entityId: String(newRequest.id),
          userId: auth.userId,
          newData: { targetUserId, reason, ipAddress },
          ipAddress,
        }
      });

      return NextResponse.json({ success: true, request: newRequest }, { status: 201 });
    }

    // ── APPROVE Action ───────────────────────────────────────────────────────
    if (action === 'APPROVE') {
      if (!requestId) {
        return NextResponse.json({ error: 'requestId is required' }, { status: 400 });
      }

      const recoveryRequest = await prisma.mfaRecoveryRequest.findFirst({
        where: { id: requestId, tenantId: auth.tenantId }
      });

      if (!recoveryRequest) {
        return NextResponse.json({ error: 'MFA recovery request not found' }, { status: 404 });
      }

      if (recoveryRequest.status === 'APPROVED' || recoveryRequest.status === 'REJECTED') {
        return NextResponse.json({ error: 'Request is already finalized' }, { status: 400 });
      }

      // Requester/Target user cannot self-approve
      if (recoveryRequest.userId === auth.userId) {
        return NextResponse.json({ error: 'Self-approval is strictly forbidden' }, { status: 403 });
      }

      // STEP 1 Approval: PENDING -> PENDING_SECOND_OFFICER
      if (recoveryRequest.status === 'PENDING') {
        const updatedRequest = await prisma.mfaRecoveryRequest.update({
          where: { id: requestId },
          data: {
            status: 'PENDING_SECOND_OFFICER',
            reviewedByUserId: auth.userId,
            reviewNotes: notes || 'First officer approval granted.'
          }
        });

        // Audit Log for Step 1
        await prisma.auditLog.create({
          data: {
            tenantId: auth.tenantId,
            action: 'MFA_RECOVERY_FIRST_APPROVAL',
            entityType: 'MfaRecoveryRequest',
            entityId: String(requestId),
            userId: auth.userId,
            newData: { reviewerId: auth.userId, notes }
          }
        });

        return NextResponse.json({ success: true, request: updatedRequest });
      }

      // STEP 2 Approval: PENDING_SECOND_OFFICER -> APPROVED
      if (recoveryRequest.status === 'PENDING_SECOND_OFFICER') {
        // Officer 2 must be different from Officer 1 (reviewedByUserId)
        if (recoveryRequest.reviewedByUserId === auth.userId) {
          return NextResponse.json({ error: 'Dual-Officer Approval requires a second distinct administrator' }, { status: 403 });
        }

        const firstOfficerId = recoveryRequest.reviewedByUserId;

        // Perform final approval
        const updatedRequest = await prisma.mfaRecoveryRequest.update({
          where: { id: requestId },
          data: {
            status: 'APPROVED',
            reviewedByUserId: auth.userId,
            reviewedAt: new Date(),
            reviewNotes: `${recoveryRequest.reviewNotes || ''}\nFinal approval by Admin #${auth.userId}: ${notes || 'Approved.'}`,
            newSecretGenerated: true
          }
        });

        // Trigger actual MFA disable/reset
        await MfaEngine.disable(recoveryRequest.userId);

        // Audit Log for Step 2
        await prisma.auditLog.create({
          data: {
            tenantId: auth.tenantId,
            action: 'MFA_RECOVERY_FINAL_APPROVAL',
            entityType: 'MfaRecoveryRequest',
            entityId: String(requestId),
            userId: auth.userId,
            newData: {
              firstOfficerId,
              secondOfficerId: auth.userId,
              targetUserId: recoveryRequest.userId,
              notes
            }
          }
        });

        return NextResponse.json({ success: true, request: updatedRequest });
      }
    }

    // ── REJECT Action ────────────────────────────────────────────────────────
    if (action === 'REJECT') {
      if (!requestId) {
        return NextResponse.json({ error: 'requestId is required' }, { status: 400 });
      }

      const recoveryRequest = await prisma.mfaRecoveryRequest.findFirst({
        where: { id: requestId, tenantId: auth.tenantId }
      });

      if (!recoveryRequest) {
        return NextResponse.json({ error: 'MFA recovery request not found' }, { status: 404 });
      }

      const updatedRequest = await prisma.mfaRecoveryRequest.update({
        where: { id: requestId },
        data: {
          status: 'REJECTED',
          reviewedByUserId: auth.userId,
          reviewedAt: new Date(),
          reviewNotes: notes || 'Rejected'
        }
      });

      // Audit Log for rejection
      await prisma.auditLog.create({
        data: {
          tenantId: auth.tenantId,
          action: 'MFA_RECOVERY_REJECTED',
          entityType: 'MfaRecoveryRequest',
          entityId: String(requestId),
          userId: auth.userId,
          newData: { reviewerId: auth.userId, notes }
        }
      });

      return NextResponse.json({ success: true, request: updatedRequest });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (e: unknown) {
    const err = e instanceof Error ? e : new Error(String(e));
    log.error('MFA recovery action failed:', err);
    return NextResponse.json({ error: err.message || 'MFA recovery action failed' }, { status: 500 });
  }
}

export const GET = withRoute(async (ctx) => _GET(ctx), {
  rateLimit: 'AUTH',
  requireAuth: true,
  roles: ['admin', 'owner']
});

export const POST = withRoute(async (ctx) => _POST(ctx), {
  rateLimit: 'AUTH',
  requireAuth: true,
  roles: ['admin', 'owner']
});

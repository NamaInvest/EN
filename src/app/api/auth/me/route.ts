/**
 * GET /api/auth/me — Returns the currently authenticated user's profile
 * Used by frontend to verify session and get user details
 */
import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';

async function handler(ctx: any) {
  const { userId, tenantId } = ctx.auth;

  const user = await ctx.prisma.user.findUnique({
    where: { id: userId },
    select: {
      id:          true,
      username:    true,
      name:        true,
      role:        true,
      active:      true,
      branchId:    true,
      defaultPage: true,
      createdAt:   true,
      permissions: {
        select: { module: true, canView: true, canAdd: true, canEdit: true, canDelete: true, canPrint: true },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });
  }

  return NextResponse.json({
    ...user,
    tenantId,
    // Build permissions map for frontend
    permissionsMap: Object.fromEntries(
      user.permissions.map((p: { module: string; canView: boolean; canAdd: boolean; canEdit: boolean; canDelete: boolean; canPrint: boolean }) => [p.module, {
        canView: p.canView, canAdd: p.canAdd,
        canEdit: p.canEdit, canDelete: p.canDelete, canPrint: p.canPrint,
      }])
    ),
  });
}

export const GET = withRoute(handler, { rateLimit: 'DEFAULT' });

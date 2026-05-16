import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { prisma } from '@/lib/prisma';
import { requireTenantId } from '@/lib/governance/tenant-guard';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'accounting.customer-statements.templates' });

async function _GET(req: Request) {

    try {
        const tenantId = requireTenantId(req as any);
        const templates = await prisma.customerStatementTemplate.findMany({ take: 100,
            where: { tenantId },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(templates);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}


const _POSTSchema = z.object({
  name: z.any().optional(),
  isDefault: z.boolean().optional(),
  headerMessage: z.any().optional(),
  footerMessage: z.any().optional(),
  showAging: z.any().optional(),
  showPaidInvoices: z.any().optional(),
  primaryColor: z.any().optional(),
  userId: z.union([z.string(), z.number()]).optional(),
}).passthrough();

async function _POST(req: Request) {

    try {
        const tenantId = requireTenantId(req as any);
        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const {
            name,
            isDefault,
            headerMessage,
            footerMessage,
            showAging,
            showPaidInvoices,
            primaryColor,
            userId
        } = body;

        // If setting as default, unset others first
        if (isDefault) {
            await prisma.customerStatementTemplate.updateMany({
                where: { isDefault: true, tenantId },
                data: { isDefault: false }
            });
        }

        const template = await prisma.customerStatementTemplate.create({
            data: {
                tenantId,
                name,
                isDefault: isDefault || false,
                headerMessage,
                footerMessage,
                showAging: showAging ?? true,
                showPaidInvoices: showPaidInvoices ?? false,
                primaryColor: primaryColor || '#000000',
                createdBy: userId ? parseInt(userId, 10) : null
            }
        });

        return NextResponse.json(template);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'FINANCIAL' });

import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma, resolveTenant } from '@/lib/prisma';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'sales.atp.check' });
async function _POST(request: Request) {
    const prisma = getPrisma(request);
    try {
        const auth = getUserFromRequest(request as any);
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const tenantId = resolveTenant(request as any);
        const { productId, qty, requestedDate, warehouseId } = await request.json();

        if (!productId || !qty || !requestedDate || !warehouseId) {
            return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
        }

        const date = new Date(requestedDate);

        // Fetch Rule
        let rule = await prisma.atpRule.findFirst({
            where: { tenantId, productId, warehouseId, active: true }
        });

        // Fallback to global rule
        if (!rule) {
            rule = await prisma.atpRule.findFirst({
                where: { tenantId, productId: null, active: true }
            });
        }

        const bufferDays = rule?.bufferDays || 0;
        const targetDate = new Date(date);
        targetDate.setDate(targetDate.getDate() - bufferDays);

        // Mock current stock retrieval
        // In real implementation: sum(Stock.qty) WHERE productId AND warehouseId
        const currentStock = 150; 
        let availableQty = currentStock;
        const datesBreakdown = [];

        // 1. Current Stock
        datesBreakdown.push({
            date: new Date().toISOString(),
            source: 'On-Hand',
            qty: currentStock,
            cumulative: availableQty
        });

        // 2. Inbound POs (Mock)
        if (rule?.considerInbound) {
            // Real: fetch POs where expectedDelivery <= targetDate
            const inboundQty = 50; 
            const inboundDate = new Date();
            inboundDate.setDate(inboundDate.getDate() + 3);
            availableQty += inboundQty;
            
            datesBreakdown.push({
                date: inboundDate.toISOString(),
                source: 'Inbound PO #1002',
                qty: inboundQty,
                cumulative: availableQty
            });
        }

        // 3. Manufacturing (Mock)
        if (rule?.considerProduction) {
            const prodQty = 100;
            const prodDate = new Date();
            prodDate.setDate(prodDate.getDate() + 5);
            availableQty += prodQty;

            datesBreakdown.push({
                date: prodDate.toISOString(),
                source: 'Production Order #M-55',
                qty: prodQty,
                cumulative: availableQty
            });
        }

        const canPromise = availableQty >= qty;
        
        let suggestedDate = null;
        if (!canPromise) {
            // Find when we will have enough
            // Mocking a future date
            const futureDate = new Date(targetDate);
            futureDate.setDate(futureDate.getDate() + 14);
            suggestedDate = futureDate;
        }

        const resultJson = {
            canPromise,
            suggestedDate,
            breakdown: datesBreakdown,
            availableQty,
            requestedQty: qty
        };

        // Save check log
        const check = await prisma.atpCheck.create({
            data: {
                tenantId,
                productId,
                requestedQty: qty,
                requestedDate: date,
                warehouseId,
                result: resultJson,
                createdBy: auth.userId.toString()
            }
        });

        return NextResponse.json({ success: true, result: resultJson, checkId: check.id });
    } catch (e: any) {
        log.error(e);
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'FINANCIAL' });

import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';
import { n } from '@/lib/decimal-utils';
import { z } from 'zod';

function safeEvalFormula(formula: string, context: Record<string, number>): number {
    // Only allow specific tokens (cost, list, qty, weight) and basic math operators
    const allowedTokens = ['cost', 'list', 'qty', 'weight'];
    let safeFormula = formula.toLowerCase();
    
    // Replace tokens with their values from context
    for (const token of allowedTokens) {
        if (context[token] !== undefined) {
            const regex = new RegExp(`\\b${token}\\b`, 'g');
            safeFormula = safeFormula.replace(regex, context[token].toString());
        }
    }

    // Strip out anything that is not a digit, operator, or parenthesis to prevent injection
    safeFormula = safeFormula.replace(/[^-()\d/*+.]/g, '');

    try {
        // Evaluate the sanitized formula
        const result = new Function('return ' + safeFormula)();
        return isNaN(result) ? 0 : Number(result);
    } catch (e: any) {
        console.error('Formula evaluation error:', e);
        return 0;
    }
}


const _POSTSchema = z.object({
  customerId: z.union([z.string(), z.number()]).optional(),
  productId: z.union([z.string(), z.number()]).optional(),
  qty: z.number().optional(),
  channel: z.any().optional(),
  date: z.string().optional(),
}).passthrough();

async function _POST(req: Request) {

    const prisma = getPrisma(req as any);
    try {
        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const { customerId, productId, qty, channel, date } = body;

        if (!productId || qty === undefined) {
            return NextResponse.json({ error: 'Product ID and quantity are required' }, { status: 400 });
        }

        const evaluationDate = date ? new Date(date) : new Date();
        const quantity = parseFloat(qty);
        const prodId = parseInt(productId);
        const custId = customerId ? parseInt(customerId) : null;

        // Fetch product to get base price / cost if needed for formula evaluation
        const product = await prisma.product.findUnique({
            where: { id: prodId },
            select: { buyPrice: true, sellPrice: true, categoryId: true }
        });

        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        // 1. Find applicable Price Lists
        // A list is applicable if:
        // - It is active
        // - evaluationDate is within validFrom and validTo
        // - It matches the customer OR the customer's category OR the channel OR is generic (all null)
        
        let customerCategoryId: number | null = null;
        if (custId) {
            const customer = await prisma.customer.findUnique({
                where: { id: custId },
                select: { type: true } // Assuming type or category field maps to categoryId
            });
            customerCategoryId = customer?.type || null;
        }

        const priceLists = await prisma.priceList.findMany({
            take: 100,
            where: {
                isActive: true,
                validFrom: { lte: evaluationDate },
                OR: [
                    { validTo: null },
                    { validTo: { gte: evaluationDate } }
                ],
                AND: [
                    {
                        OR: [
                            { customerId: custId },
                            { customerCategoryId: customerCategoryId },
                            { channelId: channel },
                            { customerId: null, customerCategoryId: null, channelId: null } // Generic
                        ]
                    }
                ]
            },
            include: {
                rules: {
                    where: {
                        AND: [
                            {
                                OR: [
                                    { productId: prodId },
                                    { productCategoryId: product.categoryId }
                                ]
                            },
                            { minQty: { lte: quantity } },
                            {
                                OR: [
                                    { maxQty: null },
                                    { maxQty: { gte: quantity } }
                                ]
                            }
                        ]
                    }
                }
            },
            orderBy: { priority: 'desc' }
        });

        // Find the highest priority rule that applies
        let bestRule = null;
        let appliedList = null;

        for (const list of priceLists) {
            if (list.rules.length > 0) {
                // If there are multiple rules in the same list, prioritize exact product match over category match
                const exactMatch = list.rules.find((r: any) => r.productId === prodId);
                bestRule = exactMatch || list.rules[0];
                appliedList = list;
                break;
            }
        }

        if (!bestRule) {
            // Fallback to default product price
            return NextResponse.json({
                unitPrice: product.sellPrice || 0,
                discountPct: 0,
                sourceRuleId: null,
                isFallback: true
            });
        }

        // Calculate final price based on the rule
        let finalPrice = Number(bestRule.unitPrice);

        if (bestRule.formula && bestRule.formula.trim().length > 0) {
            finalPrice = safeEvalFormula(bestRule.formula, {
                cost: n(product.buyPrice || 0),
                list: n(product.sellPrice || 0),
                qty: quantity,
                weight: 0 // Not mapped on product directly
            });
        }

        return NextResponse.json({
            unitPrice: finalPrice,
            discountPct: bestRule.discountPct ? Number(bestRule.discountPct) : 0,
            sourceRuleId: bestRule.id,
            priceListName: appliedList?.name
        });

    } catch (e: any) {
        console.error('Pricing calculation error:', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// Force TS re-evaluation

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'FINANCIAL' });

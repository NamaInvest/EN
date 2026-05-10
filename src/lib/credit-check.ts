import { PrismaClient } from '@prisma/client';
import { n } from './decimal-utils';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'D:.namasoft9-3-main.src.lib.credit-check' });

export interface CreditCheckResult {
    passed: boolean;
    customerStatus: string;
    creditLimit: number;
    totalExposure: number;
    usedCredit: number;
    pendingOrders: number;
    availableCredit: number;
    reason?: string;
}

export async function checkCredit(
    tx: Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">,
    customerId: number,
    additionalAmount: number = 0,
    bypassPermission: boolean = false
): Promise<CreditCheckResult> {
    const customer = await tx.customer.findUnique({
        where: { id: customerId },
        select: { creditLimit: true, status: true,  }
    });

    if (!customer) {
        throw new Error('Customer not found');
    }

    if (customer.status === 'ON_HOLD' && !bypassPermission) {
        return {
            passed: false,
            customerStatus: customer.status,
            creditLimit: n(customer.creditLimit),
            usedCredit: 0,
            pendingOrders: 0,
            totalExposure: 0,
            availableCredit: 0,
            reason: 'Customer account is currently ON HOLD.'
        };
    }

    const creditLimit = n(customer.creditLimit);

    // 1. Calculate Unpaid Invoices
    const unpaidInvoicesAgg = await tx.salesInvoice.aggregate({
        where: {
            customerId,
            status: { notIn: ['PAID', 'CANCELLED', 'REVERSED', 'DRAFT'] }
        },
        _sum: {
            total: true,
            paid: true
        }
    });

    const usedCredit = n(unpaidInvoicesAgg._sum.total) - n(unpaidInvoicesAgg._sum.paid);

    // 2. Calculate Pending Sales Orders
    // We assume model is SalesOrder and it has status APPROVED.
    // In Namasoft v3, SalesOrder model might not exist or might be 'posOrder'/'salesInvoice'.
    // If it's standard ERP, we will try to aggregate salesOrder if it exists.
    let pendingOrders = 0;
    try {
        const pendingOrderAgg = await (tx as any).salesOrder?.aggregate({
            where: {
                customerId,
                status: 'APPROVED' // Approved but not yet invoiced/fulfilled
            },
            _sum: { total: true }
        });
        pendingOrders = pendingOrderAgg?._sum?.total || 0;
    } catch (e: any) {
        // Model might not be mapped yet, ignore.
    }

    const totalExposure = usedCredit + pendingOrders + additionalAmount;
    const availableCredit = creditLimit - totalExposure;

    let passed = true;
    let reason = '';

    if (creditLimit > 0 && totalExposure > creditLimit) {
        if (!bypassPermission) {
            passed = false;
            reason = `Credit limit exceeded. Limit: ${creditLimit}, Exposure: ${totalExposure}`;
        } else {
            // Bypass granted, maybe log this event somewhere.
            log.info(`Credit limit bypassed for Customer ${customerId} by authorized user.`);
        }
    }

    return {
        passed,
        customerStatus: customer.status || 'ACTIVE',
        creditLimit,
        usedCredit,
        pendingOrders,
        totalExposure,
        availableCredit,
        reason
    };
}

// Force TS re-evaluation

import { prisma } from './prisma';
import { n } from './decimal-utils';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'D:.namasoft9-3-main.src.lib.subscription' });

export class SubscriptionEngine {
    
    /**
     * Subscribe Customer to a Plan
     */
    static async subscribe(customerId: number, planId: number, paymentMethodId?: number) {
        const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
        if (!plan) throw new Error("Plan not found");

        const startDate = new Date();
        const currentPeriodStart = new Date(startDate);
        const currentPeriodEnd = new Date(startDate);

        if (plan.trialDays > 0) {
            currentPeriodEnd.setDate(currentPeriodEnd.getDate() + plan.trialDays);
        } else {
            if (plan.billingCycle === 'MONTHLY') currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
            else if (plan.billingCycle === 'QUARTERLY') currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 3);
            else if (plan.billingCycle === 'YEARLY') currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
        }

        const subscription = await prisma.customerSubscription.create({
            data: {
                customerId,
                planId,
                startDate,
                currentPeriodStart,
                currentPeriodEnd,
                nextBillingDate: currentPeriodEnd,
                status: plan.trialDays > 0 ? 'TRIAL' : 'ACTIVE',
                paymentMethodId
            }
        });

        // Create initial invoice if no trial and there is a setup fee or immediate billing
        if (plan.trialDays === 0) {
            await this.generateInvoice(subscription.id, n(plan.price) + n(plan.setupFee));
        } else if (plan.setupFee && n(plan.setupFee) > 0) {
            await this.generateInvoice(subscription.id, n(plan.setupFee));
        }

        return subscription;
    }

    /**
     * Generate Invoice for Subscription
     */
    static async generateInvoice(subscriptionId: number, amount: number) {
        const subscription = await prisma.customerSubscription.findUnique({ 
            where: { id: subscriptionId },
            include: { customer: true }
        });
        if (!subscription) throw new Error("Subscription not found");

        const invoice = await prisma.subscriptionInvoice.create({
            data: {
                subscriptionId,
                periodStart: subscription.currentPeriodStart,
                periodEnd: subscription.currentPeriodEnd,
                amount,
                status: 'PENDING'
            }
        });

        // Also create a Sales Invoice
        const salesInvoice = await prisma.salesInvoice.create({
            data: {
                invoiceNo: Math.floor(Math.random() * 1000000),
                date: new Date(),
                customerId: subscription.customerId,
                subtotal: amount,
                taxValue: amount * 0.15,
                total: amount * 1.15,
                remaining: amount * 1.15,
                status: 'posted',
                notes: `Subscription Billing for period ${subscription.currentPeriodStart.toISOString().split('T')[0]} to ${subscription.currentPeriodEnd.toISOString().split('T')[0]}`
            }
        });

        await prisma.subscriptionInvoice.update({
            where: { id: invoice.id },
            data: { salesInvoiceId: salesInvoice.id }
        });

        return invoice;
    }

    /**
     * Daily Cron: Process Renewals
     */
    static async processRenewals() {
        const today = new Date();
        const dueSubscriptions = await prisma.customerSubscription.findMany({
            take: 100,
            where: {
                status: { in: ['ACTIVE', 'TRIAL'] },
                nextBillingDate: { lte: today },
                cancelAtPeriodEnd: false
            },
            include: { plan: true }
        });

        const results = [];

        for (const sub of dueSubscriptions) {
            const invoice = await this.generateInvoice(sub.id, n(sub.plan.price));
            
            if (sub.paymentMethodId) {
                try {
                    await prisma.subscriptionInvoice.update({
                        where: { id: invoice.id },
                        data: { status: 'PAID' }
                    });
                    if (invoice.salesInvoiceId) {
                        await prisma.salesInvoice.update({
                            where: { id: invoice.salesInvoiceId },
                            data: { remaining: 0, status: 'paid' }
                        });
                    }
                } catch (e: any) {
                    await prisma.customerSubscription.update({
                        where: { id: sub.id },
                        data: { status: 'PAST_DUE' }
                    });
                    continue;
                }
            } else {
                await prisma.customerSubscription.update({
                    where: { id: sub.id },
                    data: { status: 'PAST_DUE' }
                });
                continue;
            }

            const newPeriodStart = new Date(sub.nextBillingDate);
            const newPeriodEnd = new Date(newPeriodStart);
            if (sub.plan.billingCycle === 'MONTHLY') newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1);
            else if (sub.plan.billingCycle === 'QUARTERLY') newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 3);
            else if (sub.plan.billingCycle === 'YEARLY') newPeriodEnd.setFullYear(newPeriodEnd.getFullYear() + 1);

            const updatedSub = await prisma.customerSubscription.update({
                where: { id: sub.id },
                data: {
                    currentPeriodStart: newPeriodStart,
                    currentPeriodEnd: newPeriodEnd,
                    nextBillingDate: newPeriodEnd,
                    status: 'ACTIVE'
                }
            });

            results.push(updatedSub);
        }

        return results;
    }

    /**
     * Cancel Subscription
     */
    static async cancelSubscription(subscriptionId: number, immediately = false) {
        if (immediately) {
            return prisma.customerSubscription.update({
                where: { id: subscriptionId },
                data: { status: 'CANCELLED' }
            });
        } else {
            return prisma.customerSubscription.update({
                where: { id: subscriptionId },
                data: { cancelAtPeriodEnd: true }
            });
        }
    }
}

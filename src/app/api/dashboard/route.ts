import { NextResponse, NextRequest } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
    const prisma = getPrisma(request);
    try {
        const auth = getUserFromRequest(request);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Check if user is admin (legacy admin = no permission records + admin role)
        let isAdmin = true;
        let userId: number | null = null;
        if (auth) {
            const user = await prisma.user.findUnique({ where: { id: auth.userId }, include: { permissions: true } });
            if (user) {
                const hasPermRecords = user.permissions.length > 0;
                const isLegacyAdmin = !hasPermRecords && user.role === 'admin';
                if (!isLegacyAdmin) {
                    isAdmin = false;
                    userId = user.id;
                }
            }
        }

        // For non-admin users, filter by their userId
        const salesWhere = isAdmin
            ? { date: { gte: today, lt: tomorrow }, status: 'completed' as const }
            : { date: { gte: today, lt: tomorrow }, status: 'completed' as const, userId };
        const purchasesWhere = isAdmin
            ? { date: { gte: today, lt: tomorrow }, status: 'completed' as const }
            : { date: { gte: today, lt: tomorrow }, status: 'completed' as const, userId };

        const returnsWhere = isAdmin
            ? { date: { gte: today, lt: tomorrow } }
            : { date: { gte: today, lt: tomorrow }, userId };

        const [todaySalesAgg, todayReturnsAgg, todayPurchasesAgg, todayExpensesAgg, totalProducts, treasuryIn, treasuryOut, totalCustomers, recentInvoices] = await Promise.all([
            prisma.salesInvoice.aggregate({
                where: salesWhere,
                _sum: { total: true },
            }),
            prisma.salesReturn.aggregate({
                where: returnsWhere,
                _sum: { total: true },
            }),
            prisma.purchaseInvoice.aggregate({
                where: purchasesWhere,
                _sum: { total: true },
            }),
            isAdmin
                ? prisma.expense.aggregate({ where: { date: { gte: today, lt: tomorrow } }, _sum: { amount: true } })
                : Promise.resolve({ _sum: { amount: 0 } }),
            prisma.product.count({ where: { active: true } }),
            isAdmin ? prisma.treasury.aggregate({ where: { type: 'in' }, _sum: { amount: true } }) : Promise.resolve({ _sum: { amount: 0 } }),
            isAdmin ? prisma.treasury.aggregate({ where: { type: 'out' }, _sum: { amount: true } }) : Promise.resolve({ _sum: { amount: 0 } }),
            prisma.customer.count({ where: { active: true } }),
            prisma.salesInvoice.findMany({
                where: isAdmin ? { status: 'completed' } : { status: 'completed', userId },
                orderBy: { date: 'desc' },
                take: 5,
                select: { id: true, invoiceNo: true, date: true, total: true, paymentType: true, customer: { select: { name: true } } },
            }),
        ]);

        const todaySalesRaw = todaySalesAgg._sum.total || 0;
        const todayReturns = todayReturnsAgg._sum.total || 0;
        const todaySales = Math.max(0, todaySalesRaw - todayReturns);
        
        const todayPurchases = todayPurchasesAgg._sum.total || 0;
        const todayExpenses = todayExpensesAgg._sum.amount || 0;
        const todayProfit = todaySalesRaw - todayReturns - todayPurchases - todayExpenses;
        const treasuryBalance = (treasuryIn._sum.amount || 0) - (treasuryOut._sum.amount || 0);

        // Sales chart (last 7 days)
        const salesChart = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            d.setHours(0, 0, 0, 0);
            const next = new Date(d);
            next.setDate(next.getDate() + 1);
            const chartWhere = isAdmin
                ? { date: { gte: d, lt: next }, status: 'completed' as const }
                : { date: { gte: d, lt: next }, status: 'completed' as const, userId };
            const agg = await prisma.salesInvoice.aggregate({
                where: chartWhere,
                _sum: { total: true },
            });
            salesChart.push({
                date: d.toLocaleDateString('en-GB'),
                total: agg._sum.total || 0,
            });
        }

        // Top products (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const topWhere = isAdmin
            ? { invoice: { date: { gte: thirtyDaysAgo }, status: 'completed' } }
            : { invoice: { date: { gte: thirtyDaysAgo }, status: 'completed', userId } };
        const topDetails = await prisma.salesInvoiceDetail.groupBy({
            by: ['productName'],
            where: topWhere,
            _sum: { quantity: true },
            orderBy: { _sum: { quantity: 'desc' } },
            take: 5,
        });
        const topProducts = topDetails.map(d => ({
            name: d.productName || 'غير معروف',
            quantity: d._sum.quantity || 0,
        }));

        return NextResponse.json({
            todaySales,
            todayPurchases,
            todayProfit,
            todayExpenses,
            totalProducts: isAdmin ? totalProducts : 0,
            lowStockCount: 0,
            treasuryBalance: isAdmin ? treasuryBalance : 0,
            totalCustomers: isAdmin ? totalCustomers : 0,
            salesChart,
            topProducts,
            recentInvoices: recentInvoices.map(inv => ({
                invoiceNo: inv.invoiceNo,
                date: inv.date,
                total: inv.total,
                paymentType: inv.paymentType,
                customerName: inv.customer?.name || 'عميل نقدي',
            })),
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        return NextResponse.json({
            todaySales: 0, todayPurchases: 0, todayProfit: 0, todayExpenses: 0,
            totalProducts: 0, lowStockCount: 0, treasuryBalance: 0, totalCustomers: 0,
            salesChart: [], topProducts: [], recentInvoices: [],
        });
    }
}

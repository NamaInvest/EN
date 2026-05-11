/**
 * Notes to Financial Statements — Auto-Generator (E.16)
 * Fixed field names per actual Prisma schema:
 *   SalesInvoice: total, remaining, invoiceNo (no remainingAmount, no dueDate, no type)
 *   PurchaseInvoice: total, remaining (no remainingAmount)
 *   Product: currentStock, buyPrice (no quantity, no sku, no costPrice)
 *   FixedAsset: acquisitionCost, accumulatedDepreciation, categoryId (no purchasePrice, no category)
 *   JournalLine: debit, credit (prisma.journalLine not journalEntryLine)
 *   JournalEntry: entryDate (String), status
 */

import { prisma } from './prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'notes-to-fs' });

export interface FinancialNote {
  noteNumber: number;
  title: string;
  titleAr: string;
  content: Record<string, any>;
  standard: string;
}

export class NotesToFinancialStatements {

  static async generate(params: {
    startDate: Date;
    endDate: Date;
    currency?: string;
  }): Promise<FinancialNote[]> {

    const { startDate, endDate, currency = 'SAR' } = params;
    const startStr = startDate.toISOString().split('T')[0];
    const endStr   = endDate.toISOString().split('T')[0];

    log.info('Generating Notes to Financial Statements', { startStr, endStr });

    const notes: FinancialNote[] = [];

    // ── Note 1: Basis of Preparation ──────────────────────────
    notes.push({
      noteNumber: 1,
      title: 'Basis of Preparation',
      titleAr: 'أساس الإعداد',
      content: {
        text: 'تم إعداد هذه القوائم المالية وفقاً للمعايير الدولية للتقرير المالي (IFRS) وبما يتوافق مع متطلبات هيئة الزكاة والضريبة والجمارك (ZATCA) والهيئة السعودية للمحاسبين القانونيين (SOCPA).',
        basisOfMeasurement: 'التكلفة التاريخية — Historical Cost',
        reportingCurrency: currency,
        periodStart: startStr,
        periodEnd: endStr,
        goingConcern: 'إدارة الشركة مقتنعة بأن الشركة قادرة على الاستمرار في أعمالها في المستقبل المنظور.',
      },
      standard: 'IAS 1.117',
    });

    // ── Note 2: Accounting Policies ───────────────────────────
    notes.push({
      noteNumber: 2,
      title: 'Significant Accounting Policies',
      titleAr: 'السياسات المحاسبية الجوهرية',
      content: {
        revenue:            'IFRS 15 — الإيراد عند نقل السيطرة للعميل.',
        inventory:          'IAS 2 — التكلفة أو صافي القيمة القابلة للتحقق أيهما أقل. طريقة المتوسط المرجح.',
        ppAndE:             'IAS 16 — التكلفة ناقص الإهلاك المتراكم.',
        leases:             'IFRS 16 — حق الاستخدام والالتزام.',
        financialInstruments: 'IFRS 9 — تصنيف وقياس الأدوات المالية.',
        provisioning:       'IFRS 9.5.5 — نموذج الخسائر الائتمانية المتوقعة المبسَّط.',
        foreignCurrency:    'IAS 21 — ترجمة المعاملات بسعر الصرف السائد.',
        zakat:              'أنظمة هيئة الزكاة والضريبة والجمارك (ZATCA).',
      },
      standard: 'IAS 1.119',
    });

    // ── Note 3: Revenue ────────────────────────────────────────
    // SalesInvoice: use total field (no totalAmount), aggregate only
    const revenueAgg = await prisma.salesInvoice.aggregate({
      _sum: { total: true, taxValue: true },
      where: {
        date: { gte: startDate, lte: endDate },
        deletedAt: null,
      },
    }).catch(() => ({ _sum: { total: 0, taxValue: 0 } }));

    const grossRevenue = Number(revenueAgg._sum?.total || 0);
    const revVAT       = Number(revenueAgg._sum?.taxValue || 0);
    const netRevenue   = grossRevenue - revVAT;

    notes.push({
      noteNumber: 3,
      title: 'Revenue',
      titleAr: 'الإيرادات',
      content: {
        grossRevenue:  Math.round(grossRevenue * 100) / 100,
        vatCollected:  Math.round(revVAT * 100) / 100,
        netRevenue:    Math.round(netRevenue * 100) / 100,
        note: 'تُثبَّت الإيرادات عند الوفاء بالتزامات الأداء وفق IFRS 15.',
        currency,
      },
      standard: 'IFRS 15.113',
    });

    // ── Note 4: Operating Expenses ─────────────────────────────
    // Use JournalLine (correct model name)
    const expenseLines = await prisma.journalLine.groupBy({
      by: ['accountId'],
      _sum: { debit: true, credit: true },
      where: {
        entry: {
          entryDate: { gte: startStr, lte: endStr },
          status: 'posted',
          deletedAt: null,
        },
        account: { code: { startsWith: '5' } },
        deletedAt: null,
      },
      orderBy: { _sum: { debit: 'desc' } },
      take: 10,
    }).catch(() => [] as any[]);

    const totalExpenses = (expenseLines as any[]).reduce((s, e) =>
      s + (Number(e._sum?.debit || 0) - Number(e._sum?.credit || 0)), 0);

    notes.push({
      noteNumber: 4,
      title: 'Operating Expenses',
      titleAr: 'المصروفات التشغيلية',
      content: {
        totalExpenses: Math.round(totalExpenses * 100) / 100,
        topAccounts:   (expenseLines as any[]).slice(0, 5).map(e => ({
          accountId: e.accountId,
          amount: Math.round((Number(e._sum?.debit || 0) - Number(e._sum?.credit || 0)) * 100) / 100,
        })),
        currency,
      },
      standard: 'IAS 1.102',
    });

    // ── Note 5: PP&E ───────────────────────────────────────────
    // FixedAsset: acquisitionCost (not purchasePrice), accumulatedDepreciation, categoryId
    const assetsAgg = await prisma.fixedAsset.aggregate({
      _sum: { acquisitionCost: true, accumulatedDepreciation: true },
      _count: { id: true },
    }).catch(() => ({ _sum: { acquisitionCost: 0, accumulatedDepreciation: 0 }, _count: { id: 0 } }));

    // Group by categoryId instead of category (which doesn't exist as String field)
    const assetsByCategory = await prisma.fixedAsset.groupBy({
      by: ['categoryId'],
      _sum: { acquisitionCost: true, accumulatedDepreciation: true },
      _count: { id: true },
    }).catch(() => [] as any[]);

    const totalCost    = Number(assetsAgg._sum?.acquisitionCost || 0);
    const totalAccDep  = Number(assetsAgg._sum?.accumulatedDepreciation || 0);

    notes.push({
      noteNumber: 5,
      title: 'Property, Plant and Equipment',
      titleAr: 'الممتلكات والمنشآت والمعدات',
      content: {
        totalCost:                 Math.round(totalCost * 100) / 100,
        totalAccumulatedDepreciation: Math.round(totalAccDep * 100) / 100,
        netBookValue:              Math.round((totalCost - totalAccDep) * 100) / 100,
        assetCount:                assetsAgg._count?.id || 0,
        byCategory: (assetsByCategory as any[]).map(a => ({
          categoryId:    a.categoryId || 0,
          cost:          Math.round(Number(a._sum?.acquisitionCost || 0) * 100) / 100,
          accDepreciation: Math.round(Number(a._sum?.accumulatedDepreciation || 0) * 100) / 100,
          nbv:           Math.round((Number(a._sum?.acquisitionCost || 0) - Number(a._sum?.accumulatedDepreciation || 0)) * 100) / 100,
          count:         a._count?.id || 0,
        })),
        depreciationMethod: 'القسط الثابت (Straight-Line)',
        currency,
      },
      standard: 'IAS 16.73',
    });

    // ── Note 6: Trade Receivables ──────────────────────────────
    // SalesInvoice: remaining (not remainingAmount)
    const receivablesAgg = await prisma.salesInvoice.aggregate({
      _sum: { remaining: true },
      where: { remaining: { gt: 0 }, deletedAt: null },
    }).catch(() => ({ _sum: { remaining: 0 } }));

    const now = new Date();
    const agingBuckets = [
      { label: 'جارية (أقل من 30 يوم)', fromDays: 0, toDays: 30 },
      { label: '30–60 يوم', fromDays: 30, toDays: 60 },
      { label: '60–90 يوم', fromDays: 60, toDays: 90 },
      { label: 'أكثر من 90 يوم', fromDays: 90, toDays: 9999 },
    ];

    const aging = await Promise.all(agingBuckets.map(async (b) => {
      const fromDate = new Date(now); fromDate.setDate(fromDate.getDate() - b.toDays);
      const toDate   = new Date(now); toDate.setDate(toDate.getDate() - b.fromDays);
      const agg = await prisma.salesInvoice.aggregate({
        _sum: { remaining: true },
        where: { remaining: { gt: 0 }, deletedAt: null, date: { gte: fromDate, lt: toDate } },
      }).catch(() => ({ _sum: { remaining: 0 } }));
      return { label: b.label, amount: Math.round(Number(agg._sum?.remaining || 0) * 100) / 100 };
    }));

    notes.push({
      noteNumber: 6,
      title: 'Trade Receivables',
      titleAr: 'المدينون التجاريون',
      content: {
        grossReceivables: Math.round(Number(receivablesAgg._sum?.remaining || 0) * 100) / 100,
        agingAnalysis: aging,
        note: 'تُحسَب مخصصات خسائر الائتمان المتوقعة وفق IFRS 9.',
        currency,
      },
      standard: 'IFRS 7.35H',
    });

    // ── Note 7: Inventories ────────────────────────────────────
    // Product: currentStock (not quantity)
    const inventoryAgg = await prisma.product.aggregate({
      _sum: { currentStock: true },
      _count: { id: true },
      where: { currentStock: { gt: 0 }, active: true },
    }).catch(() => ({ _sum: { currentStock: 0 }, _count: { id: 0 } }));

    notes.push({
      noteNumber: 7,
      title: 'Inventories',
      titleAr: 'المخزون',
      content: {
        totalQtyUnits:  Math.round(Number(inventoryAgg._sum?.currentStock || 0) * 10) / 10,
        totalProductCount: inventoryAgg._count?.id || 0,
        costFormula:    'المتوسط المرجح / FIFO',
        nrvNote:        'يُقيَّم المخزون بالتكلفة أو صافي القيمة القابلة للتحقق أيهما أقل وفق IAS 2.',
        currency,
      },
      standard: 'IAS 2.36',
    });

    // ── Note 8: Trade Payables ─────────────────────────────────
    // PurchaseInvoice: remaining (not remainingAmount)
    const payablesAgg = await prisma.purchaseInvoice.aggregate({
      _sum: { remaining: true },
      where: { remaining: { gt: 0 }, deletedAt: null },
    }).catch(() => ({ _sum: { remaining: 0 } }));

    notes.push({
      noteNumber: 8,
      title: 'Trade Payables',
      titleAr: 'الدائنون التجاريون',
      content: {
        totalPayables: Math.round(Number(payablesAgg._sum?.remaining || 0) * 100) / 100,
        note: 'تُصنَّف جميع أرصدة الدائنين ضمن الالتزامات المتداولة — أجل أقل من سنة.',
        currency,
      },
      standard: 'IAS 1.54(k)',
    });

    // ── Note 9: Borrowings & Financing ────────────────────────
    // JournalLine accounts starting with 2 (liabilities) — long-term
    const borrowingLines = await prisma.journalLine.aggregate({
      _sum: { credit: true, debit: true },
      where: {
        entry: { status: 'posted', deletedAt: null },
        account: { code: { startsWith: '22' } }, // 22x = long-term liabilities
        deletedAt: null,
      },
    }).catch(() => ({ _sum: { credit: 0, debit: 0 } }));

    const totalBorrowings = Number(borrowingLines._sum?.credit || 0) - Number(borrowingLines._sum?.debit || 0);

    // Short-term borrowings (21x)
    const stBorrowings = await prisma.journalLine.aggregate({
      _sum: { credit: true, debit: true },
      where: {
        entry: { status: 'posted', deletedAt: null },
        account: { code: { startsWith: '21' } },
        deletedAt: null,
      },
    }).catch(() => ({ _sum: { credit: 0, debit: 0 } }));

    const totalSTBorrowings = Number(stBorrowings._sum?.credit || 0) - Number(stBorrowings._sum?.debit || 0);

    notes.push({
      noteNumber: 9,
      title: 'Borrowings and Financing',
      titleAr: 'القروض والتمويل',
      content: {
        longTermBorrowings:  Math.round(Math.max(0, totalBorrowings) * 100) / 100,
        shortTermBorrowings: Math.round(Math.max(0, totalSTBorrowings) * 100) / 100,
        totalBorrowings:     Math.round(Math.max(0, totalBorrowings + totalSTBorrowings) * 100) / 100,
        note: 'تُقاس القروض بالتكلفة المستهلكة باستخدام طريقة معدل الفائدة الفعلي وفق IFRS 9.',
        financingTypes: ['تمويل بنكي إسلامي', 'إجارة تمويلية (IFRS 16)', 'خطوط ائتمانية'],
        currency,
      },
      standard: 'IFRS 7.31, IAS 1.54(m)',
    });

    // ── Note 10: Related Party Transactions ────────────────────
    // Try to get related party data from journal lines with customer/vendor dimensions
    const relatedPartyAgg = await prisma.journalLine.aggregate({
      _sum: { debit: true, credit: true },
      _count: { id: true },
      where: {
        entry: {
          entryDate: { gte: startStr, lte: endStr },
          status: 'posted',
          deletedAt: null,
        },
        OR: [
          { customerId: { not: null } },
          { vendorId: { not: null } },
        ],
        deletedAt: null,
      },
    }).catch(() => ({ _sum: { debit: 0, credit: 0 }, _count: { id: 0 } }));

    notes.push({
      noteNumber: 10,
      title: 'Related Party Transactions',
      titleAr: 'معاملات الأطراف المرتبطة',
      content: {
        transactionCount: relatedPartyAgg._count?.id || 0,
        totalDebits:  Math.round(Number(relatedPartyAgg._sum?.debit || 0) * 100) / 100,
        totalCredits: Math.round(Number(relatedPartyAgg._sum?.credit || 0) * 100) / 100,
        disclosureNote: 'يُفصح عن جميع المعاملات مع الأطراف المرتبطة بموجب المعيار IAS 24. تشمل الأطراف المرتبطة: الشركة الأم، الشركات الزميلة، كبار المساهمين، وأعضاء مجلس الإدارة.',
        keyManagementCompensation: 'يُكشف عن مكافآت الإدارة العليا في الإيضاح المنفصل وفق IAS 24.17.',
        currency,
      },
      standard: 'IAS 24.13',
    });

    // ── Note 11: Commitments & Contingencies ───────────────────
    // Operating lease commitments from IFRS 16 exemptions + purchase commitments
    const purchaseCommitments = await prisma.purchaseOrder.aggregate({
      _sum: { total: true },
      _count: { id: true },
      where: {
        status: { in: ['pending', 'approved'] },
        deletedAt: null,
      },
    }).catch(() => ({ _sum: { total: 0 }, _count: { id: 0 } }));

    const salesCommitments = await (prisma as any).salesOrder?.aggregate?.({
      _sum: { total: true },
      _count: { id: true },
      where: { status: { in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] } },
    }).catch(() => ({ _sum: { total: 0 }, _count: { id: 0 } })) ?? { _sum: { total: 0 }, _count: { id: 0 } };

    notes.push({
      noteNumber: 11,
      title: 'Commitments and Contingencies',
      titleAr: 'الالتزامات والطوارئ',
      content: {
        purchaseCommitments: {
          count:  purchaseCommitments._count?.id || 0,
          amount: Math.round(Number(purchaseCommitments._sum?.total || 0) * 100) / 100,
          description: 'أوامر شراء معلّقة وموافَق عليها لم تُستلم بعد',
        },
        salesCommitments: {
          count:  salesCommitments._count?.id || 0,
          amount: Math.round(Number(salesCommitments._sum?.total || 0) * 100) / 100,
          description: 'أوامر مبيعات قيد التنفيذ',
        },
        contingentLiabilities: 'لا توجد التزامات طارئة جوهرية تتجاوز العتبة المادية في تاريخ إعداد القوائم المالية — باستثناء ما أُشير إليه صراحةً أعلاه.',
        legalClaims: 'لا توجد دعاوى قضائية جوهرية معلّقة ضد الشركة في تاريخ القوائم المالية.',
        currency,
      },
      standard: 'IAS 37.86, IAS 1.125',
    });

    // ── Note 12: ZATCA VAT ─────────────────────────────────────
    const [salesVATAgg, purVATAgg] = await Promise.all([
      prisma.salesInvoice.aggregate({
        _sum: { taxValue: true },
        where: { date: { gte: startDate, lte: endDate }, deletedAt: null },
      }).catch(() => ({ _sum: { taxValue: 0 } })),
      prisma.purchaseInvoice.aggregate({
        _sum: { taxValue: true },
        where: { date: { gte: startDate, lte: endDate }, deletedAt: null },
      }).catch(() => ({ _sum: { taxValue: 0 } })),
    ]);

    const outputVAT = Number(salesVATAgg._sum?.taxValue || 0);
    const inputVAT  = Number(purVATAgg._sum?.taxValue || 0);

    notes.push({
      noteNumber: 12,
      title: 'Zakat and VAT',
      titleAr: 'الزكاة وضريبة القيمة المضافة',
      content: {
        vatOutputForPeriod: Math.round(outputVAT * 100) / 100,
        vatInputForPeriod:  Math.round(inputVAT * 100) / 100,
        netVATPayable:      Math.round((outputVAT - inputVAT) * 100) / 100,
        vatRate:            '15%',
        registrationNote:   'الشركة مسجلة لضريبة القيمة المضافة لدى ZATCA.',
        zatcaCompliance:    'Phase 2 — فوترة إلكترونية متكاملة',
        currency,
      },
      standard: 'ZATCA VAT Regulations',
    });

    log.info(`Generated ${notes.length} financial notes`);
    return notes;
  }
}

/**
 * Dashboard Builder Engine (G-04 Gap Build)
 * ══════════════════════════════════════════
 * 
 * Drag-drop dashboard designer
 * - KPI cards, charts, tables
 * - Real-time data from any model
 * - Save per user/role
 */

import type { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'D:.namasoft9-3-main.src.lib.dashboard-bu' });

export type WidgetType = 'kpi' | 'bar_chart' | 'line_chart' | 'pie_chart' | 'donut_chart' | 'table' | 'progress' | 'calendar';

export type WidgetConfig = {
    id: string;
    type: WidgetType;
    title: string;
    titleAr: string;
    x: number; y: number; w: number; h: number; // grid position
    dataSource: string; // model name
    measure: string;    // field to aggregate
    groupBy?: string;   // group dimension
    filter?: Record<string, any>;
    color?: string;
    limit?: number;
};

export type DashboardDef = {
    id?: number;
    name: string;
    widgets: WidgetConfig[];
};

export class DashboardBuilderEngine {
    /**
     * Fetch data for a widget
     */
    static async getWidgetData(prisma: PrismaClient, widget: WidgetConfig): Promise<any> {
        switch (widget.type) {
            case 'kpi':
                return this.getKPIData(prisma, widget);
            case 'bar_chart':
            case 'line_chart':
            case 'pie_chart':
            case 'donut_chart':
                return this.getChartData(prisma, widget);
            case 'table':
                return this.getTableData(prisma, widget);
            default:
                return null;
        }
    }

    private static async getKPIData(prisma: PrismaClient, w: WidgetConfig): Promise<any> {
        try {
            const model = (prisma as any)[w.dataSource.charAt(0).toLowerCase() + w.dataSource.slice(1)];
            if (!model) return { value: 0, label: w.title };

            if (w.measure === 'count') {
                const count = await model.count({ where: w.filter || {} });
                return { value: count, label: w.title };
            }

            const agg = await model.aggregate({
                _sum: { [w.measure]: true },
                where: w.filter || {},
            });
            return { value: Number(agg._sum?.[w.measure] || 0), label: w.title };
        } catch {
            return { value: 0, label: w.title };
        }
    }

    private static async getChartData(prisma: PrismaClient, w: WidgetConfig): Promise<any> {
        try {
            const model = (prisma as any)[w.dataSource.charAt(0).toLowerCase() + w.dataSource.slice(1)];
            if (!model) return { labels: [], values: [] };

            const records = await model.findMany({
                where: w.filter || {},
                take: w.limit || 100,
                orderBy: { [w.groupBy || 'id']: 'asc' },
            });

            const grouped: Record<string, number> = {};
            for (const r of records) {
                const key = String(r[w.groupBy || 'id'] || 'Other');
                grouped[key] = (grouped[key] || 0) + Number(r[w.measure] || 1);
            }

            return {
                labels: Object.keys(grouped).slice(0, 20),
                values: Object.values(grouped).slice(0, 20),
            };
        } catch {
            return { labels: [], values: [] };
        }
    }

    private static async getTableData(prisma: PrismaClient, w: WidgetConfig): Promise<any> {
        try {
            const model = (prisma as any)[w.dataSource.charAt(0).toLowerCase() + w.dataSource.slice(1)];
            if (!model) return [];
            return model.findMany({ where: w.filter || {}, take: w.limit || 10, orderBy: { id: 'desc' } });
        } catch { return []; }
    }

    /**
     * Available data sources
     */
    static getDataSources(): Array<{ model: string; label: string; measures: string[] }> {
        return [
            { model: 'SalesInvoice', label: 'فواتير المبيعات', measures: ['total', 'paid', 'taxValue', 'count'] },
            { model: 'PurchaseInvoice', label: 'فواتير المشتريات', measures: ['total', 'taxValue', 'count'] },
            { model: 'Product', label: 'المنتجات', measures: ['stockQuantity', 'salePrice', 'count'] },
            { model: 'Customer', label: 'العملاء', measures: ['count'] },
            { model: 'Employee', label: 'الموظفين', measures: ['count'] },
            { model: 'JournalEntry', label: 'القيود المحاسبية', measures: ['count'] },
            { model: 'Expense', label: 'المصروفات', measures: ['amount', 'count'] },
        ];
    }

    /**
     * Default dashboard preset
     */
    static getDefaultWidgets(): WidgetConfig[] {
        return [
            { id: 'w1', type: 'kpi', title: 'Total Sales', titleAr: 'إجمالي المبيعات', x: 0, y: 0, w: 3, h: 1, dataSource: 'SalesInvoice', measure: 'total', color: '#4CAF50' },
            { id: 'w2', type: 'kpi', title: 'Total Purchases', titleAr: 'إجمالي المشتريات', x: 3, y: 0, w: 3, h: 1, dataSource: 'PurchaseInvoice', measure: 'total', color: '#2196F3' },
            { id: 'w3', type: 'kpi', title: 'Products', titleAr: 'المنتجات', x: 6, y: 0, w: 3, h: 1, dataSource: 'Product', measure: 'count', color: '#FF9800' },
            { id: 'w4', type: 'kpi', title: 'Customers', titleAr: 'العملاء', x: 9, y: 0, w: 3, h: 1, dataSource: 'Customer', measure: 'count', color: '#9C27B0' },
            { id: 'w5', type: 'bar_chart', title: 'Monthly Sales', titleAr: 'المبيعات الشهرية', x: 0, y: 1, w: 6, h: 3, dataSource: 'SalesInvoice', measure: 'total', groupBy: 'date' },
            { id: 'w6', type: 'table', title: 'Recent Invoices', titleAr: 'آخر الفواتير', x: 6, y: 1, w: 6, h: 3, dataSource: 'SalesInvoice', measure: 'total', limit: 10 },
        ];
    }
}

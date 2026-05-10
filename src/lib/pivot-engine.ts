/**
 * Pivot Table Engine (G-07)
 * Transforms flat data into pivot tables with row/column/value aggregation
 */
import type { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'D:.namasoft9-3-main.src.lib.pivot-engine' });
const p = (prisma: PrismaClient) => prisma as any;

export class PivotEngine {
    static async generate(prisma: PrismaClient, config: {
        model: string; rowField: string; colField: string;
        valueField: string; aggregation: 'sum' | 'count' | 'avg';
    }) {
        const { model, rowField, colField, valueField, aggregation } = config;
        const records = await p(prisma)[model]?.findMany?.({ take: 5000 }) || [];
        const pivotMap: Record<string, Record<string, number[]>> = {};
        const colSet = new Set<string>();

        for (const r of records) {
            const rowKey = String(r[rowField] || 'N/A');
            const colKey = String(r[colField] || 'N/A');
            const val = parseFloat(r[valueField]) || 0;
            colSet.add(colKey);
            if (!pivotMap[rowKey]) pivotMap[rowKey] = {};
            if (!pivotMap[rowKey][colKey]) pivotMap[rowKey][colKey] = [];
            pivotMap[rowKey][colKey].push(val);
        }

        const columns = Array.from(colSet).sort();
        const agg = (nums: number[]) => {
            if (!nums?.length) return 0;
            if (aggregation === 'count') return nums.length;
            if (aggregation === 'avg') return nums.reduce((a: any, b: any) => a + b, 0) / nums.length;
            return nums.reduce((a: any, b: any) => a + b, 0);
        };

        const rows = Object.entries(pivotMap).map(([key, cols]) => {
            const row: Record<string, any> = { _label: key };
            let total = 0;
            for (const col of columns) {
                const v = agg(cols[col] || []);
                row[col] = Math.round(v * 100) / 100;
                total += v;
            }
            row._total = Math.round(total * 100) / 100;
            return row;
        });

        const totals: Record<string, any> = { _label: 'Total' };
        let grandTotal = 0;
        for (const col of columns) {
            const v = rows.reduce((s: any, r: any) => s + (r[col] || 0), 0);
            totals[col] = Math.round(v * 100) / 100;
            grandTotal += v;
        }
        totals._total = Math.round(grandTotal * 100) / 100;

        return { columns, rows, totals, recordCount: records.length };
    }
}

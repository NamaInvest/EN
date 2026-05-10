/**
 * Import/Export Engine (G-01 Gap Build)
 * ══════════════════════════════════════
 * 
 * Universal data import/export for any model
 * - CSV/Excel upload + column detection
 * - Smart column mapping
 * - Validation with error reporting
 * - Batch insert with progress
 * - Export any model to CSV
 */

import type { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'import-export-engine' });

// Supported models and their required/optional fields
const MODEL_SCHEMAS: Record<string, { required: string[]; optional: string[]; model: string }> = {
    Product: {
        required: ['name'],
        optional: ['barcode', 'salePrice', 'costPrice', 'description', 'sku', 'categoryId', 'stockQuantity', 'unit', 'taxRate'],
        model: 'product',
    },
    Customer: {
        required: ['name'],
        optional: ['email', 'phone', 'address', 'city', 'taxNumber', 'type', 'notes'],
        model: 'customer',
    },
    Supplier: {
        required: ['name'],
        optional: ['email', 'phone', 'address', 'city', 'taxNumber', 'contactPerson', 'notes'],
        model: 'supplier',
    },
    Account: {
        required: ['code', 'name', 'type'],
        optional: ['parentId', 'level', 'isActive', 'currency', 'notes'],
        model: 'account',
    },
    Employee: {
        required: ['name'],
        optional: ['email', 'phone', 'department', 'position', 'hireDate', 'salary', 'idNumber', 'nationality'],
        model: 'employee',
    },
};

export type ColumnDetection = {
    columns: string[];
    sampleData: Record<string, string>[];
    totalRows: number;
};

export type MappingValidation = {
    valid: boolean;
    missing: string[];
    warnings: string[];
};

export type ImportResult = {
    total: number;
    success: number;
    errors: Array<{ row: number; field: string; value: string; error: string }>;
};

export class ImportExportEngine {
    /**
     * Parse CSV and detect columns
     */
    static parseCSV(content: string): ColumnDetection {
        const lines = content.trim().split('\n');
        if (lines.length < 2) return { columns: [], sampleData: [], totalRows: 0 };

        const columns = lines[0].split(',').map(c => c.trim().replace(/"/g, '').replace(/^\uFEFF/, ''));
        const sampleData: Record<string, string>[] = [];

        for (let i = 1; i < Math.min(lines.length, 6); i++) {
            const vals = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
            const row: Record<string, string> = {};
            columns.forEach((col, idx) => { row[col] = vals[idx] || ''; });
            sampleData.push(row);
        }

        return { columns, sampleData, totalRows: lines.length - 1 };
    }

    /**
     * Auto-suggest column mapping
     */
    static autoMap(sourceColumns: string[], targetModel: string): Record<string, string> {
        const schema = MODEL_SCHEMAS[targetModel];
        if (!schema) return {};

        const mapping: Record<string, string> = {};
        const allFields = [...schema.required, ...schema.optional];
        const normalize = (s: string) => s.toLowerCase().replace(/[_\- ]/g, '');

        // Arabic field name mappings
        const AR_MAP: Record<string, string> = {
            'الاسم': 'name', 'اسم': 'name', 'المنتج': 'name', 'الصنف': 'name',
            'السعر': 'salePrice', 'سعر البيع': 'salePrice', 'سعرالبيع': 'salePrice',
            'التكلفة': 'costPrice', 'سعر الشراء': 'costPrice',
            'الباركود': 'barcode', 'رمز': 'barcode', 'كود': 'sku',
            'الكمية': 'stockQuantity', 'المخزون': 'stockQuantity',
            'الوصف': 'description', 'ملاحظات': 'notes',
            'الهاتف': 'phone', 'جوال': 'phone', 'تلفون': 'phone',
            'البريد': 'email', 'ايميل': 'email',
            'العنوان': 'address', 'المدينة': 'city',
            'الرقم الضريبي': 'taxNumber', 'الضريبة': 'taxRate',
            'القسم': 'department', 'الوظيفة': 'position',
            'الراتب': 'salary', 'الجنسية': 'nationality',
            'رقم الهوية': 'idNumber',
        };

        for (const src of sourceColumns) {
            const norm = normalize(src);
            // Try exact match
            const exact = allFields.find(f => normalize(f) === norm);
            if (exact) { mapping[src] = exact; continue; }
            // Try Arabic
            if (AR_MAP[src]) { mapping[src] = AR_MAP[src]; continue; }
            // Try partial
            const partial = allFields.find(f => norm.includes(normalize(f)) || normalize(f).includes(norm));
            if (partial) { mapping[src] = partial; }
        }

        return mapping;
    }

    /**
     * Validate mapping completeness
     */
    static validateMapping(targetModel: string, mapping: Record<string, string>): MappingValidation {
        const schema = MODEL_SCHEMAS[targetModel];
        if (!schema) return { valid: false, missing: ['Unknown model'], warnings: [] };

        const mappedFields = Object.values(mapping);
        const missing = schema.required.filter(f => !mappedFields.includes(f));
        const warnings: string[] = [];

        if (missing.length === 0) {
            const unmapped = schema.optional.filter(f => !mappedFields.includes(f));
            if (unmapped.length > 0) warnings.push(`Optional fields not mapped: ${unmapped.join(', ')}`);
        }

        return { valid: missing.length === 0, missing, warnings };
    }

    /**
     * Import data batch
     */
    static async importBatch(
        prisma: PrismaClient,
        targetModel: string,
        csvContent: string,
        mapping: Record<string, string>,
        tenantId: string
    ): Promise<ImportResult> {
        const schema = MODEL_SCHEMAS[targetModel];
        if (!schema) throw new Error(`Model ${targetModel} not supported`);

        const lines = csvContent.trim().split('\n');
        const headers = lines[0].split(',').map(c => c.trim().replace(/"/g, '').replace(/^\uFEFF/, ''));
        const result: ImportResult = { total: lines.length - 1, success: 0, errors: [] };

        for (let i = 1; i < lines.length; i++) {
            const vals = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
            const record: Record<string, any> = { tenantId };

            // Map values
            for (let j = 0; j < headers.length; j++) {
                const targetField = mapping[headers[j]];
                if (!targetField) continue;
                let value: any = vals[j] || '';

                // Type conversion
                if (['salePrice', 'costPrice', 'stockQuantity', 'salary', 'taxRate'].includes(targetField)) {
                    value = parseFloat(value) || 0;
                }
                if (['categoryId', 'parentId', 'level'].includes(targetField)) {
                    value = parseInt(value) || undefined;
                }
                if (['isActive'].includes(targetField)) {
                    value = value === 'true' || value === '1' || value === 'نعم';
                }

                if (value !== undefined && value !== '') record[targetField] = value;
            }

            // Validate required
            const missingReq = schema.required.filter(f => !record[f]);
            if (missingReq.length > 0) {
                result.errors.push({ row: i + 1, field: missingReq[0], value: '', error: `الحقل مطلوب: ${missingReq[0]}` });
                continue;
            }

            try {
                await (prisma as any)[schema.model].create({ data: record });
                result.success++;
            } catch (e: any) {
                result.errors.push({ row: i + 1, field: 'general', value: '', error: e.message?.slice(0, 100) });
            }
        }

        return result;
    }

    /**
     * Export model data to CSV
     */
    static async exportCSV(
        prisma: PrismaClient,
        targetModel: string,
        fields?: string[],
        filters?: Record<string, any>
    ): Promise<string> {
        const schema = MODEL_SCHEMAS[targetModel];
        if (!schema) throw new Error(`Model ${targetModel} not supported`);

        const allFields = fields || [...schema.required, ...schema.optional];
        const records = await (prisma as any)[schema.model].findMany({
            where: filters || {},
            take: 10000,
        });

        // Header
        let csv = allFields.join(',') + '\n';

        // Rows
        for (const rec of records) {
            const row = allFields.map(f => {
                const val = rec[f];
                if (val === null || val === undefined) return '';
                const str = String(val);
                return str.includes(',') ? `"${str}"` : str;
            });
            csv += row.join(',') + '\n';
        }

        return csv;
    }

    /**
     * Get available models for import/export
     */
    static getAvailableModels(): Array<{ key: string; label: string; labelAr: string; fields: string[] }> {
        return Object.entries(MODEL_SCHEMAS).map(([key, schema]) => ({
            key,
            label: key,
            labelAr: key === 'Product' ? 'المنتجات' : key === 'Customer' ? 'العملاء' : key === 'Supplier' ? 'الموردين' : key === 'Account' ? 'الحسابات' : key === 'Employee' ? 'الموظفين' : key,
            fields: [...schema.required, ...schema.optional],
        }));
    }
}

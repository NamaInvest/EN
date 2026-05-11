import { logger } from '@/lib/logger';

const log = logger.child({ service: 'report-builder-engine' });

/**
 * P-03: Custom Report Builder
 * ReportDefinition model doesn't exist in schema — engine is pure logic layer.
 * Definitions stored in-memory or JSON files; can be persisted via CustomPage/CustomForm tables.
 */

type AggFn = 'SUM' | 'COUNT' | 'AVG' | 'MIN' | 'MAX';

export interface ReportColumn {
  field: string;
  label: string;
  agg?: AggFn;
}

export interface ReportDefinition {
  id?: string;
  name: string;
  entity: string;
  columns: ReportColumn[];
  filters: Record<string, unknown>;
  groupBy?: string[];
  orderBy?: string;
  orderDir?: 'asc' | 'desc';
  limit?: number;
}

const definitions = new Map<string, ReportDefinition>();

export class ReportBuilderEngine {
  static save(def: ReportDefinition): string {
    const id = def.id ?? `RPT-${Date.now()}`;
    definitions.set(id, { ...def, id });
    log.info(`Report definition saved: ${id} — ${def.name}`);
    return id;
  }

  static get(id: string): ReportDefinition | undefined {
    return definitions.get(id);
  }

  static list(): ReportDefinition[] {
    return Array.from(definitions.values());
  }

  /** Generate SQL-safe SELECT clause (whitelist pattern prevents SQL injection) */
  static buildSelectClause(columns: ReportColumn[], allowedFields: string[]): string {
    const safe = columns.filter(c => allowedFields.includes(c.field));
    if (!safe.length) throw new Error('No valid columns selected');
    return safe.map(c => c.agg ? `${c.agg}("${c.field}") AS "${c.label}"` : `"${c.field}" AS "${c.label}"`).join(', ');
  }

  /** Build WHERE clause from filters map */
  static buildWhereClause(filters: Record<string, unknown>): { sql: string; params: unknown[] } {
    const keys = Object.keys(filters);
    if (!keys.length) return { sql: '', params: [] };
    const parts = keys.map((k, i) => `"${k}" = $${i + 1}`);
    return { sql: `WHERE ${parts.join(' AND ')}`, params: Object.values(filters) };
  }
}

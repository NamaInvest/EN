/**
 * OLAP Cube Engine
 *
 * Pivot-table-style multi-dimensional aggregation over transactional data.
 * Backed by Postgres materialized views; refresh schedules per fact table.
 *
 * Supports:
 *  - rows × columns × measures
 *  - drill-down (drill-back to source document)
 *  - OData feed for Excel/PowerBI external connectivity
 */

export type AggregationFn = 'SUM' | 'AVG' | 'COUNT' | 'MIN' | 'MAX' | 'COUNT_DISTINCT';

export interface CubeDimension {
  field: string;
  label?: string;
  format?: 'date' | 'string' | 'number' | 'enum';
}

export interface CubeMeasure {
  field: string;
  agg: AggregationFn;
  label?: string;
  format?: 'currency' | 'integer' | 'percent';
}

export interface CubeQuery {
  factTable: 'fact_sales' | 'fact_gl' | 'fact_inventory' | 'fact_procurement' | 'fact_hr';
  tenantId: string;
  rows: CubeDimension[];
  columns: CubeDimension[];
  measures: CubeMeasure[];
  filters?: Record<string, string | number | string[] | { from: Date; to: Date }>;
  limit?: number;
}

export interface CubeRow {
  rowValues: Record<string, unknown>;
  columnValues: Record<string, Record<string, number | null>>;
}

export interface CubeResult {
  rows: CubeRow[];
  totals: Record<string, number>;
  rowGroups: string[];
  columnGroups: string[];
  measureKeys: string[];
}

/**
 * Build a SQL query for the cube.
 * Note: uses raw string assembly. Caller must validate cube schema against allow-list.
 */
export function buildCubeSQL(query: CubeQuery): { sql: string; params: unknown[] } {
  validateQuery(query);
  const params: unknown[] = [query.tenantId];
  const tenantPlaceholder = '$1';

  const rowFields = query.rows.map((r) => quoteIdent(r.field));
  const colFields = query.columns.map((c) => quoteIdent(c.field));
  const groupByFields = [...rowFields, ...colFields];
  const measuresSql = query.measures.map((m, i) => {
    const aggExpr = aggExprFor(m.agg, m.field);
    return `${aggExpr} AS ${quoteIdent(`m${i}_${m.field}`)}`;
  });

  const selectFields = [...groupByFields, ...measuresSql].join(', ');
  const whereClauses = [`tenant_id = ${tenantPlaceholder}`];

  if (query.filters) {
    for (const [k, v] of Object.entries(query.filters)) {
      if (typeof v === 'object' && v !== null && 'from' in v && 'to' in v) {
        params.push((v as { from: Date }).from);
        params.push((v as { to: Date }).to);
        whereClauses.push(`${quoteIdent(k)} BETWEEN $${params.length - 1} AND $${params.length}`);
      } else if (Array.isArray(v)) {
        params.push(v);
        whereClauses.push(`${quoteIdent(k)} = ANY($${params.length})`);
      } else {
        params.push(v);
        whereClauses.push(`${quoteIdent(k)} = $${params.length}`);
      }
    }
  }

  const sql =
    `SELECT ${selectFields}\n` +
    `FROM ${quoteIdent(query.factTable)}\n` +
    `WHERE ${whereClauses.join(' AND ')}\n` +
    `GROUP BY ${groupByFields.join(', ')}\n` +
    (query.limit ? `LIMIT ${Number(query.limit)}` : '');

  return { sql, params };
}

function aggExprFor(agg: AggregationFn, field: string): string {
  const f = quoteIdent(field);
  switch (agg) {
    case 'SUM': return `COALESCE(SUM(${f}), 0)`;
    case 'AVG': return `COALESCE(AVG(${f}), 0)`;
    case 'COUNT': return `COUNT(${f})`;
    case 'COUNT_DISTINCT': return `COUNT(DISTINCT ${f})`;
    case 'MIN': return `MIN(${f})`;
    case 'MAX': return `MAX(${f})`;
  }
}

const SAFE_IDENT_RE = /^[a-z_][a-z0-9_]*$/i;
function quoteIdent(s: string): string {
  if (!SAFE_IDENT_RE.test(s)) {
    throw new Error(`Invalid identifier: ${s}`);
  }
  return `"${s}"`;
}

/** Whitelist of fact tables and allowed dimensions/measures. */
const CUBE_SCHEMA = {
  fact_sales: {
    dimensions: ['date', 'year', 'month', 'quarter', 'customer_id', 'product_id', 'branch_id', 'salesman_id', 'channel', 'currency'],
    measures: ['qty', 'amount', 'cost', 'margin', 'discount'],
  },
  fact_gl: {
    dimensions: ['date', 'year', 'month', 'account_id', 'account_type', 'cost_center_id', 'profit_center_id', 'segment_id'],
    measures: ['debit', 'credit', 'balance'],
  },
  fact_inventory: {
    dimensions: ['date', 'product_id', 'warehouse_id', 'bin_id', 'batch_id', 'lot_id'],
    measures: ['qty', 'value', 'cost_per_unit'],
  },
  fact_procurement: {
    dimensions: ['date', 'vendor_id', 'product_id', 'branch_id', 'category'],
    measures: ['qty', 'amount', 'lead_time_days'],
  },
  fact_hr: {
    dimensions: ['date', 'employee_id', 'department_id', 'role', 'nationality'],
    measures: ['hours', 'cost', 'overtime_hours'],
  },
} as const;

function validateQuery(q: CubeQuery): void {
  const schema = CUBE_SCHEMA[q.factTable];
  if (!schema) throw new Error(`Unknown fact table: ${q.factTable}`);
  const dimAllow = new Set<string>(schema.dimensions);
  const measAllow = new Set<string>(schema.measures);
  for (const r of q.rows) {
    if (!dimAllow.has(r.field)) throw new Error(`Dimension not allowed in ${q.factTable}: ${r.field}`);
  }
  for (const c of q.columns) {
    if (!dimAllow.has(c.field)) throw new Error(`Dimension not allowed: ${c.field}`);
  }
  for (const m of q.measures) {
    if (!measAllow.has(m.field)) throw new Error(`Measure not allowed: ${m.field}`);
  }
}

/* ---------- Materialized View definitions ---------- */

/**
 * Returns the SQL to create the materialized views.
 * Run once during initial setup. Refresh schedules separate.
 */
export function getCubeMatviewsSQL(): string[] {
  return [
    `CREATE MATERIALIZED VIEW IF NOT EXISTS fact_sales AS
     SELECT
       si.id AS invoice_id,
       si.tenant_id,
       si.invoice_date::date AS date,
       EXTRACT(YEAR FROM si.invoice_date)::int AS year,
       EXTRACT(MONTH FROM si.invoice_date)::int AS month,
       EXTRACT(QUARTER FROM si.invoice_date)::int AS quarter,
       si.customer_id,
       sid.product_id,
       si.branch_id,
       si.salesman_id,
       si.channel,
       si.currency,
       sid.qty,
       sid.line_total AS amount,
       (sid.qty * COALESCE(sid.cost_per_unit, 0)) AS cost,
       (sid.line_total - sid.qty * COALESCE(sid.cost_per_unit, 0)) AS margin,
       sid.discount_amount AS discount
     FROM sales_invoice si
     INNER JOIN sales_invoice_detail sid ON sid.invoice_id = si.id
     WHERE si.status IN ('POSTED', 'CLEARED', 'PARTIALLY_PAID', 'PAID')
       AND si.deleted_at IS NULL;`,
    `CREATE INDEX IF NOT EXISTS idx_fact_sales_tenant_date ON fact_sales (tenant_id, date);
     CREATE INDEX IF NOT EXISTS idx_fact_sales_tenant_customer ON fact_sales (tenant_id, customer_id);
     CREATE INDEX IF NOT EXISTS idx_fact_sales_tenant_product ON fact_sales (tenant_id, product_id);`,
    `CREATE MATERIALIZED VIEW IF NOT EXISTS fact_gl AS
     SELECT
       jl.id AS line_id,
       je.tenant_id,
       je.date::date AS date,
       EXTRACT(YEAR FROM je.date)::int AS year,
       EXTRACT(MONTH FROM je.date)::int AS month,
       jl.account_id,
       a.type AS account_type,
       jl.cost_center_id,
       jl.profit_center_id,
       jl.segment_id,
       jl.debit,
       jl.credit,
       (jl.debit - jl.credit) AS balance
     FROM journal_line jl
     INNER JOIN journal_entry je ON je.id = jl.journal_entry_id
     INNER JOIN account a ON a.id = jl.account_id
     WHERE je.status = 'POSTED';`,
    `CREATE INDEX IF NOT EXISTS idx_fact_gl_tenant_date ON fact_gl (tenant_id, date);
     CREATE INDEX IF NOT EXISTS idx_fact_gl_tenant_account ON fact_gl (tenant_id, account_id);`,
  ];
}

/** SQL to schedule refresh via pg_cron (every 15 min for sales, hourly for inventory, etc). */
export function getCubeRefreshSQL(): string[] {
  return [
    `SELECT cron.schedule('refresh_fact_sales', '*/15 * * * *', 'REFRESH MATERIALIZED VIEW CONCURRENTLY fact_sales;');`,
    `SELECT cron.schedule('refresh_fact_gl', '*/15 * * * *', 'REFRESH MATERIALIZED VIEW CONCURRENTLY fact_gl;');`,
    `SELECT cron.schedule('refresh_fact_inventory', '0 * * * *', 'REFRESH MATERIALIZED VIEW CONCURRENTLY fact_inventory;');`,
    `SELECT cron.schedule('refresh_fact_procurement', '0 * * * *', 'REFRESH MATERIALIZED VIEW CONCURRENTLY fact_procurement;');`,
    `SELECT cron.schedule('refresh_fact_hr', '0 2 * * *', 'REFRESH MATERIALIZED VIEW CONCURRENTLY fact_hr;');`,
  ];
}

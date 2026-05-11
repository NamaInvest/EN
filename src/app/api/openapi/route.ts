/**
 * OpenAPI Auto-Generator (G8)
 * ══════════════════════════════════════════════════════════════════════════════
 * Generates a full OpenAPI 3.1 spec from route metadata + Zod schemas.
 *
 * GET  /api/openapi → returns spec as JSON
 * GET  /api/openapi?format=yaml → returns spec as YAML
 *
 * The spec is built from:
 *   1. Route registry (manually curated route list with metadata)
 *   2. Zod-to-JSON-Schema conversion for request/response shapes
 *   3. Standard ZATCA/IFRS tag groupings
 */

import { NextRequest, NextResponse } from 'next/server';

// ─── Route Registry ───────────────────────────────────────────────────────────
// Each entry describes an API endpoint for OpenAPI generation.
// Adding a new endpoint here automatically updates the spec.

const ROUTE_REGISTRY: Array<{
  path:        string;
  method:      'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  summary:     string;
  description: string;
  tags:        string[];
  params?:     Record<string, { type: string; description: string; required?: boolean }>;
  requestBody?: object;
  responses?:  Record<number, string>;
}> = [
  // ── Finance ──────────────────────────────────────────────────────────────
  {
    path: '/api/finance/cash-flow-indirect',
    method: 'GET',
    summary: 'قائمة التدفقات النقدية — الطريقة غير المباشرة',
    description: 'يُولّد قائمة التدفقات النقدية بالطريقة غير المباشرة وفق IAS 7.18(b)',
    tags: ['Finance', 'IFRS'],
    params: {
      tenantId: { type: 'string', description: 'معرّف المستأجر', required: true },
      from:     { type: 'string', description: 'تاريخ البداية (YYYY-MM-DD)', required: true },
      to:       { type: 'string', description: 'تاريخ النهاية (YYYY-MM-DD)', required: true },
    },
    responses: { 200: 'IndirectCashFlowResult', 400: 'Error', 500: 'Error' },
  },
  {
    path: '/api/finance/ap-aging',
    method: 'GET',
    summary: 'تقرير تقادم الذمم الدائنة (AP Aging)',
    description: 'Buckets: Current, 31-60, 61-90, 91-120, 120+ أيام لكل مورد',
    tags: ['Finance', 'AP'],
    params: {
      tenantId: { type: 'string', description: 'معرّف المستأجر', required: true },
      asOf:     { type: 'string', description: 'تاريخ الإقفال (YYYY-MM-DD)' },
    },
    responses: { 200: 'APAgingResult', 400: 'Error' },
  },
  {
    path: '/api/finance/rolling-forecast',
    method: 'GET',
    summary: 'التنبؤ المتجدد (Rolling Forecast)',
    description: 'أفق 12 شهر متجدد مع تحليل الانحراف Actual vs Budget vs Forecast',
    tags: ['Finance', 'Budget'],
    params: {
      tenantId: { type: 'string', required: true, description: 'معرّف المستأجر' },
      action:   { type: 'string', description: 'horizon | variance | forecast' },
      scenario: { type: 'string', description: 'BASE | BEST | WORST' },
      period:   { type: 'string', description: 'فترة الانحراف: 2026-Q1 أو 2026-01' },
    },
    responses: { 200: 'RollingForecastResult', 400: 'Error' },
  },
  {
    path: '/api/finance/commitments',
    method: 'GET',
    summary: 'سجل الالتزامات (Commitments Register)',
    description: 'IAS 37: PO المفتوحة + العقود + CAPEX بfلتير maturity buckets',
    tags: ['Finance', 'IFRS'],
    params: {
      tenantId: { type: 'string', required: true, description: 'معرّف المستأجر' },
      asOf:     { type: 'string', description: 'تاريخ الإقفال' },
      type:     { type: 'string', description: 'PURCHASE_ORDER | SERVICE_CONTRACT | CAPITAL_COMMITMENT | OPERATING_LEASE' },
      bucket:   { type: 'string', description: 'WITHIN_1_YEAR | 1_TO_5_YEARS | OVER_5_YEARS' },
    },
    responses: { 200: 'CommitmentsRegister', 400: 'Error' },
  },
  {
    path: '/api/finance/ifrs16',
    method: 'POST',
    summary: 'معالجة عقود الإيجار IFRS 16',
    description: 'إنشاء / تعديل عقد إيجار مع القيد الافتتاحي وجدول الاستهلاك',
    tags: ['Finance', 'IFRS'],
    requestBody: {
      action: 'create | modify',
      tenantId: 'string',
      description: 'string',
      commencementDate: 'YYYY-MM-DD',
      leaseTerm: 'integer (months)',
      monthlyPayment: 'number',
      incrementalBorrowingRate: 'number (0.06 = 6%)',
    },
    responses: { 200: 'IFRS16LeaseResult', 400: 'Error' },
  },
  // ── ZATCA ─────────────────────────────────────────────────────────────────
  {
    path: '/api/zatca/reverse-charge',
    method: 'POST',
    summary: 'ضريبة الاستقطاع العكسي (Reverse Charge VAT)',
    description: 'ZATCA: فواتير الخدمات المستوردة — حساب الضريبة + boxes 8-10 لإقرار VAT',
    tags: ['ZATCA', 'VAT'],
    requestBody: {
      action: 'check | calculate | vat-return-section',
      invoiceId: 'integer',
      supplierCountry: 'ISO 3166-1 alpha-2',
      serviceType: 'GOODS | SERVICE | MIXED',
      lineAmount: 'number',
    },
    responses: { 200: 'ReverseChargeResult', 400: 'Error' },
  },
  // ── HR ────────────────────────────────────────────────────────────────────
  {
    path: '/api/hr/employees',
    method: 'GET',
    summary: 'قائمة الموظفين',
    description: 'يُرجع قائمة الموظفين مع pagination',
    tags: ['HR'],
    params: {
      tenantId: { type: 'string', required: true, description: 'معرّف المستأجر' },
      page:     { type: 'integer', description: 'رقم الصفحة (بدءاً من 1)' },
      limit:    { type: 'integer', description: 'عدد النتائج في الصفحة' },
    },
    responses: { 200: 'EmployeeList', 400: 'Error' },
  },
  // ── Accounting ────────────────────────────────────────────────────────────
  {
    path: '/api/accounting/journal-entries',
    method: 'POST',
    summary: 'إنشاء قيد يومية',
    description: 'ينشئ قيداً يومياً مع التحقق من التوازن (مجموع المدين = مجموع الدائن)',
    tags: ['Accounting', 'GL'],
    requestBody: {
      tenantId: 'string',
      date: 'YYYY-MM-DD',
      description: 'string',
      lines: [{ accountCode: 'string', debit: 'number', credit: 'number' }],
    },
    responses: { 201: 'JournalEntry', 400: 'ValidationError' },
  },
  // ── AI ────────────────────────────────────────────────────────────────────
  {
    path: '/api/ai/copilot',
    method: 'POST',
    summary: 'المساعد الذكي (AI Copilot)',
    description: 'NLQ + RAG: يُجيب على أسئلة ERP باللغة الطبيعية مع citations',
    tags: ['AI', 'RAG'],
    requestBody: {
      tenantId: 'string',
      query: 'string',
      persona: 'cfo | auditor | base',
    },
    responses: { 200: 'CopilotResponse', 400: 'Error' },
  },
];

// ─── Spec Builder ─────────────────────────────────────────────────────────────

function buildSpec() {
  const paths: Record<string, any> = {};

  for (const route of ROUTE_REGISTRY) {
    const method = route.method.toLowerCase();
    if (!paths[route.path]) paths[route.path] = {};

    const op: any = {
      summary:     route.summary,
      description: route.description,
      tags:        route.tags,
      operationId: `${method}_${route.path.replace(/\//g, '_').replace(/[^a-zA-Z_]/g, '')}`,
      responses:   {},
    };

    // Query parameters
    if (route.params) {
      op.parameters = Object.entries(route.params).map(([name, p]) => ({
        name,
        in:          'query',
        required:    p.required ?? false,
        description: p.description,
        schema:      { type: p.type },
      }));
    }

    // Request body
    if (route.requestBody) {
      op.requestBody = {
        required: true,
        content: {
          'application/json': {
            schema: {
              type:       'object',
              properties: Object.fromEntries(
                Object.entries(route.requestBody).map(([k, v]) => [k, { type: 'string', example: v }])
              ),
            },
          },
        },
      };
    }

    // Responses
    for (const [code, schema] of Object.entries(route.responses ?? {})) {
      op.responses[code] = {
        description: code === '200' || code === '201' ? 'Success' : 'Error',
        content: {
          'application/json': {
            schema: { $ref: `#/components/schemas/${schema}` },
          },
        },
      };
    }

    paths[route.path][method] = op;
  }

  return {
    openapi: '3.1.0',
    info: {
      title:       'NamaSoft ERP API',
      version:     '9.3.0',
      description: 'نظام ERP متكامل — محاسبة، HR، مبيعات، مشتريات، مستودعات، ZATCA',
      contact: {
        name:  'NamaSoft Support',
        email: 'support@namasoft.com',
      },
      license: { name: 'Proprietary' },
    },
    servers: [
      { url: 'https://namainvist.com',      description: 'Production' },
      { url: 'https://staging.namasoft.com', description: 'Staging' },
      { url: 'http://localhost:3000',         description: 'Development' },
    ],
    tags: [
      { name: 'Finance',     description: 'التدفقات النقدية، الميزانية، IFRS' },
      { name: 'Accounting',  description: 'دفتر الأستاذ، القيود، التقارير' },
      { name: 'ZATCA',       description: 'فوترة إلكترونية، VAT، reverse charge' },
      { name: 'HR',          description: 'الموارد البشرية، الرواتب، GOSI' },
      { name: 'IFRS',        description: 'معايير IFRS 16، IAS 7، IAS 37' },
      { name: 'Budget',      description: 'الموازنة والتنبؤ المالي' },
      { name: 'AP',          description: 'الذمم الدائنة والموردين' },
      { name: 'AI',          description: 'المساعد الذكي وRAG' },
      { name: 'VAT',         description: 'ضريبة القيمة المضافة' },
      { name: 'RAG',         description: 'Retrieval Augmented Generation' },
      { name: 'GL',          description: 'دفتر الأستاذ العام' },
    ],
    paths,
    components: {
      securitySchemes: {
        BearerAuth: {
          type:         'http',
          scheme:       'bearer',
          bearerFormat: 'JWT',
        },
        ApiKey: {
          type: 'apiKey',
          in:   'header',
          name: 'x-api-key',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error:   { type: 'string' },
            details: { type: 'object' },
          },
        },
        IndirectCashFlowResult: {
          type: 'object',
          properties: {
            netIncome:          { type: 'number' },
            nonCashAdjustments: { type: 'number' },
            workingCapital:     { type: 'number' },
            operatingCF:        { type: 'number' },
            investingCF:        { type: 'number' },
            financingCF:        { type: 'number' },
            netChange:          { type: 'number' },
            isReconciled:       { type: 'boolean' },
            reconciliationDiff: { type: 'number' },
            lines:              { type: 'array', items: { type: 'object' } },
          },
        },
        ReverseChargeResult: {
          type: 'object',
          properties: {
            isReverseCharge: { type: 'boolean' },
            vatAmount:       { type: 'number' },
            journalLines:    { type: 'array', items: { type: 'object' } },
          },
        },
        CommitmentsRegister: {
          type: 'object',
          properties: {
            asOf:        { type: 'string' },
            items:       { type: 'array', items: { type: 'object' } },
            disclosure:  { type: 'object' },
          },
        },
        IFRS16LeaseResult: {
          type: 'object',
          properties: {
            leaseId:                { type: 'integer' },
            rouAssetValue:          { type: 'number' },
            initialLeaseLiability:  { type: 'number' },
            totalInterestExpense:   { type: 'number' },
            isExempt:               { type: 'boolean' },
          },
        },
      },
    },
    security: [{ BearerAuth: [] }],
  };
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const format = searchParams.get('format') ?? 'json';

  const spec = buildSpec();

  if (format === 'yaml') {
    // Simple JSON→YAML conversion (no external deps)
    const yaml = jsonToYaml(spec, 0);
    return new Response(yaml, {
      headers: { 'Content-Type': 'text/yaml; charset=utf-8' },
    });
  }

  return NextResponse.json(spec, {
    headers: {
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

// ─── Lightweight JSON → YAML ──────────────────────────────────────────────────

function jsonToYaml(obj: any, depth: number): string {
  const indent = '  '.repeat(depth);
  if (obj === null) return 'null';
  if (typeof obj === 'boolean') return String(obj);
  if (typeof obj === 'number') return String(obj);
  if (typeof obj === 'string') {
    if (obj.includes('\n') || obj.includes(':') || obj.startsWith('{')) {
      return `"${obj.replace(/"/g, '\\"')}"`;
    }
    return obj;
  }
  if (Array.isArray(obj)) {
    if (obj.length === 0) return '[]';
    return '\n' + obj.map(item => `${indent}- ${jsonToYaml(item, depth + 1)}`).join('\n');
  }
  if (typeof obj === 'object') {
    const entries = Object.entries(obj);
    if (entries.length === 0) return '{}';
    return '\n' + entries.map(([k, v]) => {
      const val = jsonToYaml(v, depth + 1);
      return `${indent}${k}: ${val}`;
    }).join('\n');
  }
  return String(obj);
}

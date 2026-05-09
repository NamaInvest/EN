/**
 * OpenAPI Spec Generator
 * =========================================================
 * Auto-generates OpenAPI 3.1 spec from:
 * 1. All route.ts files (paths + methods)
 * 2. Existing Zod schemas (request body shapes)
 * 3. withRoute options (security + rate limits)
 * 
 * Output: public/openapi.json + IMPROVEMENT_PLAN/API_SPEC.md
 * =========================================================
 */

const fs   = require('fs');
const path = require('path');

function walk(dir) {
  let r = [];
  try {
    for (const f of fs.readdirSync(dir)) {
      const full = path.join(dir, f);
      if (fs.statSync(full).isDirectory()) r = r.concat(walk(full));
      else if (f === 'route.ts') r.push(full);
    }
  } catch {}
  return r;
}

const routes  = walk('src/app/api');
const apiBase = path.join(process.cwd(), 'src', 'app', 'api');

const spec = {
  openapi: '3.1.0',
  info: {
    title:       'NamaSoft ERP API',
    description: 'نظام إدارة موارد المؤسسة — واجهة برمجية متكاملة',
    version:     '9.3.0',
    contact: {
      name:  'NamaSoft Support',
      email: 'support@namasoft.sa',
    },
  },
  servers: [
    { url: 'https://erp.namasoft.sa/api', description: 'Production' },
    { url: 'http://localhost:3000/api',   description: 'Development' },
  ],
  security:    [{ BearerAuth: [] }],
  components: {
    securitySchemes: {
      BearerAuth: {
        type:         'http',
        scheme:       'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      Error: {
        type:       'object',
        properties: {
          error:   { type: 'string', description: 'رسالة الخطأ' },
          details: { type: 'object', description: 'تفاصيل خطأ التحقق من البيانات' },
        },
      },
      PaginatedResponse: {
        type:       'object',
        properties: {
          items: { type: 'array', items: {} },
          total: { type: 'integer' },
          page:  { type: 'integer' },
          pages: { type: 'integer' },
        },
      },
    },
  },
  paths: {},
  tags: [],
};

// ── Tag groups ─────────────────────────────────────────────────────────────

const TAG_MAP = {
  'accounting':   { name: 'Accounting', description: 'المحاسبة والقيود' },
  'expenses':     { name: 'Expenses', description: 'إدارة المصروفات' },
  'purchases':    { name: 'Purchases', description: 'فواتير الشراء' },
  'sales':        { name: 'Sales', description: 'فواتير البيع' },
  'sales-returns':{ name: 'Sales Returns', description: 'مرتجعات المبيعات' },
  'purchase-returns':{ name: 'Purchase Returns', description: 'مرتجعات المشتريات' },
  'inventory':    { name: 'Inventory', description: 'إدارة المخزون' },
  'stock-transfers':{ name: 'Stock Transfers', description: 'تحويلات المخزون' },
  'adjustments':  { name: 'Adjustments', description: 'التسويات الجردية' },
  'grn':          { name: 'GRN', description: 'سندات الاستلام' },
  'manufacturing':{ name: 'Manufacturing', description: 'أوامر الإنتاج' },
  'payroll':      { name: 'Payroll', description: 'مسير الرواتب' },
  'hr':           { name: 'HR', description: 'الموارد البشرية' },
  'treasury':     { name: 'Treasury', description: 'الخزينة والبنوك' },
  'products':     { name: 'Products', description: 'إدارة المنتجات' },
  'customers':    { name: 'Customers', description: 'إدارة العملاء' },
  'suppliers':    { name: 'Suppliers', description: 'إدارة الموردين' },
  'users':        { name: 'Users', description: 'إدارة المستخدمين' },
  'auth':         { name: 'Auth', description: 'المصادقة وإدارة الجلسات' },
  'reports':      { name: 'Reports', description: 'التقارير والتحليلات' },
  'settings':     { name: 'Settings', description: 'إعدادات النظام' },
  'zatca':        { name: 'ZATCA', description: 'الربط مع هيئة الزكاة والضريبة' },
  'ai':           { name: 'AI', description: 'خدمات الذكاء الاصطناعي' },
};

const addedTags = new Set();

// ── Rate limit descriptions ─────────────────────────────────────────────────

const RATE_LIMIT_DESC = {
  DEFAULT:   '100 req/min',
  FINANCIAL: '30 req/min',
  AI:        '10 req/min',
  AUTH:      '5 req/min',
  ADMIN:     '20 req/min',
  UPLOAD:    '10 req/min',
  CRON:      'Internal only',
  PUBLIC:    '200 req/min',
};

// ── Process routes ──────────────────────────────────────────────────────────

let processedRoutes = 0;

for (const filePath of routes) {
  const content    = fs.readFileSync(filePath, 'utf8');
  const relPath    = path.relative(apiBase, filePath).replace(/\\/g, '/');
  const pathParts  = relPath.replace('/route.ts', '');
  
  // Convert Next.js [param] → {param} for OpenAPI
  const apiPath    = '/' + pathParts.replace(/\[([^\]]+)\]/g, '{$1}');
  
  // Detect methods
  const methods = [];
  if (content.includes('export const GET')  || content.includes('async function _GET'))  methods.push('get');
  if (content.includes('export const POST') || content.includes('async function _POST')) methods.push('post');
  if (content.includes('export const PUT')  || content.includes('async function _PUT'))  methods.push('put');
  if (content.includes('export const PATCH')|| content.includes('async function _PATCH')) methods.push('patch');
  if (content.includes('export const DELETE')|| content.includes('async function _DELETE')) methods.push('delete');

  if (methods.length === 0) continue;

  // Determine tag from first path segment
  const firstSegment = pathParts.split('/')[0];
  const tag          = TAG_MAP[firstSegment]?.name || firstSegment;
  
  if (!addedTags.has(tag)) {
    addedTags.add(tag);
    spec.tags.push({
      name:        tag,
      description: TAG_MAP[firstSegment]?.description || firstSegment,
    });
  }

  // Detect rate limit tier
  const rateLimitM = content.match(/rateLimit:\s*'([A-Z]+)'/);
  const rateLimit  = rateLimitM ? RATE_LIMIT_DESC[rateLimitM[1]] || rateLimitM[1] : '100 req/min';

  // Detect Zod schema fields for request body
  const zodFields = [];
  for (const m of content.matchAll(/(\w+):\s*z\.(string|number|boolean|array|object|union|enum)\(/g)) {
    if (!['_parsed', '_parsedPOST', '_parsedPUT'].includes(m[1])) {
      zodFields.push(m[1]);
    }
  }

  // Detect roles
  const rolesM = content.match(/roles:\s*\[([^\]]+)\]/);
  const roles  = rolesM ? rolesM[1].split(',').map(r => r.trim().replace(/'/g, '')) : ['authenticated'];

  // Build path item
  if (!spec.paths[apiPath]) spec.paths[apiPath] = {};

  for (const method of methods) {
    const isWrite = ['post', 'put', 'patch'].includes(method);

    spec.paths[apiPath][method] = {
      tags:        [tag],
      summary:     `${method.toUpperCase()} ${apiPath}`,
      description: [
        `Rate limit: ${rateLimit}`,
        roles.length ? `Required roles: ${roles.join(', ')}` : 'Public',
        zodFields.length ? `Validated fields: ${zodFields.slice(0, 8).join(', ')}` : '',
      ].filter(Boolean).join('\n'),
      security:    [{ BearerAuth: [] }],
      parameters:  pathParts.match(/\[([^\]]+)\]/g)?.map(p => ({
        name:     p.replace(/[\[\]]/g, ''),
        in:       'path',
        required: true,
        schema:   { type: 'string' },
      })) || [],
      ...(isWrite && zodFields.length > 0 ? {
        requestBody: {
          required: true,
          content:  {
            'application/json': {
              schema: {
                type:       'object',
                properties: Object.fromEntries(
                  zodFields.slice(0, 15).map(f => [f, { type: 'string', description: f }])
                ),
              },
            },
          },
        },
      } : {}),
      responses: {
        '200': { description: 'Success', content: { 'application/json': { schema: {} } } },
        '201': { description: 'Created' },
        '400': { description: 'Validation Error', content: { 'application/json': { schema: { '$ref': '#/components/schemas/Error' } } } },
        '401': { description: 'Unauthorized' },
        '403': { description: 'Forbidden' },
        '429': { description: `Rate limited (${rateLimit})` },
        '500': { description: 'Internal Server Error' },
      },
    };
  }

  processedRoutes++;
}

// ── Write outputs ───────────────────────────────────────────────────────────

// Sort paths alphabetically
const sortedPaths = Object.keys(spec.paths).sort();
const sortedSpec  = { ...spec, paths: {} };
for (const p of sortedPaths) sortedSpec.paths[p] = spec.paths[p];

// Write JSON spec
const publicDir = path.join(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
fs.writeFileSync(path.join(publicDir, 'openapi.json'), JSON.stringify(sortedSpec, null, 2), 'utf8');

// Write Markdown summary
const mdLines = [
  '# NamaSoft ERP — API Reference',
  '',
  `> Auto-generated from ${processedRoutes} route files | Version 9.3.0`,
  '',
  '## Authentication',
  'All endpoints require `Authorization: Bearer <JWT>` header.',
  '',
  '## Rate Limits',
  '| Tier | Limit | Used For |',
  '|------|-------|---------|',
  '| DEFAULT   | 100/min | General reads |',
  '| FINANCIAL | 30/min  | Financial mutations |',
  '| AI        | 10/min  | AI/LLM calls |',
  '| AUTH      | 5/min   | Login attempts |',
  '| UPLOAD    | 10/min  | File uploads |',
  '',
  '## Endpoints by Module',
  '',
];

const grouped = {};
for (const [p, item] of Object.entries(sortedSpec.paths)) {
  const tag = Object.values(item)[0]?.tags?.[0] || 'Other';
  if (!grouped[tag]) grouped[tag] = [];
  const methods = Object.keys(item).map(m => m.toUpperCase()).join(', ');
  grouped[tag].push(`- \`${methods} ${p}\``);
}

for (const [tag, paths] of Object.entries(grouped).sort()) {
  mdLines.push(`### ${tag}`);
  mdLines.push(...paths);
  mdLines.push('');
}

mdLines.push(`---`);
mdLines.push(`*Generated: ${new Date().toISOString()}*`);

fs.writeFileSync(
  path.join(process.cwd(), 'IMPROVEMENT_PLAN', 'API_REFERENCE.md'),
  mdLines.join('\n'),
  'utf8'
);

console.log(`\n=== OpenAPI Spec Generated ===`);
console.log(`Routes processed:    ${processedRoutes}`);
console.log(`API paths:           ${sortedPaths.length}`);
console.log(`Tags/modules:        ${addedTags.size}`);
console.log(`Output (JSON):       public/openapi.json`);
console.log(`Output (Markdown):   IMPROVEMENT_PLAN/API_REFERENCE.md`);
console.log(`\n✅ OpenAPI 3.1 spec ready`);

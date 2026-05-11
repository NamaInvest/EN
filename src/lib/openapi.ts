import { logger } from '@/lib/logger';

const log = logger.child({ service: 'openapi' });

/**
 * OpenAPI Specification — NamaInvest ERP
 * ─────────────────────────────────────────────────────────────────────────────
 * Version: 3.1.0
 * Auto-serves at: GET /api/docs/openapi.json
 * Interactive UI:  GET /api/docs
 *
 * Coverage:
 *   Auth, Sales, Purchases, Inventory, Accounting, HR, Payroll,
 *   ZATCA, Customers, Products, POS, Reports, Approvals, Settings, System
 */

// ── Reusable response schemas ─────────────────────────────────────────────────
const ErrorResponse = {
  type: 'object',
  properties: {
    error: { type: 'string', example: 'Something went wrong' },
    details: { type: 'object' },
  },
};

const SuccessResponse = {
  type: 'object',
  properties: {
    success: { type: 'boolean', example: true },
    message: { type: 'string' },
    id: { type: 'integer' },
  },
};

const PaginationParams = [
  { name: 'page',  in: 'query', schema: { type: 'integer', default: 1 } },
  { name: 'limit', in: 'query', schema: { type: 'integer', default: 50, maximum: 500 } },
  { name: 'search', in: 'query', schema: { type: 'string' } },
];

const IdParam = { name: 'id', in: 'path', required: true, schema: { type: 'integer' } };

// ── Helper to generate standard CRUD path entries ─────────────────────────────
function crudPaths(
  tag: string,
  basePath: string,
  summaryBase: string,
  createSchema?: object,
) {
  return {
    [basePath]: {
      get: {
        tags: [tag], summary: `List ${summaryBase}`,
        operationId: `list${summaryBase.replace(/\s/g, '')}`,
        parameters: PaginationParams,
        responses: {
          '200': { description: `List of ${summaryBase}` },
          '401': { description: 'Unauthorized', content: { 'application/json': { schema: ErrorResponse } } },
        },
      },
      ...(createSchema && {
        post: {
          tags: [tag], summary: `Create ${summaryBase}`,
          operationId: `create${summaryBase.replace(/\s/g, '')}`,
          parameters: [{ name: 'X-Idempotency-Key', in: 'header', schema: { type: 'string', format: 'uuid' }, description: 'Idempotency key to prevent duplicates' }],
          requestBody: { required: true, content: { 'application/json': { schema: createSchema } } },
          responses: {
            '201': { description: 'Created', content: { 'application/json': { schema: SuccessResponse } } },
            '400': { description: 'Validation error', content: { 'application/json': { schema: ErrorResponse } } },
          },
        },
      }),
    },
    [`${basePath}/{id}`]: {
      parameters: [IdParam],
      get: {
        tags: [tag], summary: `Get ${summaryBase} by ID`,
        operationId: `get${summaryBase.replace(/\s/g, '')}ById`,
        responses: { '200': { description: 'Found' }, '404': { description: 'Not found' } },
      },
      put: {
        tags: [tag], summary: `Update ${summaryBase}`,
        operationId: `update${summaryBase.replace(/\s/g, '')}`,
        requestBody: { content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { '200': { description: 'Updated' }, '404': { description: 'Not found' } },
      },
      delete: {
        tags: [tag], summary: `Delete ${summaryBase}`,
        operationId: `delete${summaryBase.replace(/\s/g, '')}`,
        responses: { '200': { description: 'Deleted (soft)' }, '404': { description: 'Not found' } },
      },
    },
  };
}

// ── Full Spec ─────────────────────────────────────────────────────────────────
const SPEC = {
  openapi: '3.1.0',
  info: {
    title: 'NamaInvest ERP API',
    version: '2.4.6',
    description: [
      '# NamaInvest ERP — Full Arabic-First API',
      '',
      'Saudi-compliant ERP with ZATCA Phase 2 integration.',
      '',
      '## Authentication',
      'All endpoints (except `/api/health` and `/api/auth/*`) require a Bearer JWT token.',
      '',
      '## Idempotency',
      'Mutation endpoints (POST) support `X-Idempotency-Key` header (UUID v4) to prevent duplicate operations.',
      '',
      '## Multi-Tenancy',
      'All data is tenant-scoped via `tenantId` extracted from the JWT token.',
    ].join('\n'),
    contact: { name: 'NamaInvest Team', email: 'dev@namainvist.com', url: 'https://namainvist.com' },
    license: { name: 'Proprietary' },
    'x-logo': { url: 'https://namainvist.com/logo.png' },
  },
  servers: [
    { url: 'https://namainvist.com', description: 'Production (Main)' },
    { url: 'https://n11.namainvist.com', description: 'N11 Tenant Node' },
    { url: 'http://localhost:3000', description: 'Development' },
  ],
  tags: [
    { name: 'Auth',      description: 'Authentication & JWT Management' },
    { name: 'Sales',     description: 'Sales Invoices, Quotes & Returns' },
    { name: 'Purchases', description: 'Purchase Orders & Bills' },
    { name: 'Inventory', description: 'Stock, Movements & Warehouses' },
    { name: 'Accounting',description: 'Journal Entries, Accounts & Closing' },
    { name: 'HR',        description: 'Employees, Leave & Attendance' },
    { name: 'Payroll',   description: 'Salary Processing & Payslips' },
    { name: 'ZATCA',     description: 'Saudi Tax Authority (FATOORA) Integration' },
    { name: 'Customers', description: 'Customer Management & Statements' },
    { name: 'Vendors',   description: 'Vendor Management & Statements' },
    { name: 'Products',  description: 'Products, Pricing & Categories' },
    { name: 'POS',       description: 'Point of Sale & Shifts' },
    { name: 'Reports',   description: 'Financial & Operational Reports' },
    { name: 'Approvals', description: 'Multi-Level Approval Workflows' },
    { name: 'Settings',  description: 'System Configuration' },
    { name: 'System',    description: 'Health, Metrics & Admin' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', description: 'JWT from /api/auth/login' },
      apiKeyAuth:  { type: 'apiKey', in: 'header', name: 'X-API-Key', description: 'Long-lived API key' },
    },
    schemas: {
      Error: ErrorResponse,
      Success: SuccessResponse,
      SalesInvoice: {
        type: 'object',
        required: ['invoiceNo', 'date', 'total'],
        properties: {
          id:          { type: 'integer' },
          invoiceNo:   { type: 'integer' },
          date:        { type: 'string', format: 'date-time' },
          customerId:  { type: 'integer', nullable: true },
          subtotal:    { type: 'number' },
          taxValue:    { type: 'number' },
          total:       { type: 'number' },
          paid:        { type: 'number' },
          remaining:   { type: 'number' },
          paymentType: { type: 'string', enum: ['cash', 'credit', 'split', 'bank_transfer'] },
          status:      { type: 'string', enum: ['draft', 'completed', 'paid', 'partial', 'cancelled'] },
          zatcaStatus: { type: 'string', enum: ['pending', 'reported', 'cleared', 'failed'] },
          zatcaQr:     { type: 'string', description: 'Base64 ZATCA QR code' },
        },
      },
      PurchaseOrder: {
        type: 'object',
        required: ['vendorId', 'total'],
        properties: {
          id:       { type: 'integer' },
          poNo:     { type: 'string' },
          vendorId: { type: 'integer' },
          status:   { type: 'string', enum: ['draft', 'submitted', 'approved', 'received', 'rejected'] },
          total:    { type: 'number' },
          date:     { type: 'string', format: 'date-time' },
        },
      },
      Employee: {
        type: 'object',
        required: ['name', 'salary'],
        properties: {
          id:            { type: 'integer' },
          name:          { type: 'string' },
          employeeNo:    { type: 'string' },
          position:      { type: 'string' },
          salary:        { type: 'number' },
          nationalId:    { type: 'string' },
          iqamaNo:       { type: 'string', description: 'Iqama (residency permit) number' },
          active:        { type: 'boolean' },
          hireDate:      { type: 'string', format: 'date' },
          gosiRegistered:{ type: 'boolean' },
        },
      },
      JournalEntry: {
        type: 'object',
        properties: {
          id:          { type: 'integer' },
          entryDate:   { type: 'string', format: 'date-time' },
          description: { type: 'string' },
          reference:   { type: 'string' },
          status:      { type: 'string', enum: ['draft', 'posted', 'reversed'] },
          totalDebit:  { type: 'number' },
          totalCredit: { type: 'number' },
        },
      },
      ApprovalRequest: {
        type: 'object',
        properties: {
          id:           { type: 'integer' },
          documentType: { type: 'string', enum: ['PURCHASE_ORDER', 'SALES_INVOICE', 'PAYMENT', 'LEAVE_REQUEST', 'JOURNAL_ENTRY'] },
          documentId:   { type: 'integer' },
          status:       { type: 'string', enum: ['pending', 'approved', 'rejected', 'auto_approved'] },
          requestedBy:  { type: 'integer' },
          requestedAt:  { type: 'string', format: 'date-time' },
          steps: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                level:      { type: 'integer' },
                status:     { type: 'string', enum: ['pending', 'approved', 'rejected'] },
                approverId: { type: 'integer', nullable: true },
                actionDate: { type: 'string', format: 'date-time', nullable: true },
              },
            },
          },
        },
      },
    },
    parameters: {
      IdPath:   { name: 'id',    in: 'path',  required: true, schema: { type: 'integer' } },
      PageQuery:{ name: 'page',  in: 'query', schema: { type: 'integer', default: 1 } },
      LimitQuery:{ name: 'limit',in: 'query', schema: { type: 'integer', default: 50 } },
      Idempotency: { name: 'X-Idempotency-Key', in: 'header', schema: { type: 'string', format: 'uuid' }, description: 'UUID v4 idempotency key' },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    // ── System ────────────────────────────────────────────────────────────────
    '/api/health': {
      get: {
        tags: ['System'], summary: 'Health Check', operationId: 'getHealth',
        description: 'Public endpoint. Returns DB connectivity, env checks, memory usage.',
        security: [],
        responses: {
          '200': { description: 'Healthy', content: { 'application/json': { schema: {
            type: 'object',
            properties: {
              status:    { type: 'string', enum: ['healthy', 'degraded'] },
              version:   { type: 'string' },
              timestamp: { type: 'string', format: 'date-time' },
              latencyMs: { type: 'integer' },
              memory:    { type: 'object', properties: { heapMb: { type: 'integer' }, rssMb: { type: 'integer' } } },
              checks:    { type: 'object', additionalProperties: { type: 'string', enum: ['ok', 'warn', 'error'] } },
            },
          } } } },
          '503': { description: 'Degraded — DB unreachable or missing envs' },
        },
      },
    },
    '/api/docs/openapi.json': {
      get: {
        tags: ['System'], summary: 'OpenAPI Spec', operationId: 'getOpenAPISpec', security: [],
        responses: { '200': { description: 'OpenAPI 3.1 JSON specification' } },
      },
    },

    // ── Auth ──────────────────────────────────────────────────────────────────
    '/api/auth/login': {
      post: {
        tags: ['Auth'], summary: 'Login', operationId: 'login', security: [],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: {
            type: 'object',
            required: ['username', 'password'],
            properties: {
              username: { type: 'string', example: 'admin' },
              password: { type: 'string', format: 'password' },
            },
          }}},
        },
        responses: {
          '200': { description: 'JWT + user info returned' },
          '401': { description: 'Invalid credentials' },
        },
      },
    },
    '/api/auth/logout': {
      post: {
        tags: ['Auth'], summary: 'Logout', operationId: 'logout',
        responses: { '200': { description: 'Session cleared' } },
      },
    },
    '/api/auth/me': {
      get: {
        tags: ['Auth'], summary: 'Get Current User', operationId: 'getCurrentUser',
        responses: { '200': { description: 'Current user profile' }, '401': { description: 'Not authenticated' } },
      },
    },

    // ── Sales ─────────────────────────────────────────────────────────────────
    ...crudPaths('Sales', '/api/sales', 'Sales Invoices', {
      type: 'object',
      required: ['customerId', 'items'],
      properties: {
        customerId: { type: 'integer' },
        date:       { type: 'string', format: 'date-time' },
        paymentType:{ type: 'string', enum: ['cash', 'credit', 'split'] },
        items: { type: 'array', items: { type: 'object', properties: {
          productId: { type: 'integer' }, quantity: { type: 'number' }, price: { type: 'number' },
        }}},
      },
    }),
    '/api/sales/{id}/zatca-report': {
      post: {
        tags: ['Sales', 'ZATCA'], summary: 'Report Invoice to ZATCA', operationId: 'reportSalesInvoiceToZatca',
        parameters: [IdParam],
        responses: { '200': { description: 'Reported — QR generated' }, '400': { description: 'ZATCA error' } },
      },
    },

    // ── Purchases ─────────────────────────────────────────────────────────────
    ...crudPaths('Purchases', '/api/purchases', 'Purchase Invoices'),
    ...crudPaths('Purchases', '/api/purchase-orders', 'Purchase Orders', {
      type: 'object',
      required: ['vendorId', 'items'],
      properties: {
        vendorId:  { type: 'integer' },
        items: { type: 'array', items: { type: 'object' } },
      },
    }),
    '/api/purchase-orders/{id}/submit': {
      post: {
        tags: ['Purchases', 'Approvals'], summary: 'Submit PO for Approval', operationId: 'submitPurchaseOrderForApproval',
        parameters: [IdParam],
        responses: { '200': { description: 'Submitted' }, '404': { description: 'Not found' } },
      },
    },

    // ── Accounting ────────────────────────────────────────────────────────────
    ...crudPaths('Accounting', '/api/accounting/journal', 'Journal Entries', {
      type: 'object',
      required: ['entryDate', 'lines'],
      properties: {
        entryDate:   { type: 'string', format: 'date-time' },
        description: { type: 'string' },
        reference:   { type: 'string' },
        lines: {
          type: 'array',
          items: { type: 'object', properties: {
            accountId: { type: 'integer' }, debit: { type: 'number' }, credit: { type: 'number' },
          }},
        },
      },
    }),
    '/api/accounting/trial-balance': {
      get: {
        tags: ['Accounting'], summary: 'Trial Balance', operationId: 'getTrialBalance',
        parameters: [
          { name: 'from', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'to',   in: 'query', schema: { type: 'string', format: 'date' } },
        ],
        responses: { '200': { description: 'Trial balance data' } },
      },
    },
    '/api/accounting/chart-of-accounts': {
      get: { tags: ['Accounting'], summary: 'Chart of Accounts', operationId: 'getChartOfAccounts', responses: { '200': { description: 'Account tree' } } },
    },

    // ── Inventory ─────────────────────────────────────────────────────────────
    ...crudPaths('Inventory', '/api/products', 'Products'),
    ...crudPaths('Inventory', '/api/inventory/movements', 'Inventory Movements'),
    '/api/inventory/stock-valuation': {
      get: { tags: ['Inventory'], summary: 'Stock Valuation', operationId: 'getStockValuation', responses: { '200': { description: 'Current stock values' } } },
    },

    // ── HR & Payroll ──────────────────────────────────────────────────────────
    ...crudPaths('HR', '/api/employees', 'Employees', {
      type: 'object',
      required: ['name', 'salary'],
      properties: {
        name:       { type: 'string' },
        salary:     { type: 'number' },
        nationalId: { type: 'string' },
      },
    }),
    '/api/employees/salary': {
      post: { tags: ['Payroll'], summary: 'Process Monthly Salary', operationId: 'processMonthlySalary', responses: { '201': { description: 'Payroll processed' } } },
    },
    '/api/employees/leave': {
      get:  { tags: ['HR'], summary: 'List Leave Requests', operationId: 'listLeaveRequests', responses: { '200': { description: 'Leave requests' } } },
      post: { tags: ['HR'], summary: 'Submit Leave Request', operationId: 'submitLeaveRequest', responses: { '201': { description: 'Submitted for approval' } } },
    },
    '/api/gosi/contributions': {
      get: { tags: ['HR'], summary: 'GOSI Contributions', operationId: 'getGOSIContributions', responses: { '200': { description: 'Monthly GOSI contributions' } } },
    },

    // ── Customers & Vendors ───────────────────────────────────────────────────
    ...crudPaths('Customers', '/api/customers', 'Customers'),
    '/api/customers/{id}/statement': {
      get: { tags: ['Customers'], summary: 'Customer Statement', operationId: 'getCustomerStatement',
        parameters: [IdParam], responses: { '200': { description: 'Account statement + aging' } } },
    },
    ...crudPaths('Vendors', '/api/vendors', 'Vendors'),

    // ── Approvals ─────────────────────────────────────────────────────────────
    '/api/approvals': {
      get: {
        tags: ['Approvals'], summary: 'List All Approval Requests', operationId: 'listApprovalRequests',
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['pending', 'approved', 'rejected'] } },
          ...PaginationParams,
        ],
        responses: { '200': { description: 'List of approval requests', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/ApprovalRequest' } } } } } },
      },
    },
    '/api/approvals/inbox': {
      get: {
        tags: ['Approvals'], summary: "My Pending Approvals (Inbox)", operationId: 'getApprovalInbox',
        responses: { '200': { description: 'Pending items for current user' } },
      },
    },
    '/api/approvals/{id}/approve': {
      post: {
        tags: ['Approvals'], summary: 'Approve Request', operationId: 'approveRequest',
        parameters: [IdParam],
        requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { notes: { type: 'string' } } } } } },
        responses: {
          '200': { description: 'Approved — fullyApproved flag in response' },
          '403': { description: 'Not authorized to approve this step' },
          '404': { description: 'Request not found or already resolved' },
        },
      },
    },
    '/api/approvals/{id}/reject': {
      post: {
        tags: ['Approvals'], summary: 'Reject Request', operationId: 'rejectRequest',
        parameters: [IdParam],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['reason'], properties: { reason: { type: 'string', minLength: 5 } } } } } },
        responses: { '200': { description: 'Rejected' }, '404': { description: 'Not found' } },
      },
    },

    // ── POS ───────────────────────────────────────────────────────────────────
    '/api/pos/checkout': {
      post: {
        tags: ['POS'], summary: 'POS Checkout (create invoice)', operationId: 'posCheckout',
        parameters: [{ name: 'X-Idempotency-Key', in: 'header', schema: { type: 'string', format: 'uuid' } }],
        responses: { '200': { description: 'Invoice created + ZATCA QR returned' } },
      },
    },
    '/api/pos/shifts': {
      get:  { tags: ['POS'], summary: 'List Shifts',  operationId: 'listShifts',  responses: { '200': { description: 'Shifts' } } },
      post: { tags: ['POS'], summary: 'Open Shift',   operationId: 'openShift',   responses: { '201': { description: 'Shift opened' } } },
    },

    // ── ZATCA ─────────────────────────────────────────────────────────────────
    '/api/zatca/report': {
      post: { tags: ['ZATCA'], summary: 'Report Invoice', operationId: 'zatcaReport', responses: { '200': { description: 'Reported to FATOORA' } } },
    },
    '/api/zatca/status/{id}': {
      get: { tags: ['ZATCA'], summary: 'ZATCA Status', operationId: 'getZatcaStatus',
        parameters: [IdParam], responses: { '200': { description: 'Current ZATCA status + UUID' } } },
    },

    // ── Reports ───────────────────────────────────────────────────────────────
    '/api/reports/financial-statements': {
      get: { tags: ['Reports'], summary: 'Financial Statements (P&L, Balance Sheet)', operationId: 'getFinancialStatements',
        parameters: [
          { name: 'type',  in: 'query', schema: { type: 'string', enum: ['income_statement', 'balance_sheet', 'cash_flow'] } },
          { name: 'from',  in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'to',    in: 'query', schema: { type: 'string', format: 'date' } },
        ],
        responses: { '200': { description: 'Financial statement data + chart data' } },
      },
    },
    '/api/reports/sales-summary': {
      get: { tags: ['Reports'], summary: 'Sales Summary Report', operationId: 'getSalesSummary', responses: { '200': { description: 'Sales by period' } } },
    },
    '/api/reports/inventory-aging': {
      get: { tags: ['Reports'], summary: 'Inventory Aging Report', operationId: 'getInventoryAging', responses: { '200': { description: 'Aging data by product' } } },
    },

    // ── Dashboard & KPIs ──────────────────────────────────────────────────────
    '/api/dashboard': {
      get: {
        tags: ['Dashboard'], summary: 'Dashboard KPIs', operationId: 'getDashboard',
        description: 'Returns revenue, expenses, profit, and pending approval counts for the current period.',
        responses: { '200': { description: 'KPI snapshot', content: { 'application/json': { schema: {
          type: 'object',
          properties: {
            revenue:         { type: 'number', example: 125000 },
            expenses:        { type: 'number', example: 45000 },
            profit:          { type: 'number', example: 80000 },
            pendingApprovals:{ type: 'integer', example: 3 },
            period:          { type: 'string', example: '2026-05' },
          },
        } } } } },
      },
    },

    // ── Inventory & Stock ─────────────────────────────────────────────────────
    '/api/stock': {
      get: {
        tags: ['Inventory'], summary: 'Stock Summary', operationId: 'getStock',
        parameters: [
          { name: 'search',    in: 'query', schema: { type: 'string' } },
          { name: 'stockId',   in: 'query', schema: { type: 'integer' } },
          ...PaginationParams,
        ],
        responses: { '200': { description: 'Product stock levels per warehouse' } },
      },
    },
    '/api/inventory/stocktake': {
      get:  { tags: ['Inventory'], summary: 'List Stocktake Sessions', operationId: 'listStocktakeSessions', responses: { '200': { description: 'Stocktake sessions' } } },
      post: {
        tags: ['Inventory'], summary: 'Create Stocktake Session', operationId: 'createStocktakeSession',
        requestBody: { required: true, content: { 'application/json': { schema: {
          type: 'object', required: ['stockId'],
          properties: { stockId: { type: 'integer' }, reference: { type: 'string' }, notes: { type: 'string' } },
        } } } },
        responses: { '201': { description: 'Session created' } },
      },
    },

    // ── Manufacturing ─────────────────────────────────────────────────────────
    '/api/manufacturing/stats': {
      get: {
        tags: ['Manufacturing'], summary: 'Manufacturing KPIs', operationId: 'getManufacturingStats',
        responses: { '200': { description: 'Production orders, completion rate, efficiency' } },
      },
    },
    '/api/manufacturing/standard-cost': {
      get:  { tags: ['Manufacturing'], summary: 'Standard Cost Versions', operationId: 'getStandardCost', responses: { '200': { description: 'Active standard cost versions' } } },
      post: { tags: ['Manufacturing'], summary: 'Create Standard Cost Version', operationId: 'createStandardCost', responses: { '201': { description: 'Version created' } } },
    },
    '/api/manufacturing/subcontracting': {
      get:  { tags: ['Manufacturing'], summary: 'List Subcontracting POs', operationId: 'listSubcontracting', responses: { '200': { description: 'Subcontracting purchase orders' } } },
      post: { tags: ['Manufacturing'], summary: 'Create Subcontracting PO', operationId: 'createSubcontracting', responses: { '201': { description: 'PO created' } } },
    },

    // ── Quality Management ────────────────────────────────────────────────────
    '/api/quality/stats': {
      get: {
        tags: ['Quality'], summary: 'Quality KPIs', operationId: 'getQualityStats',
        responses: { '200': { description: 'Pass/fail rate, total inspections', content: { 'application/json': { schema: {
          type: 'object',
          properties: {
            total:    { type: 'integer' },
            passed:   { type: 'integer' },
            failed:   { type: 'integer' },
            pending:  { type: 'integer' },
            passRate: { type: 'number', description: 'Percentage 0-100' },
          },
        } } } } },
      },
    },

    // ── Treasury ──────────────────────────────────────────────────────────────
    '/api/treasury/dashboard': {
      get: {
        tags: ['Treasury'], summary: 'Treasury Dashboard', operationId: 'getTreasuryDashboard',
        responses: { '200': { description: 'Total in, total out, net balance, recent transactions' } },
      },
    },

    // ── Fixed Assets ──────────────────────────────────────────────────────────
    '/api/accounting/fixed-assets': {
      get:  { tags: ['Accounting'], summary: 'List Fixed Assets', operationId: 'listFixedAssets', parameters: [...PaginationParams], responses: { '200': { description: 'Fixed assets list' } } },
      post: { tags: ['Accounting'], summary: 'Create Fixed Asset', operationId: 'createFixedAsset', responses: { '201': { description: 'Asset created' } } },
    },

    // ── Webhooks ──────────────────────────────────────────────────────────────
    '/api/webhooks': {
      get: {
        tags: ['Webhooks'], summary: 'List Webhook Subscriptions', operationId: 'listWebhooks',
        parameters: [{ name: 'view', in: 'query', schema: { type: 'string', enum: ['subscriptions', 'events', 'deliveries'] } }],
        responses: { '200': { description: 'Subscriptions or events catalog' } },
      },
      post: {
        tags: ['Webhooks'], summary: 'Create Webhook Subscription', operationId: 'createWebhook',
        requestBody: { required: true, content: { 'application/json': { schema: {
          type: 'object', required: ['url', 'events'],
          properties: {
            url:    { type: 'string', format: 'uri' },
            events: { type: 'array', items: { type: 'string' } },
            secret: { type: 'string', description: 'Optional HMAC signing secret' },
          },
        } } } },
        responses: { '201': { description: 'Subscription created with signingKey' } },
      },
    },
    '/api/webhooks/{id}/rotate-secret': {
      post: {
        tags: ['Webhooks'], summary: 'Rotate Webhook Signing Secret', operationId: 'rotateWebhookSecret',
        parameters: [IdParam], responses: { '200': { description: 'New signing key returned' } },
      },
    },

    // ── API Keys ──────────────────────────────────────────────────────────────
    '/api/settings/api-keys': {
      get:  { tags: ['Settings'], summary: 'List API Keys', operationId: 'listApiKeys', responses: { '200': { description: 'Keys list (hashed, never plaintext)' } } },
      post: {
        tags: ['Settings'], summary: 'Create API Key', operationId: 'createApiKey',
        description: 'Returns the raw key ONCE. Store it securely — it cannot be retrieved again.',
        requestBody: { required: true, content: { 'application/json': { schema: {
          type: 'object', required: ['name'],
          properties: {
            name:          { type: 'string', example: 'Production Integration' },
            scopes:        { type: 'array', items: { type: 'string' }, example: ['read', 'write'] },
            expiresInDays: { type: 'integer', example: 365 },
          },
        } } } },
        responses: {
          '201': { description: 'Created — rawKey shown ONCE', content: { 'application/json': { schema: {
            type: 'object', properties: { rawKey: { type: 'string', example: 'nma_ab1234...' }, id: { type: 'integer' } },
          } } } },
        },
      },
    },
    '/api/settings/api-keys/{id}': {
      delete: { tags: ['Settings'], summary: 'Revoke API Key', operationId: 'revokeApiKey', parameters: [IdParam], responses: { '200': { description: 'Key revoked' } } },
      patch:  { tags: ['Settings'], summary: 'Update API Key (name/scopes)', operationId: 'updateApiKey', parameters: [IdParam], responses: { '200': { description: 'Updated' } } },
    },

    // ── System & Observability ────────────────────────────────────────────────
    '/api/metrics': {
      get: {
        tags: ['System'], summary: 'Prometheus Metrics', operationId: 'getMetrics',
        description: 'Prometheus text format 0.0.4. Scrape with: GET /api/metrics',
        security: [],
        responses: { '200': { description: 'Prometheus text', content: { 'text/plain': {} } } },
      },
    },

    // ── AI / RAG ──────────────────────────────────────────────────────────────
    '/api/ai/chat': {
      post: {
        tags: ['AI'], summary: 'AI Chat (RAG-powered)', operationId: 'aiChat',
        requestBody: { required: true, content: { 'application/json': { schema: {
          type: 'object', required: ['message'],
          properties: { message: { type: 'string' }, context: { type: 'string' } },
        } } } },
        responses: { '200': { description: 'AI response with citations' } },
      },
    },
    '/api/ai/ingest': {
      post: {
        tags: ['AI'], summary: 'Ingest Document into RAG', operationId: 'ingestDocument',
        requestBody: { required: true, content: { 'application/json': { schema: {
          type: 'object', required: ['content'],
          properties: { id: { type: 'string' }, content: { type: 'string' }, title: { type: 'string' }, metadata: { type: 'object' } },
        } } } },
        responses: { '200': { description: 'Document chunked and embedded into pgvector' } },
      },
    },

    // ── NEW: Financial Statements ─────────────────────────────────────────────
    '/api/accounting/financial-statements': {
      get: {
        tags: ['Accounting', 'Reports'], summary: 'On-demand Financial Statements (P&L, BS, CF, TB)', operationId: 'getFinancialStatementsGL',
        parameters: [
          { name: 'tenantId', in: 'query', required: true,  schema: { type: 'string' } },
          { name: 'type',     in: 'query', schema: { type: 'string', enum: ['INCOME_STATEMENT','BALANCE_SHEET','CASH_FLOW','TRIAL_BALANCE','ALL'], default: 'ALL' } },
          { name: 'from',     in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'to',       in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'compare',  in: 'query', schema: { type: 'boolean', default: true } },
        ],
        responses: { '200': { description: 'P&L + BS + CF + Trial Balance from posted GL' } },
      },
    },

    // ── NEW: AR/AP Aging ──────────────────────────────────────────────────────
    '/api/accounting/aging': {
      get: {
        tags: ['Accounting', 'Reports'], summary: 'AR/AP Aging Report (SOCPA 6-bucket)', operationId: 'getAgingReport',
        parameters: [
          { name: 'type',     in: 'query', schema: { type: 'string', enum: ['AR','AP'], default: 'AR' } },
          { name: 'tenantId', in: 'query', required: true, schema: { type: 'string' } },
          { name: 'asOf',     in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'top',      in: 'query', schema: { type: 'integer', default: 0 }, description: '0 = all entities' },
        ],
        responses: {
          '200': {
            description: 'Aging by entity: current, 1-30, 31-60, 61-90, 91-120, >120 days + risk summary',
          },
        },
      },
    },

    // ── NEW: Treasury ─────────────────────────────────────────────────────────
    '/api/finance/treasury': {
      get: {
        tags: ['Treasury'], summary: 'Cash Position + Forecast + Realized FX', operationId: 'getTreasury',
        parameters: [
          { name: 'tenantId', in: 'query', required: true, schema: { type: 'string' } },
          { name: 'view',     in: 'query', schema: { type: 'string', enum: ['position','forecast','realized-fx'], default: 'position' } },
        ],
        responses: { '200': { description: 'Cash position, 30/60/90-day forecast, or realized FX G/L' } },
      },
    },

    // ── NEW: Fixed Assets Depreciation ────────────────────────────────────────
    '/api/accounting/depreciation': {
      get: {
        tags: ['Accounting'], summary: 'NBV Report or Depreciation Schedule (IAS 16)', operationId: 'getDepreciation',
        parameters: [
          { name: 'view',     in: 'query', schema: { type: 'string', enum: ['nbv','schedule'], default: 'nbv' } },
          { name: 'tenantId', in: 'query', required: true, schema: { type: 'string' } },
          { name: 'assetId',  in: 'query', schema: { type: 'integer' }, description: 'Required for schedule view' },
          { name: 'asOf',     in: 'query', schema: { type: 'string', format: 'date' } },
        ],
        responses: { '200': { description: 'Net book value per asset or full depreciation schedule' } },
      },
      post: {
        tags: ['Accounting'], summary: 'Run Monthly Depreciation', operationId: 'runMonthlyDepreciation',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: {
            type: 'object', required: ['action','tenantId','period','fiscalYearId'],
            properties: {
              action:       { type: 'string', enum: ['run-monthly'] },
              tenantId:     { type: 'string' },
              period:       { type: 'string', pattern: '^\\d{4}-\\d{2}$', example: '2025-03' },
              fiscalYearId: { type: 'integer' },
              userId:       { type: 'string' },
              dryRun:       { type: 'boolean', default: false },
            },
          }}},
        },
        responses: { '200': { description: 'Depreciation run result' }, '422': { description: 'No assets or posting failed' } },
      },
    },

    // ── NEW: Deferred Tax ─────────────────────────────────────────────────────
    '/api/accounting/deferred-tax': {
      get: {
        tags: ['Accounting'], summary: 'Deferred Tax Analysis (IAS 12)', operationId: 'getDeferredTax',
        parameters: [
          { name: 'tenantId', in: 'query', required: true, schema: { type: 'string' } },
          { name: 'view',     in: 'query', schema: { type: 'string', enum: ['current','rollforward'], default: 'current' } },
          { name: 'taxRate',  in: 'query', schema: { type: 'number', default: 0.20 } },
          { name: 'asOf',     in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'year',     in: 'query', schema: { type: 'integer' } },
        ],
        responses: { '200': { description: 'Temp differences, DTA, DTL, net position' } },
      },
    },

    // ── NEW: Opening Balances ─────────────────────────────────────────────────
    '/api/accounting/opening-balances': {
      get: {
        tags: ['Accounting'], summary: 'Get Imported Opening Balances', operationId: 'getOpeningBalances',
        parameters: [{ name: 'tenantId', in: 'query', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'OB journal entries' } },
      },
      post: {
        tags: ['Accounting'], summary: 'Import Opening Balances (with dry-run)', operationId: 'importOpeningBalances',
        description: 'Validates Dr=Cr balance, then posts single consolidated OB journal. Use dryRun=true to preview.',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: {
            type: 'object', required: ['tenantId','fiscalYearId','asOfDate','userId','lines'],
            properties: {
              tenantId:     { type: 'string' },
              fiscalYearId: { type: 'integer' },
              asOfDate:     { type: 'string', format: 'date' },
              userId:       { type: 'integer' },
              dryRun:       { type: 'boolean', default: false },
              lines: {
                type: 'array', maxItems: 5000,
                items: { type: 'object', required: ['accountCode'],
                  properties: { accountCode: { type: 'string' }, debit: { type: 'number' }, credit: { type: 'number' } },
                },
              },
            },
          }}},
        },
        responses: {
          '201': { description: 'Opening balances posted' },
          '422': { description: 'Unbalanced or missing accounts' },
        },
      },
    },

    // ── NEW: Year-End Reports ─────────────────────────────────────────────────
    '/api/accounting/year-end/{runId}/reports': {
      get: {
        tags: ['Accounting', 'Reports'], summary: 'Year-End Financial Reports', operationId: 'getYearEndReports',
        parameters: [
          { name: 'runId',    in: 'path',  required: true, schema: { type: 'integer' } },
          { name: 'tenantId', in: 'query', required: true, schema: { type: 'string' } },
          { name: 'type',     in: 'query', schema: { type: 'string', enum: ['P&L','BS','CF','EQUITY','AUDIT','ZAKAT','ALL'], default: 'ALL' } },
        ],
        responses: { '200': { description: 'Annual P&L, BS, CF, Equity, Audit summary + Zakat provision' }, '404': { description: 'Run not found' } },
      },
    },

    // ── NEW: Budget Variance ──────────────────────────────────────────────────
    '/api/bi/budget-variance': {
      get: {
        tags: ['Reports'], summary: 'Budget Variance Analysis', operationId: 'getBudgetVariance',
        parameters: [
          { name: 'tenantId',   in: 'query', required: true, schema: { type: 'string' } },
          { name: 'period',     in: 'query', schema: { type: 'string', example: '2025-03' } },
          { name: 'fiscalYear', in: 'query', schema: { type: 'integer' } },
        ],
        responses: { '200': { description: 'Actual vs Budget with variance %, status (ON_TRACK/WATCH/OVER), run-rate forecast' } },
      },
    },

    // ── NEW: Month-End Close ──────────────────────────────────────────────────
    '/api/accounting/month-end-close': {
      get:  { tags: ['Accounting'], summary: 'Month-End Close Status (14-step)', operationId: 'getMonthEndCloseStatus', responses: { '200': { description: '14-step checklist with progress %' } } },
      post: { tags: ['Accounting'], summary: 'Trigger Month-End Close Task', operationId: 'triggerMonthEndTask',
        requestBody: { required: true, content: { 'application/json': { schema: {
          type: 'object', required: ['taskCode','tenantId'],
          properties: { taskCode: { type: 'string' }, tenantId: { type: 'string' } },
        }}}},
        responses: { '200': { description: 'Task executed' } },
      },
    },

    // ── NEW: ZATCA Batch Cron ─────────────────────────────────────────────────
    '/api/cron/zatca-batch-submit': {
      post: {
        tags: ['ZATCA'], summary: 'ZATCA Auto-Batch Submission (every 15 min)', operationId: 'zatcaBatchSubmit',
        parameters: [
          { name: 'tenantId', in: 'query', schema: { type: 'string' } },
          { name: 'dryRun',   in: 'query', schema: { type: 'boolean', default: false } },
        ],
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'All submitted' }, '207': { description: 'Partial success' }, '401': { description: 'Missing CRON_SECRET' } },
      },
    },

    // ── Account Statement ──────────────────────────────────────────────────────
    '/api/accounting/statement': {
      get: {
        tags: ['Accounting'], summary: 'Customer/Supplier Account Statement with Running Balance', operationId: 'getAccountStatement',
        parameters: [
          { name: 'type',     in: 'query', schema: { type: 'string', enum: ['customer','supplier'], default: 'customer' } },
          { name: 'entityId', in: 'query', required: true, schema: { type: 'integer' } },
          { name: 'tenantId', in: 'query', required: true, schema: { type: 'string' } },
          { name: 'from',     in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'to',       in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'currency', in: 'query', schema: { type: 'string', default: 'SAR' } },
        ],
        responses: { '200': { description: 'Statement lines with opening/closing balance, aging summary' }, '404': { description: 'Entity not found' } },
      },
    },

    // ── Budget Upload ──────────────────────────────────────────────────────────
    '/api/finance/budget-upload': {
      get: {
        tags: ['Reports'], summary: 'Get Annual Budget by Account', operationId: 'getBudget',
        parameters: [{ name: 'tenantId', in: 'query', required: true, schema: { type: 'string' } }, { name: 'fiscalYear', in: 'query', schema: { type: 'integer' } }],
        responses: { '200': { description: 'All budget lines with monthly breakdown and grand total' } },
      },
      post: {
        tags: ['Reports'], summary: 'Upload Annual Budget (bulk upsert)', operationId: 'uploadBudget',
        requestBody: { required: true, content: { 'application/json': { schema: {
          type: 'object', required: ['tenantId','fiscalYear','userId','lines'],
          properties: { tenantId: { type: 'string' }, fiscalYear: { type: 'integer' }, dryRun: { type: 'boolean' }, lines: { type: 'array', maxItems: 2000, items: { type: 'object', properties: { accountCode: { type: 'string' }, annualTotal: { type: 'number' } } } } },
        }}}},
        responses: { '201': { description: 'Budget saved' }, '400': { description: 'Validation error' } },
      },
    },

    // ── Audit Export ───────────────────────────────────────────────────────────
    '/api/accounting/audit-export': {
      get: {
        tags: ['Accounting'], summary: 'Audit Trail Export (CSV/JSON for external auditors)', operationId: 'exportAuditTrail',
        parameters: [
          { name: 'tenantId', in: 'query', required: true, schema: { type: 'string' } },
          { name: 'from',     in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'to',       in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'table',    in: 'query', schema: { type: 'string' } },
          { name: 'action',   in: 'query', schema: { type: 'string', enum: ['CREATE','UPDATE','DELETE','PERIOD_LOCK','PERIOD_UNLOCK'] } },
          { name: 'format',   in: 'query', schema: { type: 'string', enum: ['json','csv'], default: 'json' } },
          { name: 'limit',    in: 'query', schema: { type: 'integer', default: 1000, maximum: 5000 } },
        ],
        responses: { '200': { description: 'Audit log entries in JSON or CSV format (with Content-Disposition for download)' } },
      },
    },

    // ── Period Lock ─────────────────────────────────────────────────────────────
    '/api/accounting/period-lock': {
      get: {
        tags: ['Accounting'], summary: 'List Period Lock Status (12 months per fiscal year)', operationId: 'getPeriodLocks',
        parameters: [{ name: 'tenantId', in: 'query', required: true, schema: { type: 'string' } }, { name: 'fiscalYear', in: 'query', schema: { type: 'integer' } }, { name: 'period', in: 'query', schema: { type: 'string', pattern: '^\\d{4}-\\d{2}$' } }],
        responses: { '200': { description: '12-month period status: OPEN | LOCKED | TEMP_UNLOCKED + summary' } },
      },
      post: {
        tags: ['Accounting'], summary: 'Lock / Unlock Accounting Period (CFO/Admin only)', operationId: 'managePeriodLock',
        requestBody: { required: true, content: { 'application/json': { schema: {
          type: 'object', required: ['action','tenantId'],
          properties: { action: { type: 'string', enum: ['lock','unlock','temp-unlock','can-post','status'] }, tenantId: { type: 'string' }, period: { type: 'string', pattern: '^\\d{4}-\\d{2}$' }, reason: { type: 'string' }, skipChecklist: { type: 'boolean' } },
        }}}},
        responses: { '200': { description: 'Period status updated' }, '409': { description: 'Cannot post to locked period' }, '422': { description: 'Month-end checklist incomplete' } },
      },
    },

    // ── Financial Health Dashboard ─────────────────────────────────────────────
    '/api/finance/financial-health': {
      get: {
        tags: ['Reports'], summary: 'Financial Health Dashboard (KPIs, Ratios, Altman Z-Score)', operationId: 'getFinancialHealth',
        parameters: [{ name: 'tenantId', in: 'query', required: true, schema: { type: 'string' } }, { name: 'period', in: 'query', schema: { type: 'string', pattern: '^\\d{4}-\\d{2}$', example: '2025-03' } }],
        responses: { '200': { description: 'Liquidity, profitability, efficiency, leverage ratios + Altman Z + recommendations' } },
      },
    },

    // ── Chart of Accounts Import ───────────────────────────────────────────────
    '/api/accounting/chart-of-accounts-import': {
      get: {
        tags: ['Accounting'], summary: 'Get Chart of Accounts', operationId: 'getChartOfAccounts',
        parameters: [{ name: 'tenantId', in: 'query', required: true, schema: { type: 'string' } }, { name: 'search', in: 'query', schema: { type: 'string' } }, { name: 'type', in: 'query', schema: { type: 'string', enum: ['ASSET','LIABILITY','EQUITY','REVENUE','EXPENSE'] } }],
        responses: { '200': { description: 'Accounts list with count by type' } },
      },
      post: {
        tags: ['Accounting'], summary: 'Bulk Import Chart of Accounts (up to 5000 accounts)', operationId: 'importChartOfAccounts',
        requestBody: { required: true, content: { 'application/json': { schema: {
          type: 'object', required: ['tenantId','userId','accounts'],
          properties: { tenantId: { type: 'string' }, dryRun: { type: 'boolean' }, overwrite: { type: 'boolean' }, accounts: { type: 'array', maxItems: 5000 } },
        }}}},
        responses: { '201': { description: 'Accounts created/updated' }, '400': { description: 'Duplicate codes or invalid types' } },
      },
    },

    // ── Cost Center Report ─────────────────────────────────────────────────────
    '/api/accounting/cost-center-report': {
      get: {
        tags: ['Accounting', 'Reports'], summary: 'Cost Center P&L vs Budget Report', operationId: 'getCostCenterReport',
        parameters: [
          { name: 'tenantId',     in: 'query', required: true, schema: { type: 'string' } },
          { name: 'costCenterId', in: 'query', schema: { type: 'integer' }, description: 'omit for all centers' },
          { name: 'from',         in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'to',           in: 'query', schema: { type: 'string', format: 'date' } },
        ],
        responses: { '200': { description: 'Revenue/Expense/Net per center + variance % + ON_TRACK|WATCH|OVER status' } },
      },
    },

    // ── Payroll GL Auto-Post ───────────────────────────────────────────────────
    '/api/accounting/payroll-gl': {
      get: {
        tags: ['Accounting','HR'], summary: 'Check Payroll GL Posting History', operationId: 'getPayrollGLHistory',
        parameters: [{ name: 'tenantId', in: 'query', required: true, schema: { type: 'string' } }, { name: 'period', in: 'query', schema: { type: 'string' } }],
        responses: { '200': { description: 'List of PAYROLL-* journal entries' } },
      },
      post: {
        tags: ['Accounting','HR'], summary: 'Post Payroll to GL (Dr Salary / Cr Payable)', operationId: 'postPayrollGL',
        requestBody: { required: true, content: { 'application/json': { schema: {
          type: 'object', required: ['tenantId','period','fiscalYearId','userId'],
          properties: { tenantId: { type: 'string' }, period: { type: 'string', pattern: '^\\d{4}-\\d{2}$' }, fiscalYearId: { type: 'integer' }, dryRun: { type: 'boolean' } },
        }}}},
        responses: { '201': { description: 'Journal posted' }, '409': { description: 'Already posted for this period' }, '422': { description: 'No approved payroll or unbalanced' } },
      },
    },

    // ── Bank Reconciliation ────────────────────────────────────────────────────
    '/api/accounting/bank-recon': {
      get: {
        tags: ['Accounting'], summary: 'Bank Reconciliation: GL vs Bank Statement', operationId: 'getBankRecon',
        parameters: [
          { name: 'tenantId',      in: 'query', required: true, schema: { type: 'string' } },
          { name: 'bankAccountId', in: 'query', required: true, schema: { type: 'integer' } },
          { name: 'from',          in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'to',            in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'format',        in: 'query', schema: { type: 'string', enum: ['json','csv'] } },
        ],
        responses: { '200': { description: 'MATCHED|GL_ONLY|BANK_ONLY|DIFFERENCE per transaction + isReconciled flag' } },
      },
    },

    // ── Payroll Monthly Cron ───────────────────────────────────────────────────
    '/api/cron/payroll-monthly': {
      post: {
        tags: ['HR'], summary: 'Payroll GL Monthly Auto-Post Cron (day 28)', operationId: 'cronPayrollMonthly',
        parameters: [{ name: 'dryRun', in: 'query', schema: { type: 'boolean', default: false } }, { name: 'period', in: 'query', schema: { type: 'string' } }],
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Payroll GL posted for all tenants' }, '401': { description: 'Missing CRON_SECRET' } },
      },
    },

    // ── Profit & Loss Statement ───────────────────────────────────────────────
    '/api/accounting/profit-loss': {
      get: {
        tags: ['Accounting'],
        summary: 'قائمة الدخل (IFRS/SOCPA)',
        description: 'قائمة الدخل الشاملة بالإيرادات، تكلفة المبيعات، EBIT، صافي الربح، هوامش الربح، ومقارنة اختيارية بفترة سابقة',
        parameters: [
          { name: 'tenantId', in: 'query', required: true, schema: { type: 'string' } },
          { name: 'from', in: 'query', required: true, schema: { type: 'string', format: 'date' }, description: 'YYYY-MM-DD' },
          { name: 'to', in: 'query', required: true, schema: { type: 'string', format: 'date' }, description: 'YYYY-MM-DD' },
          { name: 'compareFrom', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'compareTo', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'format', in: 'query', schema: { type: 'string', enum: ['json', 'csv'], default: 'json' } },
        ],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Profit & Loss Statement',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    summary: {
                      type: 'object',
                      properties: {
                        totalRevenue:  { type: 'number' },
                        grossProfit:   { type: 'number' },
                        grossMargin:   { type: 'string', example: '40.0%' },
                        ebit:          { type: 'number' },
                        netIncome:     { type: 'number' },
                        netMargin:     { type: 'string', example: '18.0%' },
                      },
                    },
                    sections: { type: 'array', items: { type: 'object' } },
                  },
                },
              },
            },
          },
        },
      },
    },

    // ── VAT Return ────────────────────────────────────────────────────────────
    '/api/accounting/vat-return': {
      get: {
        tags: ['Accounting', 'ZATCA'],
        summary: 'إقرار ضريبة القيمة المضافة (Box 1-12)',
        description: 'إقرار ضريبي شهري بتنسيق ZATCA — Box 1-12 مع ضريبة الاستيراد العكسية، صافي مستحق الدفع/الاسترداد، وتصدير CSV',
        parameters: [
          { name: 'tenantId', in: 'query', required: true, schema: { type: 'string' } },
          { name: 'period', in: 'query', required: true, schema: { type: 'string', pattern: '^\\d{4}-\\d{2}$' }, example: '2025-03' },
          { name: 'format', in: 'query', schema: { type: 'string', enum: ['json', 'csv'], default: 'json' } },
        ],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'VAT Return',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    period:    { type: 'string' },
                    boxes:     { type: 'array', items: { type: 'object', properties: { box: { type: 'integer' }, taxableValue: { type: 'number' }, taxAmount: { type: 'number' } } } },
                    summary:   { type: 'object', properties: { vatDue: { type: 'number' }, vatDeductible: { type: 'number' }, netVAT: { type: 'number' }, position: { type: 'string', enum: ['PAYABLE', 'REFUND'] } } },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Accounting', 'ZATCA'],
        summary: 'إقفال / تقديم إقرار ضريبي',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['action', 'tenantId', 'period'],
                properties: {
                  action:   { type: 'string', enum: ['preview', 'finalize', 'submit'] },
                  tenantId: { type: 'string' },
                  period:   { type: 'string', pattern: '^\\d{4}-\\d{2}$' },
                },
              },
            },
          },
        },
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'VAT return action executed' } },
      },
    },

    // ── Prepayments ───────────────────────────────────────────────────────────
    '/api/accounting/prepayments': {
      get: {
        tags: ['Accounting'],
        summary: 'قائمة المدفوعات المقدمة النشطة',
        description: 'جميع المدفوعات المقدمة النشطة مع الرصيد المتبقي وجدول الاستهلاك الشهري',
        parameters: [
          { name: 'tenantId', in: 'query', required: true, schema: { type: 'string' } },
          { name: 'period', in: 'query', schema: { type: 'string', pattern: '^\\d{4}-\\d{2}$' } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['ACTIVE', 'COMPLETED', 'CANCELLED', 'ALL'], default: 'ACTIVE' } },
        ],
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Prepayments list with amortization schedule' } },
      },
      post: {
        tags: ['Accounting'],
        summary: 'تسجيل مدفوعات مقدمة جديدة',
        description: 'تسجيل مدفوع مقدم مع قيد حجز (Dr Prepaid / Cr Cash) وأول قيد استهلاك (Dr Expense / Cr Prepaid) وجدول الاستهلاك الكامل',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['tenantId', 'period', 'fiscalYearId', 'userId', 'prepayments'],
                properties: {
                  tenantId:     { type: 'string' },
                  period:       { type: 'string', pattern: '^\\d{4}-\\d{2}$' },
                  fiscalYearId: { type: 'integer' },
                  userId:       { type: 'integer' },
                  dryRun:       { type: 'boolean', default: false },
                  prepayments:  {
                    type: 'array', minItems: 1, maxItems: 200,
                    items: {
                      type: 'object',
                      required: ['description', 'totalAmount', 'months', 'prepaidAccountId', 'expenseAccountId'],
                      properties: {
                        description:      { type: 'string' },
                        totalAmount:      { type: 'number', minimum: 0.01 },
                        months:           { type: 'integer', minimum: 1, maximum: 120 },
                        prepaidAccountId: { type: 'integer' },
                        expenseAccountId: { type: 'integer' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        security: [{ bearerAuth: [] }],
        responses: { '201': { description: 'Prepayments registered and amortization started' } },
      },
    },

    // ── Collection Workflow ───────────────────────────────────────────────────
    '/api/accounting/collection-workflow': {
      get: {
        tags: ['Accounting', 'AR'],
        summary: 'لوحة تحصيل الذمم المدينة',
        description: 'ملخص حالات التحصيل (NEW/PROMISED/ESCALATED/LEGAL/COLLECTED) والفواتير العاجلة مرتبة بالمبلغ',
        parameters: [
          { name: 'tenantId', in: 'query', required: true, schema: { type: 'string' } },
          { name: 'invoiceId', in: 'query', schema: { type: 'integer' }, description: 'تصفية لفاتورة محددة' },
        ],
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Collection workflow summary and urgent invoices' } },
      },
      post: {
        tags: ['Accounting', 'AR'],
        summary: 'تسجيل نشاط تحصيل / وعد دفع',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['action', 'tenantId'],
                properties: {
                  action:      { type: 'string', enum: ['CALL','EMAIL','VISIT','LEGAL_NOTICE','WRITE_OFF','PROMISE','PAYMENT_RECEIVED','ESCALATE_BROKEN'] },
                  tenantId:    { type: 'string' },
                  invoiceId:   { type: 'integer' },
                  amount:      { type: 'number' },
                  promiseDate: { type: 'string', format: 'date' },
                  notes:       { type: 'string' },
                },
              },
            },
          },
        },
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Collection activity recorded' } },
      },
    },

    // ── Inter-Company Transactions ────────────────────────────────────────────
    '/api/accounting/inter-company': {
      get: {
        tags: ['Accounting'],
        summary: 'أرصدة المعاملات البينية',
        description: 'ملخص أرصدة IC بين كيانات المجموعة (مستحق / مطلوب / صافي) مع تفاصيل دورات المقاصة',
        parameters: [
          { name: 'tenantId', in: 'query', required: true, schema: { type: 'string' } },
          { name: 'view', in: 'query', schema: { type: 'string', enum: ['summary', 'detail'], default: 'summary' } },
        ],
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Inter-company balance summary' } },
      },
      post: {
        tags: ['Accounting'],
        summary: 'ترحيل معاملة بينية / مقاصة',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['action', 'fromTenantId', 'toTenantId'],
                properties: {
                  action:       { type: 'string', enum: ['post', 'preview', 'net'] },
                  fromTenantId: { type: 'string' },
                  toTenantId:   { type: 'string' },
                  amount:       { type: 'number' },
                  type:         { type: 'string', enum: ['LOAN','SERVICE','GOODS','DIVIDEND','CAPITAL','NETTING'] },
                  currency:     { type: 'string', default: 'SAR' },
                  exchangeRate: { type: 'number', default: 1 },
                },
              },
            },
          },
        },
        security: [{ bearerAuth: [] }],
        responses: { '201': { description: 'IC transaction posted with mirror journals' } },
      },
    },

    // ── Inventory Valuation Snapshot ──────────────────────────────────────────
    '/api/accounting/inventory-valuation-snapshot': {
      get: {
        tags: ['Accounting', 'Inventory'],
        summary: 'لقطة تقييم المخزون (WACC/FIFO)',
        description: 'تقييم المخزون بمتوسط التكلفة المرجح مقارنةً برصيد GL — يكشف الفروقات ويدعم تصدير CSV',
        parameters: [
          { name: 'tenantId', in: 'query', required: true, schema: { type: 'string' } },
          { name: 'asOf', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'method', in: 'query', schema: { type: 'string', enum: ['WACC', 'FIFO'], default: 'WACC' } },
          { name: 'format', in: 'query', schema: { type: 'string', enum: ['json', 'csv'], default: 'json' } },
        ],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Inventory valuation snapshot',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    summary: { type: 'object', properties: { grandTotalValue: { type: 'number' }, grandVariance: { type: 'number' }, isClean: { type: 'boolean' } } },
                    lines:   { type: 'array', items: { type: 'object', properties: { productCode: { type: 'string' }, qty: { type: 'number' }, avgCost: { type: 'number' }, variance: { type: 'number' }, status: { type: 'string', enum: ['OK','VARIANCE','NEGATIVE_QTY'] } } } },
                  },
                },
              },
            },
          },
        },
      },
    },

    // ── Crons ─────────────────────────────────────────────────────────────────
    '/api/cron/vat-return-reminder': {
      post: {
        tags: ['Cron'],
        summary: 'تذكير إقرار الضريبة الشهري (يوم 20)',
        description: 'يُرسل Telegram + Notification بالموعد النهائي والضريبة المقدرة',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'VAT reminder sent' }, '401': { description: 'Missing CRON_SECRET' } },
      },
    },

    '/api/cron/prepayments-amortization': {
      post: {
        tags: ['Cron'],
        summary: 'استهلاك المدفوعات المقدمة الشهري (يوم 1)',
        description: 'يُرحِّل قيود Dr Expense / Cr Prepaid لكل مدفوع مقدم نشط، يُنقِّص remainingMonths، يُغلق عند الصفر',
        parameters: [{ name: 'dryRun', in: 'query', schema: { type: 'boolean', default: false } }],
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Prepayments amortized' }, '401': { description: 'Missing CRON_SECRET' } },
      },
    },

    '/api/cron/ar-collection-dunning': {
      post: {
        tags: ['Cron'],
        summary: 'تصعيد تحصيل الذمم الأسبوعي (كل أحد)',
        description: '4 مستويات دانينج (1-30 / 31-60 / 61-90 / +90 يوم)، credit hold على المستوى 2+، تقرير Telegram',
        parameters: [{ name: 'dryRun', in: 'query', schema: { type: 'boolean', default: false } }],
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'AR dunning escalation report' }, '401': { description: 'Missing CRON_SECRET' } },
      },
    },
  },
} as const;

export function getOpenAPISpec() {
  return SPEC;
}

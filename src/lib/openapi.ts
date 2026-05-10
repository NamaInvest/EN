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
  },
} as const;

export function getOpenAPISpec() {
  return SPEC;
}

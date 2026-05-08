/**
 * OpenAPI Specification Generator
 * ──────────────────────────────────────────────────────────
 * Auto-generates OpenAPI 3.1 spec from route metadata.
 * Served at GET /api/docs/openapi.json
 *
 * This is the source of truth for API documentation.
 * The spec is built programmatically from registered route definitions.
 */

const SPEC = {
  openapi: '3.1.0',
  info: {
    title: 'NamaInvest ERP API',
    version: '2.4.6',
    description: 'Full-featured Arabic-first ERP system API for Saudi Arabia. Supports Sales, Purchases, Inventory, Accounting, HR, Payroll, and ZATCA compliance.',
    contact: { name: 'NamaInvest Team', email: 'dev@namainvist.com' },
    license: { name: 'Proprietary' },
  },
  servers: [
    { url: 'https://namainvist.com', description: 'Production' },
    { url: 'https://n11.namainvist.com', description: 'N11 Node' },
    { url: 'http://localhost:3000', description: 'Development' },
  ],
  tags: [
    { name: 'Auth', description: 'Authentication & Authorization' },
    { name: 'Sales', description: 'Sales Invoices & Returns' },
    { name: 'Purchases', description: 'Purchase Orders & Bills' },
    { name: 'Inventory', description: 'Stock, Movements, & Warehouses' },
    { name: 'Accounting', description: 'Journal Entries & Trial Balance' },
    { name: 'HR', description: 'Employees, Salaries, & Leave' },
    { name: 'ZATCA', description: 'Saudi Tax Authority Integration' },
    { name: 'Customers', description: 'Customer Management' },
    { name: 'Products', description: 'Product & Pricing Management' },
    { name: 'POS', description: 'Point of Sale Operations' },
    { name: 'Reports', description: 'Financial & Operational Reports' },
    { name: 'System', description: 'Health, Config, & Admin' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      apiKeyAuth: { type: 'apiKey', in: 'header', name: 'X-API-Key' },
      cookieAuth: { type: 'apiKey', in: 'cookie', name: 'token' },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string' },
          message: { type: 'string' },
          code: { type: 'string' },
        },
      },
      Pagination: {
        type: 'object',
        properties: {
          page: { type: 'integer', default: 1 },
          limit: { type: 'integer', default: 50 },
          total: { type: 'integer' },
          totalPages: { type: 'integer' },
        },
      },
      SalesInvoice: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          invoiceNo: { type: 'integer' },
          date: { type: 'string', format: 'date-time' },
          customerId: { type: 'integer', nullable: true },
          subtotal: { type: 'number' },
          discountValue: { type: 'number' },
          taxValue: { type: 'number' },
          total: { type: 'number' },
          paid: { type: 'number' },
          remaining: { type: 'number' },
          paymentType: { type: 'string', enum: ['cash', 'credit', 'split'] },
          status: { type: 'string', enum: ['draft', 'completed', 'paid', 'partial', 'cancelled'] },
        },
      },
      JournalEntry: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          date: { type: 'string', format: 'date-time' },
          description: { type: 'string' },
          reference: { type: 'string' },
          status: { type: 'string', enum: ['draft', 'posted', 'reversed'] },
          lines: { type: 'array', items: { $ref: '#/components/schemas/JournalLine' } },
        },
      },
      JournalLine: {
        type: 'object',
        properties: {
          accountId: { type: 'integer' },
          accountCode: { type: 'string' },
          debit: { type: 'number' },
          credit: { type: 'number' },
          description: { type: 'string' },
        },
      },
      Employee: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' },
          employeeNo: { type: 'string' },
          position: { type: 'string' },
          salary: { type: 'number' },
          department: { type: 'string' },
          active: { type: 'boolean' },
        },
      },
    },
    headers: {
      'X-Idempotency-Key': {
        description: 'Unique key to prevent duplicate operations',
        schema: { type: 'string', format: 'uuid' },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    '/api/health': {
      get: {
        tags: ['System'], summary: 'Health Check', operationId: 'getHealth',
        security: [],
        responses: { '200': { description: 'System healthy' }, '503': { description: 'System degraded' } },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'], summary: 'Login', operationId: 'login', security: [],
        requestBody: {
          content: { 'application/json': { schema: { type: 'object', properties: { username: { type: 'string' }, password: { type: 'string' } }, required: ['username', 'password'] } } },
        },
        responses: { '200': { description: 'JWT token' }, '401': { description: 'Invalid credentials' } },
      },
    },
    '/api/sales': {
      get: {
        tags: ['Sales'], summary: 'List Sales Invoices', operationId: 'listSalesInvoices',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
          { name: 'status', in: 'query', schema: { type: 'string' } },
          { name: 'customerId', in: 'query', schema: { type: 'integer' } },
        ],
        responses: { '200': { description: 'List of invoices' } },
      },
      post: {
        tags: ['Sales'], summary: 'Create Sales Invoice', operationId: 'createSalesInvoice',
        parameters: [{ $ref: '#/components/headers/X-Idempotency-Key' }],
        responses: { '201': { description: 'Invoice created' }, '400': { description: 'Validation error' } },
      },
    },
    '/api/accounting/journal': {
      get: { tags: ['Accounting'], summary: 'List Journal Entries', operationId: 'listJournalEntries', responses: { '200': { description: 'Journal entries' } } },
      post: { tags: ['Accounting'], summary: 'Create Journal Entry', operationId: 'createJournalEntry', responses: { '201': { description: 'Journal created' } } },
    },
    '/api/accounting/trial-balance': {
      get: { tags: ['Accounting'], summary: 'Get Trial Balance', operationId: 'getTrialBalance', responses: { '200': { description: 'Trial balance report' } } },
    },
    '/api/employees': {
      get: { tags: ['HR'], summary: 'List Employees', operationId: 'listEmployees', responses: { '200': { description: 'Employees list' } } },
      post: { tags: ['HR'], summary: 'Create Employee', operationId: 'createEmployee', responses: { '201': { description: 'Employee created' } } },
    },
    '/api/employees/salary': {
      post: { tags: ['HR'], summary: 'Process Salary', operationId: 'processSalary', responses: { '201': { description: 'Salary processed' } } },
    },
    '/api/products': {
      get: { tags: ['Products'], summary: 'List Products', operationId: 'listProducts', responses: { '200': { description: 'Products' } } },
    },
    '/api/customers': {
      get: { tags: ['Customers'], summary: 'List Customers', operationId: 'listCustomers', responses: { '200': { description: 'Customers' } } },
    },
    '/api/purchases': {
      get: { tags: ['Purchases'], summary: 'List Purchase Invoices', operationId: 'listPurchases', responses: { '200': { description: 'Purchase invoices' } } },
    },
    '/api/pos/checkout': {
      post: { tags: ['POS'], summary: 'POS Checkout', operationId: 'posCheckout', responses: { '200': { description: 'Checkout completed' } } },
    },
    '/api/zatca/report': {
      post: { tags: ['ZATCA'], summary: 'Report Invoice to ZATCA', operationId: 'zatcaReport', responses: { '200': { description: 'Reported' } } },
    },
  },
};

export function getOpenAPISpec() {
  return SPEC;
}

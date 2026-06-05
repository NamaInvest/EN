import { expect } from '@playwright/test';
import { guardTest } from './helpers/environment-guard';

/**
 * E2E Scenario Coverage:
 * - SCN-ACCOUNTING-001: GL Entry Rejection
 * - SCN-SALES-001: Sales Invoice Rejection
 * - SCN-PURCHASES-001: Purchases matching rejection
 * - SCN-INVENTORY-001: Stock adjustment rejection
 * - SCN-TREASURY-001: Petty cash allocation rejection
 * - SCN-PAYROLL-001: Payroll execution rejection
 * - SCN-CRM-001: CRM lead conversion rejection
 * - SCN-MANUFACTURING-001: Manufacturing BOM rejection
 * - SCN-WMS-001: WMS bin redirection rejection
 * - SCN-TENANTADMIN-001: Settings API roles and custom fields rejection
 *
 * Safety:
 * - API_ONLY_SAFE (Fail-closed check)
 * - Verifies API rejects request when unauthenticated
 * - No credentials supplied
 * - Production target blocked by environment guard
 */
guardTest.describe('API Mutation Rejection (Fail-Closed Gates)', () => {
  const postTargets = [
    { url: '/api/accounting/journal', payload: { lines: [] } },
    { url: '/api/sales/orders', payload: { items: [] } },
    { url: '/api/purchases/matching', payload: { matchId: 1 } },
    { url: '/api/stock/adjustments', payload: { lines: [] } },
    { url: '/api/treasury/petty-cash', payload: { amount: 100 } },
    { url: '/api/payroll', payload: { runId: 1 } },
    { url: '/api/crm/leads/1/convert', payload: {} },
    { url: '/api/manufacturing/boms', payload: { bomId: 1 } },
    { url: '/api/enterprise/wms', payload: { binId: 1 } },
    { url: '/api/settings/roles', payload: { roleName: 'mock_hacker' } },
    { url: '/api/settings/custom-fields', payload: { fieldName: 'mock_hacker' } }
  ];

  for (const target of postTargets) {
    guardTest(`should reject POST requests to ${target.url} without session`, async ({ request }) => {
      const response = await request.post(target.url, {
        data: target.payload
      });

      const status = response.status();
      // Unauthenticated mutations must return 401 Unauthorized, 403 Forbidden, or redirect to home/login (3xx), or 400 Bad Request
      expect(status === 401 || status === 403 || status === 400 || status >= 300 && status < 400).toBeTruthy();
    });
  }
});

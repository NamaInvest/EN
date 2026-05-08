import http from 'k6/http';
import { check, group, sleep } from 'k6';

export const options = {
  scenarios: {
    sales_create: {
      executor: 'constant-arrival-rate',
      rate: 10, // 10 invoices/sec
      timeUnit: '1s',
      duration: '10m',
      preAllocatedVUs: 50,
    },
    reports_query: {
      executor: 'constant-vus',
      vus: 20,
      duration: '10m',
    },
  },
  thresholds: {
    'http_req_duration{group:::sales-create}': ['p(95)<2000'],
    'http_req_duration{group:::reports}': ['p(95)<5000'],
    'http_req_failed': ['rate<0.01'],
  },
};

export default function () {
  group('sales-create', () => {
    const res = http.post('https://staging.namasoft.com/api/v1/sales',
      JSON.stringify({ /* ... */ }),
      { headers: { Authorization: `Bearer test-token` } }
    );
    check(res, { 'status 201': r => r.status === 201 });
  });

  group('reports', () => {
    const res = http.get('https://staging.namasoft.com/api/v1/accounting/balance-sheet',
      { headers: { Authorization: `Bearer test-token` } }
    );
    check(res, { 'status 200': r => r.status === 200 });
  });

  sleep(1);
}

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 },
    { duration: '1m', target: 20 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'], // 95% of invoices created under 1s
  },
};

export default function () {
  const payload = JSON.stringify({
    customerId: 1,
    items: [
      { productId: 1, quantity: 2, price: 100 },
    ]
  });

  const headers = { 
    'Content-Type': 'application/json',
    'Authorization': 'Bearer test-token' // Mock token or fetch from setup
  };

  const res = http.post('http://localhost:3000/api/sales/invoices', payload, { headers });

  check(res, {
    'is status 201': (r) => r.status === 201,
  });

  sleep(1);
}

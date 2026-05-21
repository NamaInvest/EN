import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 50 }, // ramp up to 50 users
    { duration: '1m', target: 50 },  // stay at 50 for 1 minute
    { duration: '30s', target: 0 },  // ramp down to 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
  },
};

export default function () {
  const payload = JSON.stringify({
    username: 'admin',
    password: 'password',
  });

  const headers = { 'Content-Type': 'application/json' };

  const res = http.post('http://localhost:3000/api/auth/login', payload, { headers });

  check(res, {
    'is status 200': (r) => r.status === 200,
    'has token': (r) => r.json('token') !== undefined,
  });

  sleep(1);
}

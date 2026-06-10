export const BASE_URL = process.env.APP_URL || 'http://localhost:4000';

export const THRESHOLDS = {
  // All requests combined
  http_req_duration: [
    'p(95)<500', // 95% of ALL requests under 500 ms
    'p(99)<1000', // 99% of ALL requests under 1 s
  ],
  http_req_failed: ['rate<0.001'], // < 0.1% error rate

  // Per-endpoint thresholds (tagged with endpoint name)
  'http_req_duration{endpoint:login}': ['p(95)<200', 'p(99)<400'],
  'http_req_duration{endpoint:register}': ['p(95)<300', 'p(99)<500'],
  'http_req_duration{endpoint:queue}': ['p(95)<200', 'p(99)<350'],
  'http_req_duration{endpoint:vitals}': ['p(95)<250', 'p(99)<400'],
  'http_req_duration{endpoint:stats}':        ['p(95)<500', 'p(99)<800'],
  'http_req_duration{endpoint:observation}':  ['p(95)<300', 'p(99)<500'],
  'http_req_duration{endpoint:lab}':          ['p(95)<250', 'p(99)<400'],
  'http_req_duration{endpoint:prescription}': ['p(95)<250', 'p(99)<400'],
  'http_req_duration{endpoint:dispense}':     ['p(95)<300', 'p(99)<500'],
  'http_req_duration{endpoint:pharmacy_read}':['p(95)<300', 'p(99)<500'],
};

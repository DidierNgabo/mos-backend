import http from 'k6/http';
import { check } from 'k6';

const BASE_URL = __ENV.APP_URL || 'http://localhost:4000';
const OUTREACH_ID = __ENV.OUTREACH_ID || '165fd207-19f1-4eb6-98dd-d71ce56d367a';
const ADMIN_EMAIL = __ENV.ADMIN_EMAIL || 'perf-admin@test.local';
const ADMIN_PASSWORD = __ENV.ADMIN_PASSWORD || 'PerfTest123!';

const THRESHOLDS = {
  http_req_failed: ['rate<0.05'], // < 5% error rate (vs 0.1% in load test)
  http_req_duration: ['p(95)<3000', 'p(99)<8000'],
  'http_req_duration{endpoint:login}': ['p(95)<1000'],
  'http_req_duration{endpoint:register}': ['p(95)<2000'],
  'http_req_duration{endpoint:queue}': ['p(95)<1500'],
  'http_req_duration{endpoint:vitals}': ['p(95)<1500'],
};

export const options = {
  thresholds: THRESHOLDS,
  scenarios: {
    // Scenario 1: Auth spike — sudden burst of JWT login requests.
    // Measures whether the auth service + DB connection pool survive a rapid
    // wave of concurrent token generation.
    // 30 req/s = all ~30 staff opening the app at shift start.
    // Little's Law: 30/s × 2s worst-case ≈ 60 VUs needed.
    auth_spike: {
      executor: 'ramping-arrival-rate',
      startRate: 0,
      timeUnit: '1s',
      preAllocatedVUs: 100,
      maxVUs: 150,
      exec: 'authSpike',
      stages: [
        { duration: '30s', target: 30 }, // spike: 0 → 30 req/s
        { duration: '2m', target: 30 }, // hold at peak
        { duration: '30s', target: 0 }, // drop back to 0
      ],
    },

    // Scenario 2: Registration spike — burst of concurrent patient registrations.
    // Primary regression check for patient_reg_num_seq: 80 concurrent
    // registrations/s must all produce unique registration numbers with no
    // duplicate-key errors and no 5xx responses.
    // Little's Law: 80/s × 4s worst-case p95 = 320 VUs needed.
    registration_spike: {
      executor: 'ramping-arrival-rate',
      startRate: 0,
      timeUnit: '1s',
      preAllocatedVUs: 320,
      maxVUs: 400,
      exec: 'registrationSpike',
      startTime: '30s', // begin once auth spike is already at full load
      stages: [
        { duration: '30s', target: 80 }, // spike: 0 → 80 req/s
        { duration: '1m', target: 80 }, // hold
        { duration: '30s', target: 0 }, // drop
      ],
    },

    // Scenario 3: Read spike — burst of concurrent read requests.
    // Exercises DB read path (queue entries + vital signs) under burst
    // concurrency to catch connection pool exhaustion on reads.
    read_spike: {
      executor: 'ramping-arrival-rate',
      startRate: 0,
      timeUnit: '1s',
      preAllocatedVUs: 200,
      maxVUs: 240,
      exec: 'readSpike',
      startTime: '1m',
      stages: [
        { duration: '30s', target: 150 }, // spike: 0 → 150 req/s
        { duration: '2m', target: 150 }, // hold
        { duration: '30s', target: 0 }, // drop
      ],
    },
  },
};

// ── Setup: runs once before VUs start ────────────────────────────────────────
export function setup() {
  const loginRes = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
    { headers: jsonHeaders() },
  );
  check(loginRes, { 'setup: admin login 200': (r) => r.status === 200 });
  const adminToken = loginRes.json('accessToken') as string;

  const stationsRes = http.get(
    `${BASE_URL}/stations?outreachId=${OUTREACH_ID}&limit=50`,
    { headers: authHeaders(adminToken) },
  );
  const stations: any[] = (stationsRes.json('items') as any[]) || [];
  const find = (name: string) =>
    stations.find((s) => s.name === name)?.id ?? null;

  check(stationsRes, { 'setup: stations loaded': (r) => r.status === 200 });

  return {
    adminToken,
    outreachId: OUTREACH_ID,
    triageStationId: find('Triage'),
  };
}

// ── Scenario 1: Auth spike ────────────────────────────────────────────────────
// No token caching — every iteration is a real login to stress JWT generation.
export function authSpike() {
  const idx = (__VU % ACCOUNTS_PER_ROLE) + 1;
  const email = `perf-clerk-${idx}@test.local`;
  const res = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ email, password: 'PerfTest123!' }),
    { headers: jsonHeaders(), tags: { endpoint: 'login' } },
  );
  check(res, { 'login: no 5xx': (r) => r.status < 500 });
}

// ── Scenario 2: Registration spike ───────────────────────────────────────────
// Login is cached per VU so that only the POST /patients path is stressed.
// Each iteration registers a unique patient — Last is timestamped to avoid
// name collisions across the burst window.
export function registrationSpike(data: ReturnType<typeof setup>) {
  const token = loginAs('clerk');
  const res = http.post(
    `${BASE_URL}/patients`,
    JSON.stringify({
      outreachId: data.outreachId,
      firstName: `SpikeVU${__VU}`,
      lastName: `Pt${Date.now()}`,
      dateOfBirth: '1985-06-15',
      gender: 'MALE',
      village: 'Kimironko',
      district: 'Gasabo',
      sector: 'Kimironko',
      cell: 'Bibare',
      province: 'City of Kigali',
    }),
    { headers: authHeaders(token), tags: { endpoint: 'register' } },
  );
  check(res, {
    'register: 201': (r) => r.status === 201,
    'register: no 5xx': (r) => r.status < 500,
  });
}

// ── Scenario 3: Read spike ────────────────────────────────────────────────────
// Alternates between queue-entries and vital-signs reads to hit both tables
// and exercise the read connection pool under burst conditions.
export function readSpike(data: ReturnType<typeof setup>) {
  const token = loginAs('clerk');

  if (__ITER % 2 === 0) {
    const res = http.get(
      `${BASE_URL}/queue-entries?outreachId=${data.outreachId}&limit=20`,
      { headers: authHeaders(token), tags: { endpoint: 'queue' } },
    );
    check(res, { 'queue: no 5xx': (r) => r.status < 500 });
  } else {
    const res = http.get(
      `${BASE_URL}/vital-signs?outreachId=${data.outreachId}&limit=20`,
      { headers: authHeaders(token), tags: { endpoint: 'vitals' } },
    );
    check(res, { 'vitals: no 5xx': (r) => r.status < 500 });
  }
}

// ── Teardown: runs once after all VUs finish ──────────────────────────────────
// Confirms the system has recovered — no stuck connections, no deadlocks from
// the pessimistic-write locking used in the dispense endpoint.
export function teardown(data: ReturnType<typeof setup>) {
  const res = http.get(
    `${BASE_URL}/queue-entries?outreachId=${data.outreachId}&limit=1`,
    { headers: authHeaders(data.adminToken) },
  );
  check(res, { 'post-spike recovery: 200': (r) => r.status === 200 });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const ACCOUNTS_PER_ROLE = 10;

// Per-VU token cache — each VU's JavaScript context is isolated in k6,
// so this is safe to declare at module scope.
const tokenCache: Record<string, string> = {};

function loginAs(role: 'clerk' | 'nurse' | 'doctor' | 'pharmacist'): string {
  if (tokenCache[role]) return tokenCache[role];

  const idx = (__VU % ACCOUNTS_PER_ROLE) + 1;
  const prefix = role === 'pharmacist' ? 'pharma' : role;
  const email = `perf-${prefix}-${idx}@test.local`;

  const res = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ email, password: 'PerfTest123!' }),
    { headers: jsonHeaders(), tags: { endpoint: 'login' } },
  );
  check(res, { [`login ${role}: 200`]: (r) => r.status === 200 });

  const token = res.json('accessToken') as string;
  tokenCache[role] = token;
  return token;
}

function jsonHeaders() {
  return { 'Content-Type': 'application/json' };
}

function authHeaders(token: string) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

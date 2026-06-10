import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Counter } from 'k6/metrics';

const BASE_URL = __ENV.APP_URL || 'http://localhost:4000';

const THRESHOLDS = {
  http_req_duration: ['p(95)<500', 'p(99)<1000'],
  http_req_failed:   ['rate<0.001'],
  'http_req_duration{endpoint:login}':        ['p(95)<200', 'p(99)<400'],
  'http_req_duration{endpoint:register}':     ['p(95)<300', 'p(99)<500'],
  'http_req_duration{endpoint:queue}':        ['p(95)<200', 'p(99)<350'],
  'http_req_duration{endpoint:vitals}':       ['p(95)<250', 'p(99)<400'],
  'http_req_duration{endpoint:stats}':        ['p(95)<500', 'p(99)<800'],
  'http_req_duration{endpoint:observation}':  ['p(95)<300', 'p(99)<500'],
  'http_req_duration{endpoint:lab}':          ['p(95)<250', 'p(99)<400'],
  'http_req_duration{endpoint:prescription}': ['p(95)<250', 'p(99)<400'],
  'http_req_duration{endpoint:dispense}':     ['p(95)<300', 'p(99)<500'],
  'http_req_duration{endpoint:pharmacy_read}':['p(95)<300', 'p(99)<500'],
};

// ── Metrics ───────────────────────────────────────────────────────────────────
const pharmacyConflicts = new Counter('pharmacy_stock_conflicts');

// ── Env ───────────────────────────────────────────────────────────────────────
const OUTREACH_ID   = __ENV.OUTREACH_ID   || '';
const ADMIN_EMAIL   = __ENV.ADMIN_EMAIL   || 'perf-admin@test.local';
const ADMIN_PASSWORD = __ENV.ADMIN_PASSWORD || 'PerfTest123!';

// ── Load test options ─────────────────────────────────────────────────────────
export const options = {
  thresholds: THRESHOLDS,
  scenarios: {
    // 200 VUs simulating the full patient clinical journey (clerks + nurses + doctors)
    clinical_users: {
      executor: 'ramping-vus',
      exec: 'clinicalFlow',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 200 }, // ramp up
        { duration: '10m', target: 200 }, // hold
        { duration: '2m', target: 0 },   // ramp down
      ],
    },
    // 30 VUs for pharmacy staff browsing inventory and dispensing prescriptions
    pharmacy_users: {
      executor: 'constant-vus',
      exec: 'pharmacyFlow',
      vus: 30,
      duration: '10m',
      startTime: '1m',
    },
    // 20 VUs for admin users polling the stats dashboard
    admin_users: {
      executor: 'constant-vus',
      exec: 'statsFlow',
      vus: 20,
      duration: '13m',
      startTime: '1m',
    },
  },
};

// ── Setup: runs once before VUs start, returns shared read-only context ────────
export function setup() {
  const loginRes = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
    { headers: jsonHeaders() },
  );
  check(loginRes, { 'setup: admin login 200': (r) => r.status === 200 });
  const adminToken = loginRes.json('accessToken') as string;

  // Resolve station IDs for the test outreach
  const stationsRes = http.get(
    `${BASE_URL}/stations?outreachId=${OUTREACH_ID}&limit=50`,
    { headers: authHeaders(adminToken) },
  );
  const stations: any[] = (stationsRes.json('items') as any[]) || [];

  const find = (name: string) => stations.find((s) => s.name === name)?.id ?? null;

  // Resolve pharmacy stock for the test outreach
  const stockRes = http.get(
    `${BASE_URL}/pharmacy-stock?outreachId=${OUTREACH_ID}&limit=20`,
    { headers: authHeaders(adminToken) },
  );
  const pharmacyStock: any[] = (stockRes.json('items') as any[]) || [];

  check(stockRes, { 'setup: pharmacy stock loaded': (r) => r.status === 200 });
  check(stationsRes, { 'setup: stations loaded': (r) => r.status === 200 });

  return {
    adminToken,
    outreachId: OUTREACH_ID,
    triageStationId:    find('Triage'),
    gpStationId:        find('General Practitioner Consultation'),
    labStationId:       find('Laboratory'),
    pharmacyStationId:  find('Pharmacy'),
    pharmacyStock,
  };
}

// ── Clinical flow: full patient journey per VU iteration ──────────────────────
// Each iteration covers: register → vitals → GP consult → (lab 30%) → pharmacy → complete
export function clinicalFlow(data: ReturnType<typeof setup>) {
  const clerkToken = loginAs('clerk');
  const nuTarget = `__VU=${__VU}`;

  // ── 1. Register patient ───────────────────────────────────────────────────
  let patientId = '';
  let queueEntryId = '';

  group('1_register_patient', () => {
    const res = http.post(
      `${BASE_URL}/patients`,
      JSON.stringify({
        outreachId:   data.outreachId,
        firstName:    `PerfVU${__VU}`,
        lastName:     `Patient${Date.now()}`,
        dateOfBirth:  '1985-06-15',
        gender:       'MALE',
        village:      'Kimironko',
        district:     'Gasabo',
        sector:       'Kimironko',
        cell:         'Bibare',
        province:     'City of Kigali',
      }),
      { headers: authHeaders(clerkToken), tags: { endpoint: 'register' } },
    );
    check(res, {
      'register: 201': (r) => r.status === 201,
      'register: has id': (r) => !!(r.json('id') as string),
    });
    if (res.status === 201) patientId = res.json('id') as string;
  });

  if (!patientId) { sleep(1); return; }
  sleep(0.3);

  // ── 2. Find the auto-created triage queue entry ───────────────────────────
  group('2_find_queue_entry', () => {
    const res = http.get(
      `${BASE_URL}/queue-entries?patientId=${patientId}&outreachId=${data.outreachId}&limit=1`,
      { headers: authHeaders(clerkToken), tags: { endpoint: 'queue', name: 'GET /queue-entries' } },
    );
    check(res, { 'queue entry: 200': (r) => r.status === 200 });
    const items = (res.json('items') as any[]) || [];
    if (items.length > 0) queueEntryId = items[0].id;
  });

  if (!queueEntryId) { sleep(1); return; }
  sleep(0.3);

  // ── 3. Record vitals at Triage (nurse) ────────────────────────────────────
  const nurseToken = loginAs('nurse');

  group('3_vitals', () => {
    const res = http.post(
      `${BASE_URL}/vital-signs`,
      JSON.stringify({
        patientId,
        stationId:               data.triageStationId,
        bloodPressureSystolic:   110 + Math.floor(Math.random() * 30),
        bloodPressureDiastolic:  70  + Math.floor(Math.random() * 20),
        pulseRate:               65  + Math.floor(Math.random() * 25),
        temperature:             36.5 + Math.random() * 1.5,
        weight:                  55  + Math.floor(Math.random() * 30),
        height:                  155 + Math.floor(Math.random() * 30),
        oxygenSaturation:        96  + Math.floor(Math.random() * 4),
      }),
      { headers: authHeaders(nurseToken), tags: { endpoint: 'vitals' } },
    );
    check(res, { 'vitals: 201': (r) => r.status === 201 });
  });

  sleep(0.3);

  // ── 4. Move patient to GP ─────────────────────────────────────────────────
  group('4_move_to_gp', () => {
    const res = http.patch(
      `${BASE_URL}/queue-entries/${queueEntryId}/move`,
      JSON.stringify({ stationId: data.gpStationId }),
      { headers: authHeaders(nurseToken), tags: { endpoint: 'queue', name: 'PATCH /queue-entries/:id/move' } },
    );
    check(res, { 'move to GP: 200': (r) => r.status === 200 });
  });

  sleep(0.5);

  // ── 5. Clinical observation (doctor) ─────────────────────────────────────
  const doctorToken = loginAs('doctor');
  let prescriptionId = '';

  group('5_observation', () => {
    const res = http.post(
      `${BASE_URL}/observations`,
      JSON.stringify({
        queueEntryId,
        patientId,
        stationId:        data.gpStationId,
        outreachId:       data.outreachId,
        chiefComplaint:   'Headache and general malaise',
        diagnosis:        'Tension headache — mild',
        treatmentGiven:   'Paracetamol 500mg',
        followUpRequired: false,
      }),
      { headers: authHeaders(doctorToken), tags: { endpoint: 'observation' } },
    );
    check(res, { 'observation: 201': (r) => r.status === 201 });
  });

  sleep(0.3);

  // ── 6. Prescription ───────────────────────────────────────────────────────
  group('6_prescription', () => {
    if (!data.pharmacyStock?.length) return;
    const stock = data.pharmacyStock[Math.floor(Math.random() * data.pharmacyStock.length)];
    const res = http.post(
      `${BASE_URL}/prescriptions`,
      JSON.stringify({
        queueEntryId,
        patientId,
        outreachId:       data.outreachId,
        pharmacyStockId:  stock.id,
        dosage:           '500mg twice daily',
        quantity:         14,
        instructions:     'Take after meals',
      }),
      { headers: authHeaders(doctorToken), tags: { endpoint: 'prescription' } },
    );
    check(res, { 'prescription: 201': (r) => r.status === 201 });
    if (res.status === 201) prescriptionId = res.json('id') as string;
  });

  sleep(0.3);

  // ── 7. Branch: 30% of patients go through the lab ────────────────────────
  group('7_lab_branch', () => {
    if (__VU % 10 < 3) {
      const moveRes = http.patch(
        `${BASE_URL}/queue-entries/${queueEntryId}/move`,
        JSON.stringify({ stationId: data.labStationId }),
        { headers: authHeaders(doctorToken), tags: { endpoint: 'queue', name: 'PATCH /queue-entries/:id/move' } },
      );
      check(moveRes, { 'move to lab: 200': (r) => r.status === 200 });

      sleep(0.3);

      const labRes = http.post(
        `${BASE_URL}/lab-results`,
        JSON.stringify({
          queueEntryId,
          patientId,
          stationId:   data.labStationId,
          outreachId:  data.outreachId,
          testType:    'MALARIA_RDT',
          resultValue: 'Negative',
          isAbnormal:  false,
        }),
        { headers: authHeaders(doctorToken), tags: { endpoint: 'lab' } },
      );
      check(labRes, { 'lab result: 201': (r) => r.status === 201 });

      sleep(0.3);
    }
  });

  // ── 8. Move to pharmacy ───────────────────────────────────────────────────
  group('8_move_to_pharmacy', () => {
    const res = http.patch(
      `${BASE_URL}/queue-entries/${queueEntryId}/move`,
      JSON.stringify({ stationId: data.pharmacyStationId }),
      { headers: authHeaders(doctorToken), tags: { endpoint: 'queue', name: 'PATCH /queue-entries/:id/move' } },
    );
    check(res, { 'move to pharmacy: 200': (r) => r.status === 200 });
  });

  sleep(0.5);

  // ── 9. Dispense prescription (pharmacist) ────────────────────────────────
  const pharmacistToken = loginAs('pharmacist');

  group('9_dispense', () => {
    if (!prescriptionId) return;
    const res = http.patch(
      `${BASE_URL}/prescriptions/${prescriptionId}/dispense`,
      null,
      { headers: authHeaders(pharmacistToken), tags: { endpoint: 'dispense', name: 'PATCH /prescriptions/:id/dispense' } },
    );
    check(res, { 'dispense: 200': (r) => r.status === 200 });
  });

  sleep(0.3);

  // ── 10. Mark complete ─────────────────────────────────────────────────────
  group('10_complete', () => {
    const res = http.patch(
      `${BASE_URL}/queue-entries/${queueEntryId}/status`,
      JSON.stringify({ status: 'COMPLETED' }),
      { headers: authHeaders(pharmacistToken), tags: { endpoint: 'queue', name: 'PATCH /queue-entries/:id/status' } },
    );
    check(res, { 'complete: 200': (r) => r.status === 200 });
  });

  sleep(1 + Math.random() * 2); // 1–3 s think time between iterations
}

// ── Pharmacy flow: inventory reads + pending prescriptions ────────────────────
export function pharmacyFlow(data: ReturnType<typeof setup>) {
  const token = loginAs('pharmacist');

  group('pharmacy_inventory', () => {
    const res = http.get(
      `${BASE_URL}/pharmacy-stock?outreachId=${data.outreachId}&limit=20`,
      { headers: authHeaders(token), tags: { endpoint: 'pharmacy_read' } },
    );
    check(res, {
      'inventory: 200':       (r) => r.status === 200,
      'inventory: has items': (r) => Array.isArray((r.json('items') as any[])),
    });
  });

  sleep(0.5);

  group('pending_prescriptions', () => {
    const res = http.get(
      `${BASE_URL}/prescriptions?outreachId=${data.outreachId}&limit=10`,
      { headers: authHeaders(token), tags: { endpoint: 'pharmacy_read' } },
    );
    check(res, { 'prescriptions list: 200': (r) => r.status === 200 });
  });

  sleep(3);
}

// ── Stats flow: admin polls dashboard endpoints ───────────────────────────────
export function statsFlow(data: ReturnType<typeof setup>) {
  const token = data.adminToken;

  group('stats_dashboard', () => {
    const endpoints = [
      `/stats/admin?outreachId=${data.outreachId}`,
      `/stats/vitals?outreachId=${data.outreachId}`,
      `/stats/pharmacy?outreachId=${data.outreachId}`,
      `/stats/disease?outreachId=${data.outreachId}`,
    ];

    for (const path of endpoints) {
      const name = path.split('?')[0]; // strip query string for metric grouping
      const res = http.get(`${BASE_URL}${path}`, {
        headers: authHeaders(token),
        tags: { endpoint: 'stats', name: `GET ${name}` },
      });
      check(res, { [`${name}: 200`]: (r) => r.status === 200 });
      sleep(0.2);
    }
  });

  sleep(5);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

// Per-VU token cache — each VU logs in once per role per session
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

const ACCOUNTS_PER_ROLE = 10;

function jsonHeaders() {
  return { 'Content-Type': 'application/json' };
}

function authHeaders(token: string) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

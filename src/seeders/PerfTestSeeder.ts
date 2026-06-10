import { EntityManager } from '@mikro-orm/postgresql';
import { Seeder } from '@mikro-orm/seeder';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { Outreach, OutreachStatus } from '../outreaches/entities/outreach.entity';
import { PharmacyStock } from '../pharmacy-stock/entities/pharmacy-stock.entity';
import { Role } from '../roles/entities/role.entity';
import { DEFAULT_STATIONS, Station } from '../stations/entities/station.entity';
import { User } from '../users/entities/user.entity';

const PERF_PASSWORD = 'PerfTest123!';
const BCRYPT_ROUNDS = 10;

const PERF_ROLES = ['DATA_CLERK', 'NURSE', 'DOCTOR', 'PHARMACIST'] as const;
const ACCOUNTS_PER_ROLE = 10;

const MEDICATIONS = [
  { medicationName: 'Amoxicillin',  genericName: 'Amoxicillin trihydrate', dosageForm: 'TABLET',  strength: '500mg', unitOfMeasure: 'tablets' },
  { medicationName: 'Paracetamol',  genericName: 'Acetaminophen',          dosageForm: 'TABLET',  strength: '500mg', unitOfMeasure: 'tablets' },
  { medicationName: 'Metformin',    genericName: 'Metformin hydrochloride', dosageForm: 'TABLET',  strength: '500mg', unitOfMeasure: 'tablets' },
  { medicationName: 'ORS Sachets',  genericName: 'Oral Rehydration Salts',  dosageForm: 'SACHET',  strength: '1L',    unitOfMeasure: 'sachets' },
  { medicationName: 'Ibuprofen',    genericName: 'Ibuprofen',               dosageForm: 'TABLET',  strength: '400mg', unitOfMeasure: 'tablets' },
];

export class PerfTestSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    const passwordHash = await bcrypt.hash(PERF_PASSWORD, BCRYPT_ROUNDS);

    // ── Resolve roles ──────────────────────────────────────────────────
    const roleMap = new Map<string, Role>();
    for (const name of [...PERF_ROLES, 'SUPER_ADMIN']) {
      const role = await em.findOne(Role, { name });
      if (!role) throw new Error(`Role "${name}" not found — run RoleSeeder first`);
      roleMap.set(name, role);
    }

    // ── Admin account ──────────────────────────────────────────────────
    let adminUser = await em.findOne(User, { email: 'perf-admin@test.local' });
    if (!adminUser) {
      adminUser = em.create(User, {
        id: randomUUID(),
        firstName: 'Perf',
        lastName: 'Admin',
        email: 'perf-admin@test.local',
        passwordHash,
        mustChangePassword: false,
        isActive: true,
      });
      adminUser.roles.set([roleMap.get('SUPER_ADMIN')!]);
      em.persist(adminUser);
    }
    await em.flush();

    // ── Clinical test users ────────────────────────────────────────────
    const allPerfUsers: User[] = [adminUser];
    for (const roleName of PERF_ROLES) {
      const prefix = roleName === 'DATA_CLERK' ? 'clerk'
        : roleName === 'PHARMACIST' ? 'pharma'
        : roleName.toLowerCase();

      for (let i = 1; i <= ACCOUNTS_PER_ROLE; i++) {
        const email = `perf-${prefix}-${i}@test.local`;
        let user = await em.findOne(User, { email });
        if (!user) {
          user = em.create(User, {
            id: randomUUID(),
            firstName: `Perf${roleName}`,
            lastName: `${i}`,
            email,
            passwordHash,
            mustChangePassword: false,
            isActive: true,
          });
          user.roles.set([roleMap.get(roleName)!]);
          em.persist(user);
        }
        allPerfUsers.push(user);
      }
    }
    await em.flush();

    // ── Test outreach ──────────────────────────────────────────────────
    let outreach = await em.findOne(Outreach, { name: 'Perf Load Test' });
    if (!outreach) {
      outreach = em.create(Outreach, {
        id: randomUUID(),
        name: 'Perf Load Test',
        location: 'Kigali, Rwanda',
        date: new Date(),
        status: OutreachStatus.ACTIVE,
        createdBy: adminUser,
      });
      em.persist(outreach);
      await em.flush();

      // Create default stations
      for (const { name, type } of DEFAULT_STATIONS) {
        em.create(Station, { id: randomUUID(), outreach, name, type, isActive: true });
      }
      await em.flush();
    }

    // Add all perf users as members (idempotent via Set semantics)
    await em.populate(outreach, ['members']);
    const existingMemberIds = new Set(outreach.members.getItems().map((u) => u.id));
    for (const user of allPerfUsers) {
      if (!existingMemberIds.has(user.id)) {
        outreach.members.add(user);
      }
    }
    await em.flush();

    // ── Pharmacy stock ─────────────────────────────────────────────────
    for (const med of MEDICATIONS) {
      const existing = await em.findOne(PharmacyStock, {
        outreach: { id: outreach.id },
        medicationName: med.medicationName,
      });
      if (!existing) {
        em.create(PharmacyStock, {
          id: randomUUID(),
          outreach,
          ...med,
          quantityInStock: 1_000_000,
          lowStockThreshold: 10000,
          category: 'General',
        });
      }
    }
    await em.flush();

    // ── Print IDs for use in k6 ────────────────────────────────────────
    const stations = await em.find(Station, { outreach: { id: outreach.id } });
    const pharmacyStock = await em.find(PharmacyStock, { outreach: { id: outreach.id } });

    console.log('\n========= PERF TEST SEED COMPLETE =========');
    console.log(`OUTREACH_ID=${outreach.id}`);
    for (const s of stations) {
      console.log(`  Station [${s.name}] => ${s.id}`);
    }
    for (const p of pharmacyStock) {
      console.log(`  Stock [${p.medicationName}] => ${p.id}`);
    }
    console.log('===========================================\n');
    console.log('Run load test with:');
    console.log(`  k6 run -e OUTREACH_ID=${outreach.id} test/perf/load-test.spec.ts`);
    console.log('============================================\n');
  }
}

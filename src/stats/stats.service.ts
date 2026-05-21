import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import type { Knex } from 'knex';
import { AuthenticatedUser } from 'src/auth/auth.types';

@Injectable()
export class StatsService {
  constructor(private readonly em: EntityManager) {}

  async getStatsByRole(user: AuthenticatedUser, outreachId: string) {
    if (user.roles.includes('SUPER_ADMIN')) return this.getAdminStats(outreachId);
    if (user.roles.includes('DOCTOR')) return this.getDoctorStats(user.id, outreachId);
    if (user.roles.includes('DATA_CLERK')) return this.getClerkStats(outreachId);
    if (user.roles.includes('PHARMACIST')) return this.getPharmacistStats(user.id, outreachId);
    return {};
  }

  // ─── Admin ────────────────────────────────────────────────────────────────

  async getAdminStats(outreachId: string) {
    const knex = this.em.getKnex();

    const [
      totalPatientsToday,
      totalPatientsOutreach,
      transfersCount,
      abnormalLabsCount,
      genderBreakdown,
      ageGroups,
      topDiagnoses,
      phq9Distribution,
      gad7Distribution,
      activeQueueLengths,
    ] = await Promise.all([
      this.countPatientsToday(knex, outreachId),
      this.countPatientsOutreach(knex, outreachId),
      this.countTransfers(knex, outreachId),
      this.countAbnormalLabs(knex, outreachId),
      this.genderBreakdown(knex, outreachId),
      this.ageGroups(knex, outreachId),
      this.topDiagnoses(knex, outreachId),
      this.phq9Distribution(knex, outreachId),
      this.gad7Distribution(knex, outreachId),
      this.activeQueueLengths(knex, outreachId),
    ]);

    return {
      totalPatientsToday,
      totalPatientsOutreach,
      transfersCount,
      abnormalLabsCount,
      genderBreakdown,
      ageGroups,
      topDiagnoses,
      phq9Distribution,
      gad7Distribution,
      activeQueueLengths,
    };
  }

  // ─── Doctor ───────────────────────────────────────────────────────────────

  async getDoctorStats(doctorId: string, outreachId: string) {
    const knex = this.em.getKnex();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      consultationsDoneToday,
      consultationsDoneOutreach,
      patientsWaitingInMyQueue,
      avgRow,
      followUpsRecommended,
      transfersInitiated,
      emergencyCasesHandled,
      phq9Done,
      gad7Done,
      labsDone,
      myTopDiagnoses,
      abnormalVitalsFlagged,
    ] = await Promise.all([
      knex('observations')
        .where('outreach_id', outreachId)
        .where('recorded_by_id', doctorId)
        .where('created_at', '>=', today)
        .count('* as count')
        .first()
        .then((r) => Number(r?.count ?? 0)),

      knex('observations')
        .where('outreach_id', outreachId)
        .where('recorded_by_id', doctorId)
        .count('* as count')
        .first()
        .then((r) => Number(r?.count ?? 0)),

      // outreach-wide active queue (no doctor-station link in schema)
      knex('queue_entries')
        .where('outreach_id', outreachId)
        .whereIn('status', ['WAITING', 'IN_SERVICE'])
        .count('* as count')
        .first()
        .then((r) => Number(r?.count ?? 0)),

      // avg time from queue entry created_at to observation recorded
      knex('observations as o')
        .join('queue_entries as qe', 'qe.id', 'o.queue_entry_id')
        .where('o.outreach_id', outreachId)
        .where('o.recorded_by_id', doctorId)
        .whereNotNull('qe.created_at')
        .select(
          knex.raw(
            "ROUND(AVG(EXTRACT(EPOCH FROM (o.created_at - qe.created_at)) / 60)) as minutes",
          ),
        )
        .first()
        .then((r) => r as unknown as { minutes: string | null } | undefined),

      knex('observations')
        .where('outreach_id', outreachId)
        .where('recorded_by_id', doctorId)
        .where('follow_up_required', true)
        .count('* as count')
        .first()
        .then((r) => Number(r?.count ?? 0)),

      knex('transfers')
        .where('outreach_id', outreachId)
        .where('initiated_by_id', doctorId)
        .count('* as count')
        .first()
        .then((r) => Number(r?.count ?? 0)),

      // outreach-wide emergency cases handled (no doctor FK on queue_entries)
      knex('queue_entries')
        .where('outreach_id', outreachId)
        .where('priority', 'EMERGENCY')
        .where('status', 'COMPLETED')
        .count('* as count')
        .first()
        .then((r) => Number(r?.count ?? 0)),

      knex('phq9_screenings')
        .where('outreach_id', outreachId)
        .where('recorded_by_id', doctorId)
        .count('* as count')
        .first()
        .then((r) => Number(r?.count ?? 0)),

      knex('gad7_screenings')
        .where('outreach_id', outreachId)
        .where('recorded_by_id', doctorId)
        .count('* as count')
        .first()
        .then((r) => Number(r?.count ?? 0)),

      knex('lab_results')
        .where('outreach_id', outreachId)
        .where('recorded_by_id', doctorId)
        .count('* as count')
        .first()
        .then((r) => Number(r?.count ?? 0)),

      knex('observations')
        .select('diagnosis')
        .count('* as count')
        .where('outreach_id', outreachId)
        .where('recorded_by_id', doctorId)
        .whereNotNull('diagnosis')
        .whereNot('diagnosis', '')
        .groupBy('diagnosis')
        .orderBy('count', 'desc')
        .limit(5)
        .then((rows) =>
          rows.map((r) => ({ diagnosis: String(r.diagnosis), count: Number(r.count) })),
        ),

      knex('vital_signs')
        .where('outreach_id', outreachId)
        .where('recorded_by_id', doctorId)
        .where(function () {
          this.where('blood_pressure_systolic', '>=', 140)
            .orWhere('blood_pressure_diastolic', '>=', 90)
            .orWhere('temperature', '>=', 37.5)
            .orWhere('blood_glucose', '>', 11.1)
            .orWhere('oxygen_saturation', '<', 95);
        })
        .count('* as count')
        .first()
        .then((r) => Number(r?.count ?? 0)),
    ]);

    return {
      consultationsDoneToday,
      consultationsDoneOutreach,
      patientsWaitingInMyQueue,
      avgConsultationMinutes: Math.round(Number(avgRow?.minutes ?? 0)),
      followUpsRecommended,
      transfersInitiated,
      emergencyCasesHandled,
      formsCompleted: { phq9: phq9Done, gad7: gad7Done, labs: labsDone },
      myTopDiagnoses,
      abnormalVitalsFlagged,
    };
  }

  // ─── Data Clerk ───────────────────────────────────────────────────────────

  async getClerkStats(outreachId: string) {
    const knex = this.em.getKnex();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      registeredToday,
      registeredOutreach,
      registrationsPerHour,
      genderBreakdown,
      enqueuedCount,
      pendingEnqueue,
      priorityRows,
      ageGroups,
    ] = await Promise.all([
      knex('patients')
        .where('outreach_id', outreachId)
        .where('created_at', '>=', today)
        .count('* as count')
        .first()
        .then((r) => Number(r?.count ?? 0)),

      knex('patients')
        .where('outreach_id', outreachId)
        .count('* as count')
        .first()
        .then((r) => Number(r?.count ?? 0)),

      knex('patients')
        .select(knex.raw("TO_CHAR(created_at, 'HH24:00') as hour"))
        .count('* as count')
        .where('outreach_id', outreachId)
        .where('created_at', '>=', today)
        .groupByRaw("TO_CHAR(created_at, 'HH24:00')")
        .orderByRaw("TO_CHAR(created_at, 'HH24:00')")
        .then((rows) => rows.map((r) => ({ hour: String(r.hour), count: Number(r.count) }))),

      this.genderBreakdown(knex, outreachId),

      knex('queue_entries')
        .where('outreach_id', outreachId)
        .count('* as count')
        .first()
        .then((r) => Number(r?.count ?? 0)),

      knex('patients')
        .where('outreach_id', outreachId)
        .whereNotExists(
          knex('queue_entries')
            .whereRaw('queue_entries.patient_id = patients.id')
            .where('queue_entries.outreach_id', outreachId),
        )
        .count('* as count')
        .first()
        .then((r) => Number(r?.count ?? 0)),

      knex('queue_entries')
        .select('priority')
        .count('* as count')
        .where('outreach_id', outreachId)
        .groupBy('priority'),

      this.ageGroups(knex, outreachId),
    ]);

    const priorityMap: Record<string, number> = {};
    for (const row of priorityRows) {
      priorityMap[String(row.priority)] = Number(row.count);
    }

    return {
      registeredToday,
      registeredOutreach,
      registrationsPerHour,
      genderBreakdown,
      enqueuedCount,
      pendingEnqueue,
      priorityAssignments: {
        normal: priorityMap['NORMAL'] ?? 0,
        urgent: priorityMap['URGENT'] ?? 0,
        emergency: priorityMap['EMERGENCY'] ?? 0,
      },
      ageGroups,
    };
  }

  // ─── Pharmacist ───────────────────────────────────────────────────────────

  async getPharmacistStats(pharmacistId: string, outreachId: string) {
    const knex = this.em.getKnex();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      itemsDispensedToday,
      uniquePatientsServed,
      lowStockItems,
      outOfStockItems,
      topDispensedMedications,
      stockConsumptionByDay,
    ] = await Promise.all([
      knex('prescriptions')
        .where('outreach_id', outreachId)
        .where('dispensed_by_id', pharmacistId)
        .where('status', 'DISPENSED')
        .where('dispensed_at', '>=', today)
        .sum('quantity as total')
        .first()
        .then((r) => Number(r?.total ?? 0)),

      knex('prescriptions')
        .countDistinct('patient_id as count')
        .where('outreach_id', outreachId)
        .where('dispensed_by_id', pharmacistId)
        .where('status', 'DISPENSED')
        .first()
        .then((r) => Number(r?.count ?? 0)),

      knex('pharmacy_stock')
        .select('medication_name', 'quantity_in_stock', 'low_stock_threshold')
        .where('outreach_id', outreachId)
        .where('is_active', true)
        .whereRaw('quantity_in_stock > 0 AND quantity_in_stock <= low_stock_threshold')
        .orderBy('quantity_in_stock', 'asc')
        .then((rows) =>
          rows.map((r) => ({
            medicationName: String(r.medication_name),
            quantityInStock: Number(r.quantity_in_stock),
            threshold: Number(r.low_stock_threshold),
          })),
        ),

      knex('pharmacy_stock')
        .select('medication_name')
        .where('outreach_id', outreachId)
        .where('is_active', true)
        .where('quantity_in_stock', 0)
        .then((rows) => rows.map((r) => ({ medicationName: String(r.medication_name) }))),

      knex('prescriptions as p')
        .join('pharmacy_stock as ps', 'ps.id', 'p.pharmacy_stock_id')
        .select('ps.medication_name')
        .sum('p.quantity as total_dispensed')
        .where('p.outreach_id', outreachId)
        .where('p.status', 'DISPENSED')
        .groupBy('ps.medication_name')
        .orderBy('total_dispensed', 'desc')
        .limit(10)
        .then((rows) =>
          rows.map((r) => ({
            medicationName: String(r.medication_name),
            totalDispensed: Number(r.total_dispensed),
          })),
        ),

      knex('prescriptions')
        .select(knex.raw('DATE(dispensed_at) as date'))
        .sum('quantity as total_dispensed')
        .where('outreach_id', outreachId)
        .where('status', 'DISPENSED')
        .whereRaw("dispensed_at >= NOW() - INTERVAL '7 days'")
        .groupByRaw('DATE(dispensed_at)')
        .orderByRaw('DATE(dispensed_at)')
        .then((rows) =>
          rows.map((r) => ({
            date: String(r.date),
            totalDispensed: Number(r.total_dispensed),
          })),
        ),
    ]);

    return {
      itemsDispensedToday,
      uniquePatientsServed,
      lowStockItems,
      outOfStockItems,
      topDispensedMedications,
      stockConsumptionByDay,
    };
  }

  // ─── Admin Analytics ──────────────────────────────────────────────────────

  async getDiseaseStats(outreachId: string, startDate?: Date, endDate?: Date) {
    const knex = this.em.getKnex();

    const [topDiagnosesRaw, totalObservations, totalPatients] = await Promise.all([
      this.applyDateRange(
        knex('observations as o')
          .join('patients as p', 'p.id', 'o.patient_id')
          .select(
            'o.diagnosis',
            knex.raw('count(*) as count'),
            knex.raw("SUM(CASE WHEN p.gender = 'MALE' THEN 1 ELSE 0 END) as male_count"),
            knex.raw("SUM(CASE WHEN p.gender = 'FEMALE' THEN 1 ELSE 0 END) as female_count"),
          )
          .where('p.outreach_id', outreachId)
          .whereNotNull('o.diagnosis')
          .whereNot('o.diagnosis', ''),
        'o.created_at',
        startDate,
        endDate,
      )
        .groupBy('o.diagnosis')
        .orderBy('count', 'desc')
        .limit(10),

      this.applyDateRange(
        knex('observations').where('outreach_id', outreachId).count('* as count'),
        'created_at',
        startDate,
        endDate,
      )
        .first()
        .then((r) => Number(r?.count ?? 0)),

      this.applyDateRange(
        knex('patients').where('outreach_id', outreachId).count('* as count'),
        'created_at',
        startDate,
        endDate,
      )
        .first()
        .then((r) => Number(r?.count ?? 0)),
    ]);

    const topDiagnoses = topDiagnosesRaw.map((r) => ({
      diagnosis: String(r.diagnosis),
      count: Number(r.count),
      percentOfPatients:
        totalPatients > 0 ? Math.round((Number(r.count) / totalPatients) * 100) : 0,
      maleCount: Number(r.male_count),
      femaleCount: Number(r.female_count),
    }));

    return { topDiagnoses, totalObservations };
  }

  async getMentalHealthStats(outreachId: string, startDate?: Date, endDate?: Date) {
    const knex = this.em.getKnex();

    const [phq9Rows, gad7Rows, totalPatients, totalPhq9Screened, severePatientIds] =
      await Promise.all([
        this.applyDateRange(
          knex('phq9_screenings').where('outreach_id', outreachId).select('severity').count('* as count'),
          'created_at',
          startDate,
          endDate,
        ).groupBy('severity'),

        this.applyDateRange(
          knex('gad7_screenings').where('outreach_id', outreachId).select('severity').count('* as count'),
          'created_at',
          startDate,
          endDate,
        ).groupBy('severity'),

        this.applyDateRange(
          knex('patients').where('outreach_id', outreachId).count('* as count'),
          'created_at',
          startDate,
          endDate,
        )
          .first()
          .then((r) => Number(r?.count ?? 0)),

        this.applyDateRange(
          knex('phq9_screenings').where('outreach_id', outreachId).countDistinct('patient_id as count'),
          'created_at',
          startDate,
          endDate,
        )
          .first()
          .then((r) => Number(r?.count ?? 0)),

        this.applyDateRange(
          knex('phq9_screenings')
            .where('outreach_id', outreachId)
            .whereIn('severity', ['MOD_SEVERE', 'SEVERE'])
            .select('patient_id')
            .distinct(),
          'created_at',
          startDate,
          endDate,
        ).then((rows) => rows.map((r) => String(r.patient_id))),
      ]);

    let referralRate = 0;
    if (severePatientIds.length > 0) {
      const transferred = await this.applyDateRange(
        knex('transfers')
          .where('outreach_id', outreachId)
          .whereIn('patient_id', severePatientIds)
          .count('* as count'),
        'created_at',
        startDate,
        endDate,
      ).first();
      referralRate = Math.round(
        (Number(transferred?.count ?? 0) / severePatientIds.length) * 100,
      );
    }

    const phq9Map: Record<string, number> = {};
    for (const r of phq9Rows) phq9Map[String(r.severity)] = Number(r.count);

    const gad7Map: Record<string, number> = {};
    for (const r of gad7Rows) gad7Map[String(r.severity)] = Number(r.count);

    const phq9Total = Object.values(phq9Map).reduce((a, b) => a + b, 0);
    const gad7Total = Object.values(gad7Map).reduce((a, b) => a + b, 0);
    const percentOfPatientsScreened =
      totalPatients > 0 ? Math.round((totalPhq9Screened / totalPatients) * 100) : 0;

    return {
      phq9: {
        total: phq9Total,
        none: phq9Map['NONE'] ?? 0,
        mild: phq9Map['MILD'] ?? 0,
        moderate: phq9Map['MODERATE'] ?? 0,
        modSevere: phq9Map['MOD_SEVERE'] ?? 0,
        severe: phq9Map['SEVERE'] ?? 0,
        referralRate,
      },
      gad7: {
        total: gad7Total,
        minimal: gad7Map['MINIMAL'] ?? 0,
        mild: gad7Map['MILD'] ?? 0,
        moderate: gad7Map['MODERATE'] ?? 0,
        severe: gad7Map['SEVERE'] ?? 0,
      },
      percentOfPatientsScreened,
    };
  }

  async getLabStats(outreachId: string, startDate?: Date, endDate?: Date) {
    const knex = this.em.getKnex();

    const rows = await this.applyDateRange(
      knex('lab_results as l')
        .where('l.outreach_id', outreachId)
        .select(
          'l.test_type',
          knex.raw('count(*) as total_tests'),
          knex.raw('SUM(CASE WHEN l.is_abnormal = true THEN 1 ELSE 0 END) as positive_count'),
        ),
      'l.created_at',
      startDate,
      endDate,
    ).groupBy('l.test_type');

    const byTestType = rows.map((r) => {
      const totalTests = Number(r.total_tests);
      const positiveCount = Number(r.positive_count);
      return {
        testType: String(r.test_type),
        totalTests,
        positiveCount,
        positivityRate: totalTests > 0 ? Math.round((positiveCount / totalTests) * 100) : 0,
      };
    });

    const totalTests = byTestType.reduce((a, b) => a + b.totalTests, 0);
    const totalAbnormal = byTestType.reduce((a, b) => a + b.positiveCount, 0);
    const overallAbnormalRate =
      totalTests > 0 ? Math.round((totalAbnormal / totalTests) * 100) : 0;

    return { byTestType, totalTests, totalAbnormal, overallAbnormalRate };
  }

  async getVitalsStats(outreachId: string, startDate?: Date, endDate?: Date) {
    const knex = this.em.getKnex();

    const [
      hypertensionCount,
      totalVitalRecords,
      avgBmiRow,
      overweightCount,
      obeseCount,
      highGlucoseCount,
      lowOxygenCount,
      feverCount,
    ] = await Promise.all([
      this.applyDateRange(
        knex('vital_signs')
          .where('outreach_id', outreachId)
          .where(function () {
            this.where('blood_pressure_systolic', '>=', 140).orWhere(
              'blood_pressure_diastolic',
              '>=',
              90,
            );
          })
          .count('* as count'),
        'created_at',
        startDate,
        endDate,
      )
        .first()
        .then((r) => Number(r?.count ?? 0)),

      this.applyDateRange(
        knex('vital_signs').where('outreach_id', outreachId).count('* as count'),
        'created_at',
        startDate,
        endDate,
      )
        .first()
        .then((r) => Number(r?.count ?? 0)),

      this.applyDateRange(
        knex('vital_signs').where('outreach_id', outreachId).whereNotNull('bmi').avg('bmi as avg_bmi'),
        'created_at',
        startDate,
        endDate,
      ).first(),

      this.applyDateRange(
        knex('vital_signs').where('outreach_id', outreachId).where('bmi', '>=', 25).count('* as count'),
        'created_at',
        startDate,
        endDate,
      )
        .first()
        .then((r) => Number(r?.count ?? 0)),

      this.applyDateRange(
        knex('vital_signs').where('outreach_id', outreachId).where('bmi', '>=', 30).count('* as count'),
        'created_at',
        startDate,
        endDate,
      )
        .first()
        .then((r) => Number(r?.count ?? 0)),

      this.applyDateRange(
        knex('vital_signs')
          .where('outreach_id', outreachId)
          .whereNotNull('blood_glucose')
          .where('blood_glucose', '>', 11.1)
          .count('* as count'),
        'created_at',
        startDate,
        endDate,
      )
        .first()
        .then((r) => Number(r?.count ?? 0)),

      this.applyDateRange(
        knex('vital_signs')
          .where('outreach_id', outreachId)
          .whereNotNull('oxygen_saturation')
          .where('oxygen_saturation', '<', 95)
          .count('* as count'),
        'created_at',
        startDate,
        endDate,
      )
        .first()
        .then((r) => Number(r?.count ?? 0)),

      this.applyDateRange(
        knex('vital_signs')
          .where('outreach_id', outreachId)
          .where('temperature', '>=', 37.5)
          .count('* as count'),
        'created_at',
        startDate,
        endDate,
      )
        .first()
        .then((r) => Number(r?.count ?? 0)),
    ]);

    const avgBmi = Math.round(Number(avgBmiRow?.avg_bmi ?? 0) * 10) / 10;
    const hypertensionRate =
      totalVitalRecords > 0 ? Math.round((hypertensionCount / totalVitalRecords) * 100) : 0;

    return {
      hypertensionCount,
      hypertensionRate,
      avgBmi,
      overweightCount,
      obeseCount,
      highGlucoseCount,
      lowOxygenCount,
      feverCount,
      totalVitalRecords,
    };
  }

  async getDoctorPerformanceStats(outreachId: string, startDate?: Date, endDate?: Date) {
    const knex = this.em.getKnex();

    const [consultationRows, transferRows, phq9Rows, gad7Rows, labRows, avgTimeRows] =
      await Promise.all([
        this.applyDateRange(
          knex('observations as o')
            .join('users as u', 'u.id', 'o.recorded_by_id')
            .select(
              'u.id as doctor_id',
              knex.raw("u.first_name || ' ' || u.last_name as doctor_name"),
              knex.raw('count(o.id) as consultations_count'),
              knex.raw(
                'SUM(CASE WHEN o.follow_up_required = true THEN 1 ELSE 0 END) as follow_up_count',
              ),
            )
            .where('o.outreach_id', outreachId),
          'o.created_at',
          startDate,
          endDate,
        ).groupBy('u.id', 'u.first_name', 'u.last_name'),

        this.applyDateRange(
          knex('transfers')
            .select('initiated_by_id as doctor_id')
            .count('* as transfer_count')
            .where('outreach_id', outreachId),
          'created_at',
          startDate,
          endDate,
        ).groupBy('initiated_by_id'),

        this.applyDateRange(
          knex('phq9_screenings')
            .select('recorded_by_id as doctor_id')
            .count('* as count')
            .where('outreach_id', outreachId),
          'created_at',
          startDate,
          endDate,
        ).groupBy('recorded_by_id'),

        this.applyDateRange(
          knex('gad7_screenings')
            .select('recorded_by_id as doctor_id')
            .count('* as count')
            .where('outreach_id', outreachId),
          'created_at',
          startDate,
          endDate,
        ).groupBy('recorded_by_id'),

        this.applyDateRange(
          knex('lab_results')
            .select('recorded_by_id as doctor_id')
            .count('* as count')
            .where('outreach_id', outreachId),
          'created_at',
          startDate,
          endDate,
        ).groupBy('recorded_by_id'),

        this.applyDateRange(
          knex('observations as o')
            .join('queue_entries as qe', 'qe.id', 'o.queue_entry_id')
            .select('o.recorded_by_id as doctor_id')
            .select(
              knex.raw(
                "ROUND(AVG(EXTRACT(EPOCH FROM (o.created_at - qe.created_at)) / 60)) as avg_minutes",
              ),
            )
            .where('o.outreach_id', outreachId)
            .whereNotNull('qe.created_at'),
          'o.created_at',
          startDate,
          endDate,
        )
          .groupBy('o.recorded_by_id')
          .then((rows) => rows as { doctor_id: string; avg_minutes: string | null }[]),
      ]);

    const transferMap: Record<string, number> = {};
    for (const r of transferRows) transferMap[String(r.doctor_id)] = Number(r.transfer_count);

    const formsMap: Record<string, number> = {};
    for (const r of phq9Rows)
      formsMap[String(r.doctor_id)] = (formsMap[String(r.doctor_id)] ?? 0) + Number(r.count);
    for (const r of gad7Rows)
      formsMap[String(r.doctor_id)] = (formsMap[String(r.doctor_id)] ?? 0) + Number(r.count);
    for (const r of labRows)
      formsMap[String(r.doctor_id)] = (formsMap[String(r.doctor_id)] ?? 0) + Number(r.count);

    const avgTimeMap: Record<string, number> = {};
    for (const r of avgTimeRows) avgTimeMap[String(r.doctor_id)] = Number(r.avg_minutes);

    const doctors = consultationRows.map((r) => {
      const doctorId = String(r.doctor_id);
      const consultationsCount = Number(r.consultations_count);
      const followUpCount = Number(r.follow_up_count);
      const transferCount = transferMap[doctorId] ?? 0;
      return {
        doctorId,
        doctorName: String(r.doctor_name),
        consultationsCount,
        avgConsultationMinutes: avgTimeMap[doctorId] ?? 0,
        followUpRate:
          consultationsCount > 0 ? Math.round((followUpCount / consultationsCount) * 100) : 0,
        transferRate:
          consultationsCount > 0 ? Math.round((transferCount / consultationsCount) * 100) : 0,
        formsCompleted: formsMap[doctorId] ?? 0,
      };
    });

    return { doctors };
  }

  async getPharmacyStats(outreachId: string, startDate?: Date, endDate?: Date) {
    const knex = this.em.getKnex();

    const [totalDispensed, uniquePatientsServed, lowStockItems, outOfStockItems, topMedications] =
      await Promise.all([
        this.applyDateRange(
          knex('prescriptions')
            .where('outreach_id', outreachId)
            .where('status', 'DISPENSED')
            .sum('quantity as total'),
          'created_at',
          startDate,
          endDate,
        )
          .first()
          .then((r) => Number(r?.total ?? 0)),

        this.applyDateRange(
          knex('prescriptions')
            .countDistinct('patient_id as count')
            .where('outreach_id', outreachId)
            .where('status', 'DISPENSED'),
          'created_at',
          startDate,
          endDate,
        )
          .first()
          .then((r) => Number(r?.count ?? 0)),

        knex('pharmacy_stock')
          .select('medication_name', 'quantity_in_stock', 'low_stock_threshold')
          .where('outreach_id', outreachId)
          .where('is_active', true)
          .whereRaw('quantity_in_stock > 0 AND quantity_in_stock <= low_stock_threshold')
          .orderBy('quantity_in_stock', 'asc')
          .then((rows) =>
            rows.map((r) => ({
              medicationName: String(r.medication_name),
              quantityInStock: Number(r.quantity_in_stock),
              threshold: Number(r.low_stock_threshold),
            })),
          ),

        knex('pharmacy_stock')
          .select('medication_name')
          .where('outreach_id', outreachId)
          .where('is_active', true)
          .where('quantity_in_stock', 0)
          .then((rows) => rows.map((r) => ({ medicationName: String(r.medication_name) }))),

        this.applyDateRange(
          knex('prescriptions as p')
            .join('pharmacy_stock as ps', 'ps.id', 'p.pharmacy_stock_id')
            .select('ps.medication_name')
            .sum('p.quantity as total_dispensed')
            .where('p.outreach_id', outreachId)
            .where('p.status', 'DISPENSED'),
          'p.created_at',
          startDate,
          endDate,
        )
          .groupBy('ps.medication_name')
          .orderBy('total_dispensed', 'desc')
          .limit(10)
          .then((rows) =>
            rows.map((r) => ({
              medicationName: String(r.medication_name),
              totalDispensed: Number(r.total_dispensed),
            })),
          ),
      ]);

    return { totalDispensed, uniquePatientsServed, lowStockItems, outOfStockItems, topMedications };
  }

  // ─── Impact (per-outreach) ─────────────────────────────────────────────────

  async getImpactStats(outreachId: string, startDate?: Date, endDate?: Date) {
    const knex = this.em.getKnex();

    const applyDR = (qb: Knex.QueryBuilder, col = 'created_at'): Knex.QueryBuilder => {
      if (startDate) qb.where(col, '>=', startDate);
      if (endDate) qb.where(col, '<', new Date(endDate.getTime() + 86_400_000));
      return qb;
    };

    const patientAgeCase = `
      CASE
        WHEN DATE_PART('year', AGE(date_of_birth)) < 10 THEN '<10'
        WHEN DATE_PART('year', AGE(date_of_birth)) < 20 THEN '10-19'
        WHEN DATE_PART('year', AGE(date_of_birth)) < 30 THEN '20-29'
        WHEN DATE_PART('year', AGE(date_of_birth)) < 40 THEN '30-39'
        WHEN DATE_PART('year', AGE(date_of_birth)) < 50 THEN '40-49'
        WHEN DATE_PART('year', AGE(date_of_birth)) < 60 THEN '50-59'
        ELSE '60+'
      END`;

    const patientAgeCaseJoined = `
      CASE
        WHEN DATE_PART('year', AGE(p.date_of_birth)) < 10 THEN '<10'
        WHEN DATE_PART('year', AGE(p.date_of_birth)) < 20 THEN '10-19'
        WHEN DATE_PART('year', AGE(p.date_of_birth)) < 30 THEN '20-29'
        WHEN DATE_PART('year', AGE(p.date_of_birth)) < 40 THEN '30-39'
        WHEN DATE_PART('year', AGE(p.date_of_birth)) < 50 THEN '40-49'
        WHEN DATE_PART('year', AGE(p.date_of_birth)) < 60 THEN '50-59'
        ELSE '60+'
      END`;


    const [
      outreachRow,
      totalPatients,
      maleCount,
      femaleCount,
      patientsByDay,
      patientsByLocation,
      patientsByGender,
      patientsByAge,
      bmiByAgeGroup,
      diabetesCount,
      hypertensionCount,
      tuberculosisCount,
      malariaCount,
      hivCount,
      topDiagnosesRows,
      avgWaitRow,
      totalObservations,
      distinctDoctorCount,
      topDoctorRows,
      topClerkRows,
      topTeamRows,
      topMedicationRows,
      cancelledRx,
      totalDispensed,
    ] = await Promise.all([
      knex('outreaches').select('name').where('id', outreachId).first(),

      applyDR(knex('patients').where('outreach_id', outreachId).count('* as count'))
        .first()
        .then((r) => Number(r?.count ?? 0)),

      applyDR(
        knex('patients').where('outreach_id', outreachId).where('gender', 'MALE').count('* as count'),
      )
        .first()
        .then((r) => Number(r?.count ?? 0)),

      applyDR(
        knex('patients')
          .where('outreach_id', outreachId)
          .where('gender', 'FEMALE')
          .count('* as count'),
      )
        .first()
        .then((r) => Number(r?.count ?? 0)),

      applyDR(
        knex('patients')
          .select(knex.raw("DATE(created_at) as date"))
          .count('* as count')
          .where('outreach_id', outreachId),
      )
        .groupByRaw('DATE(created_at)')
        .orderByRaw('DATE(created_at) ASC')
        .then((rows) => rows.map((r) => ({ date: String(r.date), count: Number(r.count) }))),

      applyDR(
        knex('patients')
          .select('province', 'district', 'sector', 'cell', 'village')
          .count('* as count')
          .where('outreach_id', outreachId),
      )
        .groupBy('province', 'district', 'sector', 'cell', 'village')
        .orderBy('count', 'desc')
        .limit(20)
        .then((rows) =>
          rows.map((r) => ({
            province: String(r.province),
            district: String(r.district),
            sector: r.sector ? String(r.sector) : null,
            cell: r.cell ? String(r.cell) : null,
            village: String(r.village),
            count: Number(r.count),
          })),
        ),

      applyDR(
        knex('patients').select('gender').count('* as count').where('outreach_id', outreachId),
      )
        .groupBy('gender')
        .then((rows) => rows.map((r) => ({ gender: String(r.gender), count: Number(r.count) }))),

      applyDR(
        knex('patients')
          .select(knex.raw(`${patientAgeCase} AS age_group`))
          .count('* as count')
          .where('outreach_id', outreachId),
      )
        .groupByRaw(patientAgeCase)
        .orderByRaw('MIN(date_of_birth) DESC')
        .then((rows) => rows.map((r) => ({ ageGroup: String(r.age_group), count: Number(r.count) }))),

      applyDR(
        knex('vital_signs as vs')
          .join('patients as p', 'p.id', 'vs.patient_id')
          .select(knex.raw(`${patientAgeCaseJoined} AS age_group`))
          .select(
            knex.raw(`
              SUM(CASE WHEN vs.bmi < 18.5 THEN 1 ELSE 0 END) AS underweight,
              SUM(CASE WHEN vs.bmi >= 18.5 AND vs.bmi < 25 THEN 1 ELSE 0 END) AS normal,
              SUM(CASE WHEN vs.bmi >= 25 AND vs.bmi < 30 THEN 1 ELSE 0 END) AS overweight,
              SUM(CASE WHEN vs.bmi >= 30 THEN 1 ELSE 0 END) AS obese
            `),
          )
          .where('vs.outreach_id', outreachId)
          .whereNotNull('vs.bmi'),
        'vs.created_at',
      )
        .groupByRaw(patientAgeCaseJoined)
        .orderByRaw('MIN(p.date_of_birth) DESC')
        .then((rows) =>
          rows.map((r) => ({
            ageGroup: String(r.age_group),
            underweight: Number(r.underweight),
            normal: Number(r.normal),
            overweight: Number(r.overweight),
            obese: Number(r.obese),
          })),
        ),

      applyDR(
        knex('vital_signs')
          .where('outreach_id', outreachId)
          .whereNotNull('blood_glucose')
          .where('blood_glucose', '>', 11.1)
          .countDistinct('patient_id as count'),
      )
        .first()
        .then((r) => Number(r?.count ?? 0)),

      applyDR(
        knex('vital_signs')
          .where('outreach_id', outreachId)
          .where(function () {
            this.where('blood_pressure_systolic', '>=', 140).orWhere(
              'blood_pressure_diastolic',
              '>=',
              90,
            );
          })
          .countDistinct('patient_id as count'),
      )
        .first()
        .then((r) => Number(r?.count ?? 0)),

      applyDR(
        knex('communicable_diseases')
          .where('outreach_id', outreachId)
          .where('tuberculosis_screen', true)
          .countDistinct('patient_id as count'),
      )
        .first()
        .then((r) => Number(r?.count ?? 0)),

      applyDR(
        knex('communicable_diseases')
          .where('outreach_id', outreachId)
          .where('malaria_screen', true)
          .countDistinct('patient_id as count'),
      )
        .first()
        .then((r) => Number(r?.count ?? 0)),

      applyDR(
        knex('communicable_diseases')
          .where('outreach_id', outreachId)
          .where('hiv_screen', true)
          .countDistinct('patient_id as count'),
      )
        .first()
        .then((r) => Number(r?.count ?? 0)),

      applyDR(
        knex('observations')
          .select('diagnosis')
          .count('* as count')
          .where('outreach_id', outreachId)
          .whereNotNull('diagnosis')
          .whereNot('diagnosis', ''),
      )
        .groupBy('diagnosis')
        .orderBy('count', 'desc')
        .limit(10)
        .then((rows) => rows.map((r) => ({ diagnosis: String(r.diagnosis), count: Number(r.count) }))),

      applyDR(
        knex('queue_entries')
          .where('outreach_id', outreachId)
          .where('status', 'COMPLETED')
          .whereNotNull('completed_at')
          .select(
            knex.raw(
              "ROUND(AVG(EXTRACT(EPOCH FROM (completed_at - created_at)) / 60)) AS avg_minutes",
            ),
          ),
      )
        .first()
        .then((r) => r as unknown as { avg_minutes: string | null } | undefined),

      applyDR(knex('observations').where('outreach_id', outreachId).count('* as count'))
        .first()
        .then((r) => Number(r?.count ?? 0)),

      applyDR(knex('observations').where('outreach_id', outreachId).countDistinct('recorded_by_id as count'))
        .first()
        .then((r) => Number(r?.count ?? 0)),

      applyDR(
        knex('observations as o')
          .join('users as u', 'u.id', 'o.recorded_by_id')
          .select(
            'u.id as doctor_id',
            knex.raw("u.first_name || ' ' || u.last_name AS doctor_name"),
            knex.raw('count(o.id) AS observation_count'),
          )
          .where('o.outreach_id', outreachId),
        'o.created_at',
      )
        .groupBy('u.id', 'u.first_name', 'u.last_name')
        .orderBy('observation_count', 'desc')
        .limit(5)
        .then((rows) =>
          rows.map((r) => ({
            doctorId: String(r.doctor_id),
            doctorName: String(r.doctor_name),
            observationCount: Number(r.observation_count),
          })),
        ),

      applyDR(
        knex('patients as p')
          .join('users as u', 'u.id', 'p.registered_by_id')
          .select(
            'u.id as user_id',
            knex.raw("u.first_name || ' ' || u.last_name AS user_name"),
            knex.raw('count(p.id) AS registration_count'),
          )
          .where('p.outreach_id', outreachId),
      )
        .groupBy('u.id', 'u.first_name', 'u.last_name')
        .orderBy('registration_count', 'desc')
        .limit(5)
        .then((rows) =>
          rows.map((r) => ({
            userId: String(r.user_id),
            userName: String(r.user_name),
            registrationCount: Number(r.registration_count),
          })),
        ),

      knex('teams as t')
        .join('teams_members as tm', 'tm.team_id', 't.id')
        .join('observations as o', function () {
          this.on('o.recorded_by_id', '=', 'tm.user_id').andOn(
            'o.outreach_id',
            '=',
            knex.raw('?', [outreachId]),
          );
        })
        .select('t.id as team_id', 't.name as team_name', knex.raw('count(o.id) AS observation_count'))
        .where('t.outreach_id', outreachId)
        .where('t.is_active', true)
        .modify((qb) => {
          if (startDate) qb.where('o.created_at', '>=', startDate);
          if (endDate)
            qb.where('o.created_at', '<', new Date(endDate.getTime() + 86_400_000));
        })
        .groupBy('t.id', 't.name')
        .orderBy('observation_count', 'desc')
        .limit(5)
        .then((rows) =>
          rows.map((r) => ({
            teamId: String(r.team_id),
            teamName: String(r.team_name),
            observationCount: Number(r.observation_count),
          })),
        ),

      applyDR(
        knex('prescriptions as p')
          .join('pharmacy_stock as ps', 'ps.id', 'p.pharmacy_stock_id')
          .select(
            'ps.id',
            'ps.medication_name',
            'ps.quantity_in_stock',
            'ps.low_stock_threshold',
          )
          .sum('p.quantity as total_dispensed')
          .where('p.outreach_id', outreachId)
          .where('p.status', 'DISPENSED'),
        'p.created_at',
      )
        .groupBy('ps.id', 'ps.medication_name', 'ps.quantity_in_stock', 'ps.low_stock_threshold')
        .orderBy('total_dispensed', 'desc')
        .limit(10)
        .then((rows) =>
          rows.map((r) => {
            const qtyInStock = Number(r.quantity_in_stock);
            const threshold = Number(r.low_stock_threshold);
            const stockStatus: 'adequate' | 'low' | 'out-of-stock' =
              qtyInStock === 0 ? 'out-of-stock' : qtyInStock <= threshold ? 'low' : 'adequate';
            return {
              medicationName: String(r.medication_name),
              totalDispensed: Number(r.total_dispensed),
              quantityInStock: qtyInStock,
              stockStatus,
            };
          }),
        ),

      applyDR(
        knex('prescriptions')
          .where('outreach_id', outreachId)
          .where('status', 'CANCELLED')
          .count('* as count'),
      )
        .first()
        .then((r) => Number(r?.count ?? 0)),

      applyDR(
        knex('prescriptions')
          .where('outreach_id', outreachId)
          .where('status', 'DISPENSED')
          .sum('quantity as total'),
      )
        .first()
        .then((r) => Number(r?.total ?? 0)),
    ]);

    const daysActive = patientsByDay.length;
    const avgPatientsPerDoctor =
      distinctDoctorCount > 0 ? Math.round(totalObservations / distinctDoctorCount) : 0;
    const avgQueueWaitMinutes = Math.round(Number(avgWaitRow?.avg_minutes ?? 0));

    return {
      outreachName: String(outreachRow?.name ?? outreachId),
      dateRange: {
        start: startDate ? startDate.toISOString().split('T')[0] : null,
        end: endDate ? endDate.toISOString().split('T')[0] : null,
      },
      patients: {
        total: totalPatients,
        male: maleCount,
        female: femaleCount,
        daysActive,
        byDay: patientsByDay,
        byLocation: patientsByLocation,
        byGender: patientsByGender,
        byAge: patientsByAge,
      },
      clinical: {
        totalObservations,
        bmiByAgeGroup,
        chronicConditions: {
          diabetes: diabetesCount,
          hypertension: hypertensionCount,
          tuberculosis: tuberculosisCount,
          malaria: malariaCount,
          hiv: hivCount,
        },
        topDiagnoses: topDiagnosesRows,
      },
      service: {
        avgQueueWaitMinutes,
        avgPatientsPerDoctor,
        totalDispensed,
        cancelledPrescriptions: cancelledRx,
        topDoctors: topDoctorRows,
        topDataClerks: topClerkRows,
        topTeams: topTeamRows,
        topMedications: topMedicationRows,
      },
    };
  }

  // ─── Shared helpers ───────────────────────────────────────────────────────

  private applyDateRange(
    qb: Knex.QueryBuilder,
    column: string,
    startDate?: Date,
    endDate?: Date,
  ): Knex.QueryBuilder {
    if (startDate) qb.where(column, '>=', startDate);
    if (endDate) qb.where(column, '<', new Date(endDate.getTime() + 86_400_000));
    return qb;
  }

  private async countPatientsToday(knex: Knex, outreachId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const row = await knex('patients')
      .where('outreach_id', outreachId)
      .where('created_at', '>=', today)
      .count('* as count')
      .first();
    return Number(row?.count ?? 0);
  }

  private async countPatientsOutreach(knex: Knex, outreachId: string): Promise<number> {
    const row = await knex('patients')
      .where('outreach_id', outreachId)
      .count('* as count')
      .first();
    return Number(row?.count ?? 0);
  }

  private async countTransfers(knex: Knex, outreachId: string): Promise<number> {
    const row = await knex('transfers')
      .where('outreach_id', outreachId)
      .count('* as count')
      .first();
    return Number(row?.count ?? 0);
  }

  private async countAbnormalLabs(knex: Knex, outreachId: string): Promise<number> {
    const row = await knex('lab_results')
      .where('outreach_id', outreachId)
      .where('is_abnormal', true)
      .count('* as count')
      .first();
    return Number(row?.count ?? 0);
  }

  private async genderBreakdown(
    knex: Knex,
    outreachId: string,
  ): Promise<{ gender: string; count: number }[]> {
    const rows = await knex('patients')
      .select('gender')
      .count('* as count')
      .where('outreach_id', outreachId)
      .groupBy('gender');
    return rows.map((r) => ({ gender: String(r.gender), count: Number(r.count) }));
  }

  private async ageGroups(
    knex: Knex,
    outreachId: string,
  ): Promise<{ ageGroup: string; count: number }[]> {
    const ageCase = `
      CASE
        WHEN DATE_PART('year', AGE(date_of_birth)) < 18 THEN 'Under 18'
        WHEN DATE_PART('year', AGE(date_of_birth)) BETWEEN 18 AND 35 THEN '18–35'
        WHEN DATE_PART('year', AGE(date_of_birth)) BETWEEN 36 AND 60 THEN '36–60'
        ELSE '60+'
      END`;
    const rows = await knex('patients')
      .select(knex.raw(`${ageCase} AS age_group`))
      .count('* as count')
      .where('outreach_id', outreachId)
      .groupByRaw(ageCase);
    return rows.map((r) => ({ ageGroup: String(r.age_group), count: Number(r.count) }));
  }

  private async topDiagnoses(
    knex: Knex,
    outreachId: string,
  ): Promise<{ diagnosis: string; count: number }[]> {
    const rows = await knex('observations')
      .select('diagnosis')
      .count('* as count')
      .where('outreach_id', outreachId)
      .whereNotNull('diagnosis')
      .whereNot('diagnosis', '')
      .groupBy('diagnosis')
      .orderBy('count', 'desc')
      .limit(10);
    return rows.map((r) => ({ diagnosis: String(r.diagnosis), count: Number(r.count) }));
  }

  private async phq9Distribution(
    knex: Knex,
    outreachId: string,
  ): Promise<{ severity: string; count: number }[]> {
    const rows = await knex('phq9_screenings')
      .select('severity')
      .count('* as count')
      .where('outreach_id', outreachId)
      .groupBy('severity');
    return rows.map((r) => ({ severity: String(r.severity), count: Number(r.count) }));
  }

  private async gad7Distribution(
    knex: Knex,
    outreachId: string,
  ): Promise<{ severity: string; count: number }[]> {
    const rows = await knex('gad7_screenings')
      .select('severity')
      .count('* as count')
      .where('outreach_id', outreachId)
      .groupBy('severity');
    return rows.map((r) => ({ severity: String(r.severity), count: Number(r.count) }));
  }

  private async activeQueueLengths(
    knex: Knex,
    outreachId: string,
  ): Promise<{ stationName: string; count: number }[]> {
    const rows = await knex('queue_entries')
      .join('stations', 'stations.id', 'queue_entries.current_station_id')
      .select('stations.name as station_name')
      .count('* as count')
      .where('queue_entries.outreach_id', outreachId)
      .whereIn('queue_entries.status', ['WAITING', 'IN_SERVICE'])
      .groupBy('stations.id', 'stations.name');
    return rows.map((r) => ({ stationName: String(r.station_name), count: Number(r.count) }));
  }
}

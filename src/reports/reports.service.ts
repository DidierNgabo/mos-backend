import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { stringify } from 'csv-stringify/sync';
import type { TDocumentDefinitions, Content } from 'pdfmake/interfaces';
import { StatsService } from 'src/stats/stats.service';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfMake = require('pdfmake/js/index.js');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const vfsFonts: Record<string, string> = require('pdfmake/build/vfs_fonts');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const virtualFs = require('pdfmake/js/virtual-fs').default;

// Load font files into pdfmake's virtual filesystem once at module load
Object.entries(vfsFonts).forEach(([name, data]) => {
  virtualFs.writeFileSync(name, Buffer.from(data, 'base64'));
});
pdfMake.vfs = vfsFonts;
pdfMake.fonts = {
  Roboto: {
    normal: 'Roboto-Regular.ttf',
    bold: 'Roboto-Medium.ttf',
    italics: 'Roboto-Italic.ttf',
    bolditalics: 'Roboto-MediumItalic.ttf',
  },
};
pdfMake.setUrlAccessPolicy(() => false);
pdfMake.setLocalAccessPolicy(() => false);

const BRAND_BLUE = '#185FA5';
const BRAND_GREEN = '#1D9E75';

const PDF_STYLES: TDocumentDefinitions['styles'] = {
  brand: { fontSize: 10, color: BRAND_BLUE, bold: true, margin: [0, 0, 0, 2] },
  reportTitle: { fontSize: 20, bold: true, margin: [0, 4, 0, 4] },
  meta: { fontSize: 9, color: '#888780', margin: [0, 1, 0, 1] },
  sectionHeader: { fontSize: 12, bold: true, margin: [0, 12, 0, 4] },
  sectionTitle: { fontSize: 13, bold: true, color: BRAND_BLUE, margin: [0, 16, 0, 6] },
  tableHeader: { bold: true, fillColor: BRAND_BLUE, color: '#ffffff', fontSize: 9 },
  statLabel: { fontSize: 9, color: '#888780' },
  statValue: { fontSize: 18, bold: true },
  footer: { fontSize: 8, color: '#888780', italics: true, margin: [0, 20, 0, 0] },
};

function divider(): Content {
  return { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: BRAND_GREEN }], margin: [0, 4, 0, 12] };
}

function sectionDivider(): Content {
  return { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: '#CCCCCC' }], margin: [0, 8, 0, 4] };
}

function statBox(label: string, value: string | number): Content {
  return {
    stack: [
      { text: String(value), style: 'statValue' },
      { text: label, style: 'statLabel' },
    ],
    margin: [0, 0, 16, 0],
  } as Content;
}

function tableHeader(labels: string[]): Content[] {
  return labels.map((l) => ({ text: l, style: 'tableHeader' }));
}

function buildPdf(
  title: string,
  outreachMeta: string,
  content: Content[],
): Promise<Buffer> {
  const docDef: TDocumentDefinitions = {
    content: [
      { text: 'Outreach Medical System', style: 'brand' },
      { text: title, style: 'reportTitle' },
      { text: outreachMeta, style: 'meta' },
      { text: `Generated: ${new Date().toLocaleDateString()}`, style: 'meta' },
      divider(),
      ...content,
      { text: 'Confidential — for internal use only', style: 'footer' } as Content,
    ],
    styles: PDF_STYLES,
    defaultStyle: { font: 'Roboto', fontSize: 10 },
    pageMargins: [40, 40, 40, 40],
  };

  // pdfmake v2 (0.3.x) returns a document with a getBuffer() Promise
  return pdfMake.createPdf(docDef).getBuffer() as Promise<Buffer>;
}

function buildCsv(rows: Record<string, unknown>[], columns: Record<string, string>): Buffer {
  const csv = stringify(rows, { header: true, columns });
  return Buffer.from(csv);
}

@Injectable()
export class ReportsService {
  constructor(
    private readonly statsService: StatsService,
    private readonly em: EntityManager,
  ) {}

  // ─── Summary (PDF only) ────────────────────────────────────────────────────

  async generateSummaryReport(outreachId: string, outreachName: string): Promise<Buffer> {
    const stats = await this.statsService.getAdminStats(outreachId);

    const content: Content[] = [
      {
        columns: [
          statBox('Patients Today', stats.totalPatientsToday),
          statBox('Total Patients', stats.totalPatientsOutreach),
          statBox('Transfers', stats.transfersCount),
          statBox('Abnormal Labs', stats.abnormalLabsCount),
        ],
        margin: [0, 0, 0, 16],
      },
      { text: 'Top Diagnoses', style: 'sectionHeader' },
      {
        table: {
          widths: ['*', 80],
          body: [
            tableHeader(['Diagnosis', 'Count']),
            ...stats.topDiagnoses.map((d) => [d.diagnosis, String(d.count)]),
          ],
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 16],
      } as Content,
      { text: 'Gender Breakdown', style: 'sectionHeader' },
      {
        table: {
          widths: [100, 80],
          body: [
            tableHeader(['Gender', 'Count']),
            ...stats.genderBreakdown.map((g) => [g.gender, String(g.count)]),
          ],
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 16],
      } as Content,
      { text: 'Active Queue by Station', style: 'sectionHeader' },
      {
        table: {
          widths: ['*', 80],
          body: [
            tableHeader(['Station', 'Waiting / In Service']),
            ...stats.activeQueueLengths.map((q) => [q.stationName, String(q.count)]),
          ],
        },
        layout: 'lightHorizontalLines',
      } as Content,
    ];

    return buildPdf('Outreach Summary Report', outreachName, content);
  }

  // ─── Disease (PDF + CSV) ───────────────────────────────────────────────────

  async generateDiseaseReport(
    outreachId: string,
    outreachName: string,
    format: 'pdf' | 'csv',
    startDate?: Date,
    endDate?: Date,
  ): Promise<Buffer> {
    const data = await this.statsService.getDiseaseStats(outreachId, startDate, endDate);

    if (format === 'csv') {
      return buildCsv(
        data.topDiagnoses.map((d) => ({
          diagnosis: d.diagnosis,
          total: d.count,
          percent_of_patients: d.percentOfPatients,
          male: d.maleCount,
          female: d.femaleCount,
        })),
        { diagnosis: 'Diagnosis', total: 'Total', percent_of_patients: '% of Patients', male: 'Male', female: 'Female' },
      );
    }

    const content: Content[] = [
      { columns: [statBox('Total Observations', data.totalObservations)], margin: [0, 0, 0, 16] },
      { text: 'Top Diagnoses', style: 'sectionHeader' },
      {
        table: {
          widths: ['*', 50, 60, 60, 60],
          body: [
            tableHeader(['Diagnosis', 'Count', '% Patients', 'Male', 'Female']),
            ...data.topDiagnoses.map((d) => [d.diagnosis, String(d.count), `${d.percentOfPatients}%`, String(d.maleCount), String(d.femaleCount)]),
          ],
        },
        layout: 'lightHorizontalLines',
      } as Content,
    ];

    return buildPdf('Disease Burden Report', outreachName, content);
  }

  // ─── Mental Health (PDF only) ─────────────────────────────────────────────

  async generateMentalHealthReport(
    outreachId: string,
    outreachName: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<Buffer> {
    const data = await this.statsService.getMentalHealthStats(outreachId, startDate, endDate);

    const content: Content[] = [
      {
        columns: [
          statBox('PHQ-9 Screened', data.phq9.total),
          statBox('GAD-7 Screened', data.gad7.total),
          statBox('% Patients Screened', `${data.percentOfPatientsScreened}%`),
          statBox('Referral Rate (severe)', `${data.phq9.referralRate}%`),
        ],
        margin: [0, 0, 0, 16],
      },
      { text: 'PHQ-9 Severity Distribution', style: 'sectionHeader' },
      {
        table: {
          widths: ['*', 80],
          body: [
            tableHeader(['Severity', 'Count']),
            ['None', String(data.phq9.none)],
            ['Mild', String(data.phq9.mild)],
            ['Moderate', String(data.phq9.moderate)],
            ['Moderately Severe', String(data.phq9.modSevere)],
            ['Severe', String(data.phq9.severe)],
          ],
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 16],
      } as Content,
      { text: 'GAD-7 Severity Distribution', style: 'sectionHeader' },
      {
        table: {
          widths: ['*', 80],
          body: [
            tableHeader(['Severity', 'Count']),
            ['Minimal', String(data.gad7.minimal)],
            ['Mild', String(data.gad7.mild)],
            ['Moderate', String(data.gad7.moderate)],
            ['Severe', String(data.gad7.severe)],
          ],
        },
        layout: 'lightHorizontalLines',
      } as Content,
    ];

    return buildPdf('Mental Health Screening Report', outreachName, content);
  }

  // ─── Labs (PDF + CSV) ─────────────────────────────────────────────────────

  async generateLabsReport(
    outreachId: string,
    outreachName: string,
    format: 'pdf' | 'csv',
    startDate?: Date,
    endDate?: Date,
  ): Promise<Buffer> {
    const data = await this.statsService.getLabStats(outreachId, startDate, endDate);

    if (format === 'csv') {
      return buildCsv(
        data.byTestType.map((r) => ({
          test_type: r.testType,
          total_tests: r.totalTests,
          abnormal_count: r.abnormalCount,
          abnormal_rate: r.abnormalRatePercent,
        })),
        {
          test_type: 'Test Type',
          total_tests: 'Total Tests',
          abnormal_count: 'Abnormal',
          abnormal_rate: 'Abnormal Rate (%)',
        },
      );
    }

    const content: Content[] = [
      {
        columns: [
          statBox('Total Tests', data.totalTests),
          statBox('Abnormal Results', data.totalAbnormal),
          statBox(
            'Overall Abnormal Rate',
            `${data.overallAbnormalRatePercent}%`,
          ),
        ],
        margin: [0, 0, 0, 16],
      },
      { text: 'Results by Test Type', style: 'sectionHeader' },
      {
        table: {
          widths: ['*', 80, 80, 80],
          body: [
            tableHeader(['Test Type', 'Total', 'Abnormal', 'Rate']),
            ...data.byTestType.map((r) => [
              r.testType,
              String(r.totalTests),
              String(r.abnormalCount),
              `${r.abnormalRatePercent}%`,
            ]),
          ],
        },
        layout: 'lightHorizontalLines',
      } as Content,
    ];

    return buildPdf('Lab Results Report', outreachName, content);
  }

  // ─── Doctor Performance (PDF only) ────────────────────────────────────────

  async generateDoctorsReport(
    outreachId: string,
    outreachName: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<Buffer> {
    const data = await this.statsService.getDoctorPerformanceStats(outreachId, startDate, endDate);

    const content: Content[] = [
      { columns: [statBox('Doctors Active', data.doctors.length)], margin: [0, 0, 0, 16] },
      { text: 'Doctor Performance', style: 'sectionHeader' },
      {
        table: {
          widths: ['*', 60, 60, 50, 50, 50],
          body: [
            tableHeader(['Doctor', 'Consultations', 'Avg (min)', 'Follow-up %', 'Transfer %', 'Forms']),
            ...data.doctors.map((d) => [
              d.doctorName,
              String(d.consultationsCount),
              String(d.avgQueueToObservationMinutes),
              `${d.followUpRate}%`,
              `${d.transferRate}%`,
              String(d.formsCompleted),
            ]),
          ],
        },
        layout: 'lightHorizontalLines',
      } as Content,
    ];

    return buildPdf('Doctor Performance Report', outreachName, content);
  }

  // ─── Pharmacy (PDF + CSV) ─────────────────────────────────────────────────

  async generatePharmacyReport(
    outreachId: string,
    outreachName: string,
    format: 'pdf' | 'csv',
    startDate?: Date,
    endDate?: Date,
  ): Promise<Buffer> {
    const data = await this.statsService.getPharmacyStats(outreachId, startDate, endDate);

    if (format === 'csv') {
      return buildCsv(
        data.topMedications.map((m) => ({
          medication: m.medicationName,
          total_dispensed: m.totalDispensed,
        })),
        { medication: 'Medication', total_dispensed: 'Total Dispensed' },
      );
    }

    const content: Content[] = [
      {
        columns: [
          statBox('Total Dispensed', data.totalDispensed),
          statBox('Patients Served', data.uniquePatientsServed),
          statBox('Low Stock Items', data.lowStockItems.length),
          statBox('Out of Stock', data.outOfStockItems.length),
        ],
        margin: [0, 0, 0, 16],
      },
      { text: 'Top Dispensed Medications', style: 'sectionHeader' },
      {
        table: {
          widths: ['*', 100],
          body: [
            tableHeader(['Medication', 'Units Dispensed']),
            ...data.topMedications.map((m) => [m.medicationName, String(m.totalDispensed)]),
          ],
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 16],
      } as Content,
      { text: 'Low Stock Alerts', style: 'sectionHeader' },
      {
        table: {
          widths: ['*', 80, 80],
          body: [
            tableHeader(['Medication', 'In Stock', 'Threshold']),
            ...data.lowStockItems.map((m) => [m.medicationName, String(m.quantityInStock), String(m.threshold)]),
          ],
        },
        layout: 'lightHorizontalLines',
      } as Content,
    ];

    return buildPdf('Pharmacy Dispensing Report', outreachName, content);
  }

  // ─── Transfers (CSV only) ─────────────────────────────────────────────────

  async generateTransfersReport(outreachId: string, startDate?: Date, endDate?: Date): Promise<Buffer> {
    const knex = this.em.getKnex();
    const rows = await knex('transfers as t')
      .join('patients as p', 'p.id', 't.patient_id')
      .join('users as u', 'u.id', 't.initiated_by_id')
      .select(
        knex.raw("p.first_name || ' ' || p.last_name as patient_name"),
        knex.raw("u.first_name || ' ' || u.last_name as initiated_by"),
        't.referred_to_facility',
        't.referred_service',
        't.urgency',
        't.transport_arranged',
        't.transfer_reason',
        't.created_at',
      )
      .where('t.outreach_id', outreachId)
      .modify((qb) => {
        if (startDate) qb.where('t.created_at', '>=', startDate);
        if (endDate) qb.where('t.created_at', '<', new Date(endDate.getTime() + 86_400_000));
      })
      .orderBy('t.created_at', 'asc');

    return buildCsv(
      rows.map((r) => ({
        patient: r.patient_name,
        initiated_by: r.initiated_by,
        facility: r.referred_to_facility,
        service: r.referred_service,
        urgency: r.urgency,
        transport: r.transport_arranged ? 'Yes' : 'No',
        reason: r.transfer_reason,
        date: new Date(r.created_at as string).toLocaleDateString(),
      })),
      {
        patient: 'Patient',
        initiated_by: 'Initiated By',
        facility: 'Referred Facility',
        service: 'Service',
        urgency: 'Urgency',
        transport: 'Transport',
        reason: 'Reason',
        date: 'Date',
      },
    );
  }

  // ─── Vitals (PDF only) ────────────────────────────────────────────────────

  async generateVitalsReport(
    outreachId: string,
    outreachName: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<Buffer> {
    const data = await this.statsService.getVitalsStats(outreachId, startDate, endDate);

    const content: Content[] = [
      {
        columns: [
          statBox('Total Records', data.totalVitalRecords),
          statBox('Hypertension', data.hypertensionCount),
          statBox('HTN Rate', `${data.hypertensionRate}%`),
          statBox('Avg BMI', String(data.avgBmi)),
        ],
        margin: [0, 0, 0, 16],
      },
      { text: 'Risk Indicators', style: 'sectionHeader' },
      {
        table: {
          widths: ['*', 80, 80],
          body: [
            tableHeader(['Indicator', 'Count', 'Threshold']),
            [
              'Overweight (BMI 25–29.9)',
              String(data.overweightCount),
              'BMI 25–29.9',
            ],
            ['Obese (BMI ≥ 30)', String(data.obeseCount), 'BMI ≥ 30'],
            ['High Glucose (> 11.1 mmol/L)', String(data.highGlucoseCount), '> 11.1'],
            ['Low SpO2 (< 95%)', String(data.lowOxygenCount), '< 95%'],
            ['Fever (≥ 37.5°C)', String(data.feverCount), '≥ 37.5°C'],
          ],
        },
        layout: 'lightHorizontalLines',
      } as Content,
    ];

    return buildPdf('Vital Signs & Risk Report', outreachName, content);
  }

  // ─── Impact (per-outreach PDF only) ──────────────────────────────────────

  async generateImpactReport(outreachId: string, startDate?: Date, endDate?: Date): Promise<Buffer> {
    const data = await this.statsService.getImpactStats(outreachId, startDate, endDate);

    const dateRangeLine = data.dateRange.start
      ? `${data.dateRange.start}  →  ${data.dateRange.end ?? 'present'}`
      : 'All dates';

    const pctRow = (total: number, part: number): string =>
      total > 0 ? ` (${Math.round((part / total) * 100)}%)` : '';

    const content: Content[] = [
      // ── Section 1: Patient Reach ────────────────────────────────────────
      { text: 'Section 1 — Patient Reach', style: 'sectionTitle' },
      sectionDivider(),
      {
        columns: [
          statBox('Total Patients', data.patients.total),
          statBox('Male', data.patients.male),
          statBox('Female', data.patients.female),
          statBox('Days Active', data.patients.daysActive),
        ],
        margin: [0, 0, 0, 16],
      },
      { text: 'Attendance by Day', style: 'sectionHeader' },
      data.patients.byDay.length > 0
        ? ({
            table: {
              widths: [120, '*'],
              body: [
                tableHeader(['Date', 'Patients Registered']),
                ...data.patients.byDay.map((d) => [d.date, String(d.count)]),
              ],
            },
            layout: 'lightHorizontalLines',
            margin: [0, 0, 0, 16],
          } as Content)
        : ({ text: 'No attendance data for this period.', style: 'meta', margin: [0, 0, 0, 16] } as Content),
      { text: 'Geographic Distribution (Top 20)', style: 'sectionHeader' },
      data.patients.byLocation.length > 0
        ? ({
            table: {
              widths: [80, 80, 80, 80, 80, 60],
              body: [
                tableHeader(['Province', 'District', 'Sector', 'Cell', 'Village', 'Count']),
                ...data.patients.byLocation.map((l) => [
                  l.province,
                  l.district,
                  l.sector ?? '—',
                  l.cell ?? '—',
                  l.village,
                  String(l.count),
                ]),
              ],
            },
            layout: 'lightHorizontalLines',
            margin: [0, 0, 0, 16],
          } as Content)
        : ({ text: 'No location data.', style: 'meta', margin: [0, 0, 0, 16] } as Content),
      { text: 'Gender Distribution', style: 'sectionHeader' },
      {
        table: {
          widths: [120, 80, 80],
          body: [
            tableHeader(['Gender', 'Count', '%']),
            ...data.patients.byGender.map((g) => [
              g.gender,
              String(g.count),
              `${data.patients.total > 0 ? Math.round((g.count / data.patients.total) * 100) : 0}%`,
            ]),
          ],
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 16],
      } as Content,
      { text: 'Age Distribution', style: 'sectionHeader' },
      data.patients.byAge.length > 0
        ? ({
            table: {
              widths: [120, 80, 80],
              body: [
                tableHeader(['Age Group', 'Count', '%']),
                ...data.patients.byAge.map((a) => [
                  a.ageGroup,
                  String(a.count),
                  `${data.patients.total > 0 ? Math.round((a.count / data.patients.total) * 100) : 0}%`,
                ]),
              ],
            },
            layout: 'lightHorizontalLines',
            margin: [0, 0, 0, 24],
          } as Content)
        : ({ text: 'No age data.', style: 'meta', margin: [0, 0, 0, 24] } as Content),

      // ── Section 2: Clinical Findings ─────────────────────────────────────
      { text: 'Section 2 — Clinical Findings', style: 'sectionTitle' },
      sectionDivider(),
      {
        columns: [
          statBox('Total Observations', data.clinical.totalObservations),
          statBox(
            'Disease Detection',
            `${data.patients.total > 0 ? Math.round((data.clinical.totalObservations / data.patients.total) * 100) : 0}%`,
          ),
        ],
        margin: [0, 0, 0, 16],
      },
      { text: 'BMI Classification by Age Group', style: 'sectionHeader' },
      data.clinical.bmiByAgeGroup.length > 0
        ? ({
            table: {
              widths: ['*', 70, 70, 70, 70],
              body: [
                tableHeader(['Age Group', 'Underweight', 'Normal', 'Overweight', 'Obese']),
                ...data.clinical.bmiByAgeGroup.map((b) => [
                  b.ageGroup,
                  String(b.underweight),
                  String(b.normal),
                  String(b.overweight),
                  String(b.obese),
                ]),
              ],
            },
            layout: 'lightHorizontalLines',
            margin: [0, 0, 0, 16],
          } as Content)
        : ({ text: 'No BMI data for this period.', style: 'meta', margin: [0, 0, 0, 16] } as Content),
      { text: 'Chronic Conditions Detected', style: 'sectionHeader' },
      {
        table: {
          widths: ['*', 100],
          body: [
            tableHeader(['Condition', 'Patients Affected']),
            ['Hypertension (BP ≥ 140/90)', `${data.clinical.chronicConditions.hypertension}${pctRow(data.patients.total, data.clinical.chronicConditions.hypertension)}`],
            ['Diabetes (Glucose > 11.1 mmol/L)', `${data.clinical.chronicConditions.diabetes}${pctRow(data.patients.total, data.clinical.chronicConditions.diabetes)}`],
            ['Tuberculosis (Screen Positive)', `${data.clinical.chronicConditions.tuberculosis}${pctRow(data.patients.total, data.clinical.chronicConditions.tuberculosis)}`],
            ['Malaria (Screen Positive)', `${data.clinical.chronicConditions.malaria}${pctRow(data.patients.total, data.clinical.chronicConditions.malaria)}`],
            ['HIV (Screen Positive)', `${data.clinical.chronicConditions.hiv}${pctRow(data.patients.total, data.clinical.chronicConditions.hiv)}`],
          ],
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 16],
      } as Content,
      { text: 'Top Diagnoses', style: 'sectionHeader' },
      data.clinical.topDiagnoses.length > 0
        ? ({
            table: {
              widths: ['*', 80],
              body: [
                tableHeader(['Diagnosis', 'Count']),
                ...data.clinical.topDiagnoses.map((d) => [d.diagnosis, String(d.count)]),
              ],
            },
            layout: 'lightHorizontalLines',
            margin: [0, 0, 0, 24],
          } as Content)
        : ({ text: 'No diagnoses recorded.', style: 'meta', margin: [0, 0, 0, 24] } as Content),

      // ── Section 3: Service Delivery ──────────────────────────────────────
      { text: 'Section 3 — Service Delivery', style: 'sectionTitle' },
      sectionDivider(),
      {
        columns: [
          statBox('Avg Queue Wait (min)', data.service.avgQueueWaitMinutes),
          statBox('Avg Patients / Doctor', data.service.avgPatientsPerDoctor),
          statBox('Items Dispensed', data.service.totalDispensed),
          statBox('Cancelled Prescriptions', data.service.cancelledPrescriptions),
        ],
        margin: [0, 0, 0, 16],
      },
      { text: 'Top Performing Doctors', style: 'sectionHeader' },
      data.service.topDoctors.length > 0
        ? ({
            table: {
              widths: ['*', 100],
              body: [
                tableHeader(['Doctor', 'Consultations']),
                ...data.service.topDoctors.map((d) => [d.doctorName, String(d.observationCount)]),
              ],
            },
            layout: 'lightHorizontalLines',
            margin: [0, 0, 0, 16],
          } as Content)
        : ({ text: 'No doctor data for this period.', style: 'meta', margin: [0, 0, 0, 16] } as Content),
      { text: 'Top Data Clerks', style: 'sectionHeader' },
      data.service.topDataClerks.length > 0
        ? ({
            table: {
              widths: ['*', 100],
              body: [
                tableHeader(['Clerk', 'Patients Registered']),
                ...data.service.topDataClerks.map((c) => [c.userName, String(c.registrationCount)]),
              ],
            },
            layout: 'lightHorizontalLines',
            margin: [0, 0, 0, 16],
          } as Content)
        : ({ text: 'No clerk data for this period.', style: 'meta', margin: [0, 0, 0, 16] } as Content),
      { text: 'Top Teams', style: 'sectionHeader' },
      data.service.topTeams.length > 0
        ? ({
            table: {
              widths: ['*', 100],
              body: [
                tableHeader(['Team', 'Observations']),
                ...data.service.topTeams.map((t) => [t.teamName, String(t.observationCount)]),
              ],
            },
            layout: 'lightHorizontalLines',
            margin: [0, 0, 0, 16],
          } as Content)
        : ({ text: 'No team activity for this period.', style: 'meta', margin: [0, 0, 0, 16] } as Content),
      { text: 'Medication Dispensing', style: 'sectionHeader' },
      data.service.topMedications.length > 0
        ? ({
            table: {
              widths: ['*', 80, 80, 80],
              body: [
                tableHeader(['Medication', 'Dispensed', 'Stock Left', 'Status']),
                ...data.service.topMedications.map((m) => [
                  m.medicationName,
                  String(m.totalDispensed),
                  String(m.quantityInStock),
                  m.stockStatus === 'out-of-stock' ? 'OUT OF STOCK' : m.stockStatus === 'low' ? 'LOW' : 'Adequate',
                ]),
              ],
            },
            layout: 'lightHorizontalLines',
          } as Content)
        : ({ text: 'No dispensing data for this period.', style: 'meta' } as Content),
    ];

    return buildPdf(
      'Community Impact Report',
      `${data.outreachName}  ·  ${dateRangeLine}`,
      content,
    );
  }
}

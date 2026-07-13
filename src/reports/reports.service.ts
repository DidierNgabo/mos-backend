import { Injectable, NotFoundException } from '@nestjs/common';
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
  sectionTitle: {
    fontSize: 13,
    bold: true,
    color: BRAND_BLUE,
    margin: [0, 16, 0, 6],
  },
  tableHeader: {
    bold: true,
    fillColor: BRAND_BLUE,
    color: '#ffffff',
    fontSize: 9,
  },
  statLabel: { fontSize: 9, color: '#888780' },
  statValue: { fontSize: 18, bold: true },
  footer: {
    fontSize: 8,
    color: '#888780',
    italics: true,
    margin: [0, 20, 0, 0],
  },
};

function divider(): Content {
  return {
    canvas: [
      {
        type: 'line',
        x1: 0,
        y1: 0,
        x2: 515,
        y2: 0,
        lineWidth: 1,
        lineColor: BRAND_GREEN,
      },
    ],
    margin: [0, 4, 0, 12],
  };
}

function sectionDivider(): Content {
  return {
    canvas: [
      {
        type: 'line',
        x1: 0,
        y1: 0,
        x2: 515,
        y2: 0,
        lineWidth: 0.5,
        lineColor: '#CCCCCC',
      },
    ],
    margin: [0, 8, 0, 4],
  };
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
  opts?: { landscape?: boolean },
): Promise<Buffer> {
  const docDef: TDocumentDefinitions = {
    content: [
      { text: 'Outreach Medical System', style: 'brand' },
      { text: title, style: 'reportTitle' },
      { text: outreachMeta, style: 'meta' },
      { text: `Generated: ${new Date().toLocaleDateString()}`, style: 'meta' },
      divider(),
      ...content,
      {
        text: 'Confidential — for internal use only',
        style: 'footer',
      } as Content,
    ],
    styles: PDF_STYLES,
    defaultStyle: { font: 'Roboto', fontSize: opts?.landscape ? 9 : 10 },
    pageMargins: [40, 40, 40, 40],
    ...(opts?.landscape ? { pageOrientation: 'landscape' } : {}),
  };

  // pdfmake v2 (0.3.x) returns a document with a getBuffer() Promise
  return pdfMake.createPdf(docDef).getBuffer() as Promise<Buffer>;
}

function buildCsv(
  rows: Record<string, unknown>[],
  columns: Record<string, string>,
): Buffer {
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

  async generateSummaryReport(
    outreachId: string,
    outreachName: string,
  ): Promise<Buffer> {
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
            ...stats.activeQueueLengths.map((q) => [
              q.stationName,
              String(q.count),
            ]),
          ],
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 16],
      } as Content,
      { text: 'Station Activity (All Time)', style: 'sectionHeader' },
      stats.stationActivity.length > 0
        ? ({
            table: {
              widths: ['*', 80],
              body: [
                tableHeader(['Station', 'Total Visits']),
                ...stats.stationActivity.map((s) => [
                  s.stationName,
                  String(s.visitCount),
                ]),
              ],
            },
            layout: 'lightHorizontalLines',
          } as Content)
        : ({ text: 'No station visits recorded.', style: 'meta' } as Content),
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
    const data = await this.statsService.getDiseaseStats(
      outreachId,
      startDate,
      endDate,
    );

    if (format === 'csv') {
      return buildCsv(
        data.topDiagnoses.map((d) => ({
          diagnosis: d.diagnosis,
          total: d.count,
          percent_of_patients: d.percentOfPatients,
          male: d.maleCount,
          female: d.femaleCount,
        })),
        {
          diagnosis: 'Diagnosis',
          total: 'Total',
          percent_of_patients: '% of Patients',
          male: 'Male',
          female: 'Female',
        },
      );
    }

    const content: Content[] = [
      {
        columns: [statBox('Total Observations', data.totalObservations)],
        margin: [0, 0, 0, 16],
      },
      { text: 'Top Diagnoses', style: 'sectionHeader' },
      {
        table: {
          widths: ['*', 50, 60, 60, 60],
          body: [
            tableHeader(['Diagnosis', 'Count', '% Patients', 'Male', 'Female']),
            ...data.topDiagnoses.map((d) => [
              d.diagnosis,
              String(d.count),
              `${d.percentOfPatients}%`,
              String(d.maleCount),
              String(d.femaleCount),
            ]),
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
    const data = await this.statsService.getMentalHealthStats(
      outreachId,
      startDate,
      endDate,
    );

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
    const data = await this.statsService.getLabStats(
      outreachId,
      startDate,
      endDate,
    );

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
    const data = await this.statsService.getDoctorPerformanceStats(
      outreachId,
      startDate,
      endDate,
    );

    const content: Content[] = [
      {
        columns: [statBox('Doctors Active', data.doctors.length)],
        margin: [0, 0, 0, 16],
      },
      { text: 'Doctor Performance', style: 'sectionHeader' },
      {
        table: {
          widths: ['*', 60, 60, 50, 50, 50],
          body: [
            tableHeader([
              'Doctor',
              'Consultations',
              'Avg (min)',
              'Follow-up %',
              'Transfer %',
              'Forms',
            ]),
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
    const data = await this.statsService.getPharmacyStats(
      outreachId,
      startDate,
      endDate,
    );

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
            ...data.topMedications.map((m) => [
              m.medicationName,
              String(m.totalDispensed),
            ]),
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
            ...data.lowStockItems.map((m) => [
              m.medicationName,
              String(m.quantityInStock),
              String(m.threshold),
            ]),
          ],
        },
        layout: 'lightHorizontalLines',
      } as Content,
    ];

    return buildPdf('Pharmacy Dispensing Report', outreachName, content);
  }

  // ─── Transfers (CSV only) ─────────────────────────────────────────────────

  async generateTransfersReport(
    outreachId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<Buffer> {
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
        if (endDate)
          qb.where(
            't.created_at',
            '<',
            new Date(endDate.getTime() + 86_400_000),
          );
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
    const data = await this.statsService.getVitalsStats(
      outreachId,
      startDate,
      endDate,
    );

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
            [
              'High Glucose (> 11.1 mmol/L)',
              String(data.highGlucoseCount),
              '> 11.1',
            ],
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

  async generateImpactReport(
    outreachId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<Buffer> {
    const data = await this.statsService.getImpactStats(
      outreachId,
      startDate,
      endDate,
    );

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
        : ({
            text: 'No attendance data for this period.',
            style: 'meta',
            margin: [0, 0, 0, 16],
          } as Content),
      { text: 'Geographic Distribution (Top 20)', style: 'sectionHeader' },
      data.patients.byLocation.length > 0
        ? ({
            table: {
              widths: [80, 80, 80, 80, 80, 60],
              body: [
                tableHeader([
                  'Province',
                  'District',
                  'Sector',
                  'Cell',
                  'Village',
                  'Count',
                ]),
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
        : ({
            text: 'No location data.',
            style: 'meta',
            margin: [0, 0, 0, 16],
          } as Content),
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
        : ({
            text: 'No age data.',
            style: 'meta',
            margin: [0, 0, 0, 24],
          } as Content),

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
                tableHeader([
                  'Age Group',
                  'Underweight',
                  'Normal',
                  'Overweight',
                  'Obese',
                ]),
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
        : ({
            text: 'No BMI data for this period.',
            style: 'meta',
            margin: [0, 0, 0, 16],
          } as Content),
      { text: 'Chronic Conditions Detected', style: 'sectionHeader' },
      {
        table: {
          widths: ['*', 100],
          body: [
            tableHeader(['Condition', 'Patients Affected']),
            [
              'Hypertension (BP ≥ 140/90)',
              `${data.clinical.chronicConditions.hypertension}${pctRow(data.patients.total, data.clinical.chronicConditions.hypertension)}`,
            ],
            [
              'Diabetes (Glucose > 11.1 mmol/L)',
              `${data.clinical.chronicConditions.diabetes}${pctRow(data.patients.total, data.clinical.chronicConditions.diabetes)}`,
            ],
            [
              'Tuberculosis (Screen Positive)',
              `${data.clinical.chronicConditions.tuberculosis}${pctRow(data.patients.total, data.clinical.chronicConditions.tuberculosis)}`,
            ],
            [
              'Malaria (Screen Positive)',
              `${data.clinical.chronicConditions.malaria}${pctRow(data.patients.total, data.clinical.chronicConditions.malaria)}`,
            ],
            [
              'HIV (Screen Positive)',
              `${data.clinical.chronicConditions.hiv}${pctRow(data.patients.total, data.clinical.chronicConditions.hiv)}`,
            ],
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
                ...data.clinical.topDiagnoses.map((d) => [
                  d.diagnosis,
                  String(d.count),
                ]),
              ],
            },
            layout: 'lightHorizontalLines',
            margin: [0, 0, 0, 24],
          } as Content)
        : ({
            text: 'No diagnoses recorded.',
            style: 'meta',
            margin: [0, 0, 0, 24],
          } as Content),

      // ── Section 3: Service Delivery ──────────────────────────────────────
      { text: 'Section 3 — Service Delivery', style: 'sectionTitle' },
      sectionDivider(),
      {
        columns: [
          statBox('Avg Queue Wait (min)', data.service.avgQueueWaitMinutes),
          statBox('Avg Patients / Doctor', data.service.avgPatientsPerDoctor),
          statBox('Items Dispensed', data.service.totalDispensed),
          statBox(
            'Cancelled Prescriptions',
            data.service.cancelledPrescriptions,
          ),
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
                ...data.service.topDoctors.map((d) => [
                  d.doctorName,
                  String(d.observationCount),
                ]),
              ],
            },
            layout: 'lightHorizontalLines',
            margin: [0, 0, 0, 16],
          } as Content)
        : ({
            text: 'No doctor data for this period.',
            style: 'meta',
            margin: [0, 0, 0, 16],
          } as Content),
      { text: 'Top Data Clerks', style: 'sectionHeader' },
      data.service.topDataClerks.length > 0
        ? ({
            table: {
              widths: ['*', 100],
              body: [
                tableHeader(['Clerk', 'Patients Registered']),
                ...data.service.topDataClerks.map((c) => [
                  c.userName,
                  String(c.registrationCount),
                ]),
              ],
            },
            layout: 'lightHorizontalLines',
            margin: [0, 0, 0, 16],
          } as Content)
        : ({
            text: 'No clerk data for this period.',
            style: 'meta',
            margin: [0, 0, 0, 16],
          } as Content),
      { text: 'Top Teams', style: 'sectionHeader' },
      data.service.topTeams.length > 0
        ? ({
            table: {
              widths: ['*', 100],
              body: [
                tableHeader(['Team', 'Observations']),
                ...data.service.topTeams.map((t) => [
                  t.teamName,
                  String(t.observationCount),
                ]),
              ],
            },
            layout: 'lightHorizontalLines',
            margin: [0, 0, 0, 16],
          } as Content)
        : ({
            text: 'No team activity for this period.',
            style: 'meta',
            margin: [0, 0, 0, 16],
          } as Content),
      { text: 'Station Activity', style: 'sectionHeader' },
      data.service.stationActivity.length > 0
        ? ({
            table: {
              widths: ['*', 100],
              body: [
                tableHeader(['Station', 'Patients Served']),
                ...data.service.stationActivity.map((s) => [
                  s.stationName,
                  String(s.visitCount),
                ]),
              ],
            },
            layout: 'lightHorizontalLines',
            margin: [0, 0, 0, 16],
          } as Content)
        : ({
            text: 'No station visits recorded for this period.',
            style: 'meta',
            margin: [0, 0, 0, 16],
          } as Content),
      { text: 'Medication Dispensing', style: 'sectionHeader' },
      data.service.topMedications.length > 0
        ? ({
            table: {
              widths: ['*', 80, 80, 80],
              body: [
                tableHeader([
                  'Medication',
                  'Dispensed',
                  'Stock Left',
                  'Status',
                ]),
                ...data.service.topMedications.map((m) => [
                  m.medicationName,
                  String(m.totalDispensed),
                  String(m.quantityInStock),
                  m.stockStatus === 'out-of-stock'
                    ? 'OUT OF STOCK'
                    : m.stockStatus === 'low'
                      ? 'LOW'
                      : 'Adequate',
                ]),
              ],
            },
            layout: 'lightHorizontalLines',
          } as Content)
        : ({
            text: 'No dispensing data for this period.',
            style: 'meta',
          } as Content),
    ];

    return buildPdf(
      'Community Impact Report',
      `${data.outreachName}  ·  ${dateRangeLine}`,
      content,
    );
  }

  // ─── Screenings Export (PDF + CSV) ───────────────────────────────────────

  async generateScreeningsReport(
    outreachId: string,
    outreachName: string,
    format: 'pdf' | 'csv',
    startDate?: Date,
    endDate?: Date,
  ): Promise<Buffer> {
    const knex = this.em.getKnex();

    const applyDates = (qb: ReturnType<typeof knex>, col: string) => {
      if (startDate) qb.where(col, '>=', startDate);
      if (endDate) qb.where(col, '<', new Date(endDate.getTime() + 86_400_000));
    };

    const [phq9, gad7, pcl5] = await Promise.all([
      knex('phq9_screenings as s')
        .join('patients as p', 'p.id', 's.patient_id')
        .where('s.outreach_id', outreachId)
        .modify((qb) => applyDates(qb, 's.created_at'))
        .select(
          knex.raw("p.first_name || ' ' || p.last_name as patient_name"),
          'p.registration_number',
          's.total_score',
          's.severity',
          's.created_at',
        )
        .orderBy('s.created_at', 'asc'),

      knex('gad7_screenings as s')
        .join('patients as p', 'p.id', 's.patient_id')
        .where('s.outreach_id', outreachId)
        .modify((qb) => applyDates(qb, 's.created_at'))
        .select(
          knex.raw("p.first_name || ' ' || p.last_name as patient_name"),
          'p.registration_number',
          's.total_score',
          's.severity',
          's.created_at',
        )
        .orderBy('s.created_at', 'asc'),

      knex('pcl5_screenings as s')
        .join('patients as p', 'p.id', 's.patient_id')
        .where('s.outreach_id', outreachId)
        .modify((qb) => applyDates(qb, 's.created_at'))
        .select(
          knex.raw("p.first_name || ' ' || p.last_name as patient_name"),
          'p.registration_number',
          's.total_score',
          's.severity',
          's.created_at',
        )
        .orderBy('s.created_at', 'asc'),
    ]);

    const fmt = (d: unknown) =>
      d ? new Date(d as string).toLocaleDateString() : '—';
    const str = (v: unknown) => (v != null && v !== '' ? String(v) : '—');

    if (format === 'csv') {
      const rows = [
        ...phq9.map((s) => ({
          type: 'PHQ-9',
          patient_name: s.patient_name,
          patient_reg_no: s.registration_number,
          date: fmt(s.created_at),
          score: s.total_score,
          severity: s.severity,
        })),
        ...gad7.map((s) => ({
          type: 'GAD-7',
          patient_name: s.patient_name,
          patient_reg_no: s.registration_number,
          date: fmt(s.created_at),
          score: s.total_score,
          severity: s.severity,
        })),
        ...pcl5.map((s) => ({
          type: 'PCL-5',
          patient_name: s.patient_name,
          patient_reg_no: s.registration_number,
          date: fmt(s.created_at),
          score: s.total_score,
          severity: s.severity,
        })),
      ];
      return buildCsv(rows, {
        type: 'Screening Type',
        patient_name: 'Patient Name',
        patient_reg_no: 'Reg. No.',
        date: 'Date',
        score: 'Score',
        severity: 'Severity',
      });
    }

    const screeningTable = (
      rows: typeof phq9,
    ): Content =>
      rows.length > 0
        ? ({
            table: {
              widths: [60, '*', 70, 50, '*'],
              body: [
                tableHeader(['Date', 'Patient', 'Reg. No.', 'Score', 'Severity']),
                ...rows.map((s) => [
                  fmt(s.created_at),
                  str(s.patient_name),
                  str(s.registration_number),
                  String(s.total_score),
                  str(s.severity),
                ]),
              ],
            },
            layout: 'lightHorizontalLines',
            margin: [0, 0, 0, 16],
          } as Content)
        : ({
            text: 'No records for this period.',
            style: 'meta',
            margin: [0, 0, 0, 16],
          } as Content);

    const content: Content[] = [
      {
        columns: [
          statBox('PHQ-9 Records', phq9.length),
          statBox('GAD-7 Records', gad7.length),
          statBox('PCL-5 Records', pcl5.length),
          statBox('Total Screenings', phq9.length + gad7.length + pcl5.length),
        ],
        margin: [0, 0, 0, 16],
      },
      { text: 'PHQ-9 Screenings (Depression)', style: 'sectionHeader' },
      screeningTable(phq9),
      { text: 'GAD-7 Screenings (Anxiety)', style: 'sectionHeader' },
      screeningTable(gad7),
      { text: 'PCL-5 Screenings (PTSD)', style: 'sectionHeader' },
      screeningTable(pcl5),
    ];

    return buildPdf('Screenings Export', outreachName, content);
  }

  // ─── Outreach Users (PDF) ─────────────────────────────────────────────────

  async generateOutreachUsersReport(
    outreachId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<Buffer> {
    const knex = this.em.getKnex();

    const applyDates = (qb: ReturnType<typeof knex>, col: string) => {
      if (startDate) qb.where(col, '>=', startDate);
      if (endDate) qb.where(col, '<', new Date(endDate.getTime() + 86_400_000));
    };

    const outreach = await knex('outreaches')
      .where('id', outreachId)
      .select('name')
      .first();

    const users = await knex('outreaches_members as om')
      .join('users as u', 'u.id', 'om.user_id')
      .leftJoin('stations as s', 's.id', 'u.station_id')
      .where('om.outreach_id', outreachId)
      .select(
        'u.id',
        knex.raw("u.first_name || ' ' || u.last_name as full_name"),
        'u.email',
        knex.raw("coalesce(s.name, '—') as station_name"),
      );

    if (users.length === 0) {
      return buildPdf(
        'Outreach Staff Report',
        outreach?.name ?? outreachId,
        [{ text: 'No staff assigned to this outreach.', style: 'meta' } as Content],
      );
    }

    const userIds = users.map((u) => u.id as string);

    const [rolesRows, patientsReg, obsRows, labRows, rxRows] = await Promise.all([
      knex('users_roles as ur')
        .join('roles as r', 'r.id', 'ur.role_id')
        .whereIn('ur.user_id', userIds)
        .select('ur.user_id', 'r.name as role_name'),

      knex('patients')
        .where('outreach_id', outreachId)
        .modify((qb) => applyDates(qb, 'created_at'))
        .whereIn('registered_by_id', userIds)
        .select('registered_by_id')
        .count('id as cnt')
        .groupBy('registered_by_id'),

      knex('observations')
        .where('outreach_id', outreachId)
        .modify((qb) => applyDates(qb, 'created_at'))
        .whereIn('recorded_by_id', userIds)
        .select('recorded_by_id')
        .count('id as cnt')
        .groupBy('recorded_by_id'),

      knex('lab_results')
        .where('outreach_id', outreachId)
        .modify((qb) => applyDates(qb, 'created_at'))
        .whereIn('recorded_by_id', userIds)
        .select('recorded_by_id')
        .count('id as cnt')
        .groupBy('recorded_by_id'),

      knex('prescriptions')
        .where('outreach_id', outreachId)
        .modify((qb) => applyDates(qb, 'created_at'))
        .whereNotNull('dispensed_by_id')
        .whereIn('dispensed_by_id', userIds)
        .select('dispensed_by_id')
        .count('id as cnt')
        .groupBy('dispensed_by_id'),
    ]);

    const rolesMap = new Map<string, string[]>();
    for (const r of rolesRows) {
      const uid = r.user_id as string;
      if (!rolesMap.has(uid)) rolesMap.set(uid, []);
      rolesMap.get(uid)!.push(r.role_name as string);
    }

    const count = (rows: { [key: string]: unknown }[], idKey: string, uid: string) =>
      Number((rows.find((r) => r[idKey] === uid) as { cnt?: unknown } | undefined)?.cnt ?? 0);

    const tableRows = users.map((u) => [
      String(u.full_name),
      String(u.email),
      String(u.station_name),
      (rolesMap.get(u.id as string) ?? []).join(', ') || '—',
      String(count(patientsReg as { [key: string]: unknown }[], 'registered_by_id', u.id as string)),
      String(count(obsRows as { [key: string]: unknown }[], 'recorded_by_id', u.id as string)),
      String(count(labRows as { [key: string]: unknown }[], 'recorded_by_id', u.id as string)),
      String(count(rxRows as { [key: string]: unknown }[], 'dispensed_by_id', u.id as string)),
    ]);

    const content: Content[] = [
      {
        columns: [statBox('Total Staff', users.length)],
        margin: [0, 0, 0, 16],
      },
      { text: 'Staff Activity', style: 'sectionHeader' },
      {
        table: {
          widths: ['*', '*', 70, 70, 45, 45, 35, 45],
          body: [
            tableHeader(['Name', 'Email', 'Station', 'Roles', 'Patients', 'Obs.', 'Labs', 'Dispensed']),
            ...tableRows,
          ],
        },
        layout: 'lightHorizontalLines',
      } as Content,
    ];

    return buildPdf('Outreach Staff Report', outreach?.name ?? outreachId, content);
  }

  // ─── Station Report (PDF + CSV) ───────────────────────────────────────────

  async generateStationReport(
    stationId: string,
    format: 'pdf' | 'csv',
    startDate?: Date,
    endDate?: Date,
  ): Promise<Buffer> {
    const knex = this.em.getKnex();

    const station = await knex('stations as s')
      .join('outreaches as o', 'o.id', 's.outreach_id')
      .where('s.id', stationId)
      .select('s.name as station_name', 's.type', 'o.name as outreach_name')
      .first();

    const visits = await knex('station_visits as sv')
      .join('queue_entries as qe', 'qe.id', 'sv.queue_entry_id')
      .join('patients as p', 'p.id', 'qe.patient_id')
      .where('sv.station_id', stationId)
      .modify((qb) => {
        if (startDate) qb.where('sv.arrived_at', '>=', startDate);
        if (endDate)
          qb.where('sv.arrived_at', '<', new Date(endDate.getTime() + 86_400_000));
      })
      .select(
        knex.raw("p.first_name || ' ' || p.last_name as patient_name"),
        'p.registration_number',
        'qe.priority',
        'sv.arrived_at',
        'sv.departed_at',
        knex.raw(`
          CASE WHEN sv.departed_at IS NOT NULL
          THEN ROUND(EXTRACT(EPOCH FROM (sv.departed_at - sv.arrived_at)) / 60)
          ELSE NULL END as duration_minutes
        `),
        knex.raw(`(SELECT o.diagnosis FROM observations o
                   WHERE o.queue_entry_id = qe.id
                   ORDER BY o.created_at DESC LIMIT 1) AS diagnosis`),
        knex.raw(`(SELECT o.treatment_given FROM observations o
                   WHERE o.queue_entry_id = qe.id
                   ORDER BY o.created_at DESC LIMIT 1) AS treatment_given`),
        knex.raw(`(SELECT t.referred_to_facility FROM transfers t
                   WHERE t.queue_entry_id = qe.id
                   ORDER BY t.created_at DESC LIMIT 1) AS referred_to_facility`),
        knex.raw(`(SELECT t.referred_service FROM transfers t
                   WHERE t.queue_entry_id = qe.id
                   ORDER BY t.created_at DESC LIMIT 1) AS referred_service`),
        knex.raw(`(SELECT t.urgency FROM transfers t
                   WHERE t.queue_entry_id = qe.id
                   ORDER BY t.created_at DESC LIMIT 1) AS transfer_urgency`),
        knex.raw(`(SELECT ph.total_score FROM phq9_screenings ph
                   WHERE ph.queue_entry_id = qe.id ORDER BY ph.created_at DESC LIMIT 1) AS phq9_score`),
        knex.raw(`(SELECT ph.severity FROM phq9_screenings ph
                   WHERE ph.queue_entry_id = qe.id ORDER BY ph.created_at DESC LIMIT 1) AS phq9_severity`),
        knex.raw(`(SELECT g.total_score FROM gad7_screenings g
                   WHERE g.queue_entry_id = qe.id ORDER BY g.created_at DESC LIMIT 1) AS gad7_score`),
        knex.raw(`(SELECT g.severity FROM gad7_screenings g
                   WHERE g.queue_entry_id = qe.id ORDER BY g.created_at DESC LIMIT 1) AS gad7_severity`),
        knex.raw(`(SELECT pc.total_score FROM pcl5_screenings pc
                   WHERE pc.queue_entry_id = qe.id ORDER BY pc.created_at DESC LIMIT 1) AS pcl5_score`),
        knex.raw(`(SELECT pc.severity FROM pcl5_screenings pc
                   WHERE pc.queue_entry_id = qe.id ORDER BY pc.created_at DESC LIMIT 1) AS pcl5_severity`),
      )
      .orderBy('sv.arrived_at', 'asc');

    const fmt = (d: unknown) =>
      d ? new Date(d as string).toLocaleDateString() : '—';
    const fmtTime = (d: unknown) =>
      d ? new Date(d as string).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';
    const str = (v: unknown) => (v != null && v !== '' ? String(v) : '—');

    const stationLabel = station
      ? `${station.station_name as string}  ·  ${station.outreach_name as string}`
      : stationId;

    if (format === 'csv') {
      return buildCsv(
        visits.map((v) => ({
          date: fmt(v.arrived_at),
          patient_name: v.patient_name,
          patient_reg_no: v.registration_number,
          arrived_at: fmtTime(v.arrived_at),
          departed_at: fmtTime(v.departed_at),
          duration_minutes: v.duration_minutes != null ? String(v.duration_minutes) : '',
          priority: v.priority,
          diagnosis: str(v.diagnosis),
          treatment_given: str(v.treatment_given),
          referred_to_facility: str(v.referred_to_facility),
          referred_service: str(v.referred_service),
          transfer_urgency: str(v.transfer_urgency),
          phq9_score: v.phq9_score != null ? String(v.phq9_score) : '',
          phq9_severity: str(v.phq9_severity),
          gad7_score: v.gad7_score != null ? String(v.gad7_score) : '',
          gad7_severity: str(v.gad7_severity),
          pcl5_score: v.pcl5_score != null ? String(v.pcl5_score) : '',
          pcl5_severity: str(v.pcl5_severity),
        })),
        {
          date: 'Date',
          patient_name: 'Patient',
          patient_reg_no: 'Reg. No.',
          arrived_at: 'Arrived',
          departed_at: 'Departed',
          duration_minutes: 'Duration (min)',
          priority: 'Priority',
          diagnosis: 'Diagnosis',
          treatment_given: 'Treatment Given',
          referred_to_facility: 'Referred To (Facility)',
          referred_service: 'Referred Service',
          transfer_urgency: 'Referral Urgency',
          phq9_score: 'PHQ-9 Score',
          phq9_severity: 'PHQ-9 Severity',
          gad7_score: 'GAD-7 Score',
          gad7_severity: 'GAD-7 Severity',
          pcl5_score: 'PCL-5 Score',
          pcl5_severity: 'PCL-5 Severity',
        },
      );
    }

    const completedVisits = visits.filter((v) => v.departed_at != null);
    const avgDuration =
      completedVisits.length > 0
        ? Math.round(
            completedVisits.reduce((sum, v) => sum + Number(v.duration_minutes ?? 0), 0) /
              completedVisits.length,
          )
        : 0;

    const screening = (score: unknown, sev: unknown) =>
      score != null ? `${score} (${String(sev)})` : '—';

    const content: Content[] = [
      {
        columns: [
          statBox('Total Visits', visits.length),
          statBox('Avg Duration (min)', avgDuration),
        ],
        margin: [0, 0, 0, 16],
      },
      { text: 'Patient Visits', style: 'sectionHeader' },
      visits.length > 0
        ? ({
            table: {
              widths: [42, '*', 60, 28, '*', 85, 85, 42, 42, 42, 50],
              body: [
                tableHeader([
                  'Date', 'Patient', 'Reg. No.', 'Min',
                  'Diagnosis', 'Treatment', 'Referred To',
                  'PHQ-9', 'GAD-7', 'PCL-5', 'Priority',
                ]),
                ...visits.map((v) => [
                  fmt(v.arrived_at),
                  str(v.patient_name),
                  str(v.registration_number),
                  v.duration_minutes != null ? String(v.duration_minutes) : '—',
                  str(v.diagnosis),
                  str(v.treatment_given),
                  v.referred_to_facility != null
                    ? `${str(v.referred_to_facility)}${v.referred_service ? ` / ${str(v.referred_service)}` : ''}`
                    : '—',
                  screening(v.phq9_score, v.phq9_severity),
                  screening(v.gad7_score, v.gad7_severity),
                  screening(v.pcl5_score, v.pcl5_severity),
                  str(v.priority),
                ]),
              ],
            },
            layout: 'lightHorizontalLines',
          } as Content)
        : ({
            text: 'No visits recorded for this period.',
            style: 'meta',
          } as Content),
    ];

    return buildPdf(
      `Station Report — ${station?.station_name ?? 'Unknown'}`,
      stationLabel,
      content,
      { landscape: true },
    );
  }

  // ─── Patient History (PDF) ────────────────────────────────────────────────

  async generatePatientHistoryReport(patientId: string): Promise<Buffer> {
    const knex = this.em.getKnex();

    const [
      patient,
      vitalSigns,
      observations,
      labResults,
      prescriptions,
      transfers,
      phq9,
      gad7,
      pcl5,
    ] = await Promise.all([
      knex('patients as p')
        .leftJoin('users as u', 'u.id', 'p.registered_by_id')
        .select(
          'p.id',
          'p.first_name',
          'p.last_name',
          'p.date_of_birth',
          'p.gender',
          'p.registration_number',
          'p.national_id',
          'p.phone_number',
          'p.province',
          'p.district',
          'p.sector',
          'p.cell',
          'p.village',
          knex.raw("u.first_name || ' ' || u.last_name AS registered_by_name"),
        )
        .where('p.id', patientId)
        .first(),

      knex('vital_signs')
        .where('patient_id', patientId)
        .orderBy('created_at', 'asc'),

      knex('observations')
        .where('patient_id', patientId)
        .orderBy('created_at', 'asc'),

      knex('lab_results')
        .where('patient_id', patientId)
        .orderBy('created_at', 'asc'),

      knex('prescriptions as rx')
        .leftJoin('pharmacy_stock as ps', 'ps.id', 'rx.pharmacy_stock_id')
        .select(
          'rx.id',
          'rx.dosage',
          'rx.quantity',
          'rx.status',
          'rx.created_at',
          'rx.custom_medication_name',
          'ps.medication_name as stock_name',
        )
        .where('rx.patient_id', patientId)
        .orderBy('rx.created_at', 'asc'),

      knex('transfers')
        .where('patient_id', patientId)
        .orderBy('created_at', 'asc'),

      knex('phq9_screenings')
        .where('patient_id', patientId)
        .orderBy('created_at', 'asc'),

      knex('gad7_screenings')
        .where('patient_id', patientId)
        .orderBy('created_at', 'asc'),

      knex('pcl5_screenings')
        .where('patient_id', patientId)
        .orderBy('created_at', 'asc'),
    ]);

    if (!patient) throw new NotFoundException('Patient not found');

    const fmt = (d: unknown) =>
      d ? new Date(d as string).toLocaleDateString() : '—';
    const str = (v: unknown) => (v != null && v !== '' ? String(v) : '—');

    const patientName = `${patient.first_name as string} ${patient.last_name as string}`;
    const locationParts = [
      patient.village,
      patient.cell,
      patient.sector,
      patient.district,
      patient.province,
    ].filter(Boolean);

    const content: Content[] = [
      // ── Demographics ──────────────────────────────────────────────────────
      { text: 'Patient Information', style: 'sectionHeader' },
      {
        table: {
          widths: ['*', '*'],
          body: [
            [
              { text: 'Full Name', bold: true },
              patientName,
            ],
            [
              { text: 'Date of Birth', bold: true },
              fmt(patient.date_of_birth),
            ],
            [
              { text: 'Gender', bold: true },
              str(patient.gender),
            ],
            [
              { text: 'Registration No.', bold: true },
              str(patient.registration_number),
            ],
            [
              { text: 'National ID', bold: true },
              str(patient.national_id),
            ],
            [
              { text: 'Phone', bold: true },
              str(patient.phone_number),
            ],
            [
              { text: 'Location', bold: true },
              locationParts.join(', ') || '—',
            ],
          ],
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 16],
      } as Content,

      // ── Vital Signs ───────────────────────────────────────────────────────
      { text: 'Vital Signs', style: 'sectionHeader' },
      vitalSigns.length > 0
        ? ({
            table: {
              widths: [60, 50, 40, 40, 40, 40, 40, 40],
              body: [
                tableHeader([
                  'Date',
                  'BP',
                  'Pulse',
                  'Temp',
                  'Wt (kg)',
                  'Ht (cm)',
                  'BMI',
                  'SpO₂%',
                ]),
                ...vitalSigns.map((v) => [
                  fmt(v.created_at),
                  v.blood_pressure_systolic != null
                    ? `${v.blood_pressure_systolic}/${v.blood_pressure_diastolic}`
                    : '—',
                  str(v.pulse_rate),
                  str(v.temperature),
                  str(v.weight),
                  str(v.height),
                  str(v.bmi),
                  str(v.oxygen_saturation),
                ]),
              ],
            },
            layout: 'lightHorizontalLines',
            margin: [0, 0, 0, 16],
          } as Content)
        : ({
            text: 'No vital signs recorded.',
            style: 'meta',
            margin: [0, 0, 0, 16],
          } as Content),

      // ── Observations / Diagnoses ──────────────────────────────────────────
      { text: 'Observations & Diagnoses', style: 'sectionHeader' },
      observations.length > 0
        ? ({
            table: {
              widths: [60, '*', '*', 80],
              body: [
                tableHeader(['Date', 'Chief Complaint', 'Diagnosis', 'Treatment']),
                ...observations.map((o) => [
                  fmt(o.created_at),
                  str(o.chief_complaint),
                  str(o.diagnosis),
                  str(o.treatment_given),
                ]),
              ],
            },
            layout: 'lightHorizontalLines',
            margin: [0, 0, 0, 16],
          } as Content)
        : ({
            text: 'No observations recorded.',
            style: 'meta',
            margin: [0, 0, 0, 16],
          } as Content),

      // ── Lab Results ───────────────────────────────────────────────────────
      { text: 'Lab Results', style: 'sectionHeader' },
      labResults.length > 0
        ? ({
            table: {
              widths: [60, '*', 80, 60, 50],
              body: [
                tableHeader(['Date', 'Test', 'Result', 'Unit', 'Abnormal']),
                ...labResults.map((l) => [
                  fmt(l.created_at),
                  str(l.test_type),
                  str(l.result_value),
                  str(l.result_unit),
                  l.is_abnormal ? 'YES' : 'No',
                ]),
              ],
            },
            layout: 'lightHorizontalLines',
            margin: [0, 0, 0, 16],
          } as Content)
        : ({
            text: 'No lab results recorded.',
            style: 'meta',
            margin: [0, 0, 0, 16],
          } as Content),

      // ── Prescriptions ─────────────────────────────────────────────────────
      { text: 'Prescriptions', style: 'sectionHeader' },
      prescriptions.length > 0
        ? ({
            table: {
              widths: [60, '*', 80, 50, 70],
              body: [
                tableHeader(['Date', 'Medication', 'Dosage', 'Qty', 'Status']),
                ...prescriptions.map((rx) => [
                  fmt(rx.created_at),
                  str(rx.custom_medication_name ?? rx.stock_name),
                  str(rx.dosage),
                  String(rx.quantity),
                  str(rx.status),
                ]),
              ],
            },
            layout: 'lightHorizontalLines',
            margin: [0, 0, 0, 16],
          } as Content)
        : ({
            text: 'No prescriptions recorded.',
            style: 'meta',
            margin: [0, 0, 0, 16],
          } as Content),

      // ── Transfers / Referrals ─────────────────────────────────────────────
      { text: 'Transfers & Referrals', style: 'sectionHeader' },
      transfers.length > 0
        ? ({
            table: {
              widths: [60, '*', '*', 60],
              body: [
                tableHeader(['Date', 'Facility', 'Service', 'Urgency']),
                ...transfers.map((t) => [
                  fmt(t.created_at),
                  str(t.referred_to_facility),
                  str(t.referred_service),
                  str(t.urgency),
                ]),
              ],
            },
            layout: 'lightHorizontalLines',
            margin: [0, 0, 0, 16],
          } as Content)
        : ({
            text: 'No transfers recorded.',
            style: 'meta',
            margin: [0, 0, 0, 16],
          } as Content),

      // ── PHQ-9 Screenings ──────────────────────────────────────────────────
      { text: 'PHQ-9 Screenings (Depression)', style: 'sectionHeader' },
      phq9.length > 0
        ? ({
            table: {
              widths: [60, 80, '*'],
              body: [
                tableHeader(['Date', 'Score', 'Severity']),
                ...phq9.map((s) => [
                  fmt(s.created_at),
                  String(s.total_score),
                  str(s.severity),
                ]),
              ],
            },
            layout: 'lightHorizontalLines',
            margin: [0, 0, 0, 16],
          } as Content)
        : ({
            text: 'No PHQ-9 screenings recorded.',
            style: 'meta',
            margin: [0, 0, 0, 16],
          } as Content),

      // ── GAD-7 Screenings ──────────────────────────────────────────────────
      { text: 'GAD-7 Screenings (Anxiety)', style: 'sectionHeader' },
      gad7.length > 0
        ? ({
            table: {
              widths: [60, 80, '*'],
              body: [
                tableHeader(['Date', 'Score', 'Severity']),
                ...gad7.map((s) => [
                  fmt(s.created_at),
                  String(s.total_score),
                  str(s.severity),
                ]),
              ],
            },
            layout: 'lightHorizontalLines',
            margin: [0, 0, 0, 16],
          } as Content)
        : ({
            text: 'No GAD-7 screenings recorded.',
            style: 'meta',
            margin: [0, 0, 0, 16],
          } as Content),

      // ── PCL-5 Screenings ──────────────────────────────────────────────────
      { text: 'PCL-5 Screenings (PTSD)', style: 'sectionHeader' },
      pcl5.length > 0
        ? ({
            table: {
              widths: [60, 80, '*'],
              body: [
                tableHeader(['Date', 'Score', 'Severity']),
                ...pcl5.map((s) => [
                  fmt(s.created_at),
                  String(s.total_score),
                  str(s.severity),
                ]),
              ],
            },
            layout: 'lightHorizontalLines',
          } as Content)
        : ({
            text: 'No PCL-5 screenings recorded.',
            style: 'meta',
          } as Content),
    ];

    return buildPdf('Patient Medical History', patientName, content);
  }
}

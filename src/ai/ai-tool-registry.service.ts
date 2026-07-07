import { BadRequestException, Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { StatsService } from 'src/stats/stats.service';
import { AuthorizedAiContext } from './ai-access.service';

interface ToolArguments {
  startDate: string | null;
  endDate: string | null;
}

interface PersonalPharmacyStats {
  unitsDispensedToday: number;
  uniquePatientsServed: number;
  lowStockItems: unknown[];
  outOfStockItems: unknown[];
  topDispensedMedications: Array<{
    medicationName: string;
    totalDispensed: number;
  }>;
  stockConsumptionByDay: Array<{
    date: string;
    totalDispensed: number;
  }>;
}

interface OutreachPharmacyStats {
  totalDispensed: number;
  uniquePatientsServed: number;
  lowStockItems: unknown[];
  outOfStockItems: unknown[];
  topMedications: Array<{
    medicationName: string;
    totalDispensed: number;
  }>;
}

export interface ExecutedTool {
  domain: string;
  data: unknown;
  dateRange: { startDate: string | null; endDate: string | null };
}

interface RegisteredTool {
  definition: OpenAI.Responses.FunctionTool;
  roles: string[];
  domain: string;
  supportsDateRange: boolean;
}

const DATE_PARAMETERS = {
  type: 'object',
  properties: {
    startDate: {
      type: ['string', 'null'],
      description: 'Inclusive ISO date (YYYY-MM-DD), or null when not needed.',
    },
    endDate: {
      type: ['string', 'null'],
      description: 'Inclusive ISO date (YYYY-MM-DD), or null when not needed.',
    },
  },
  required: ['startDate', 'endDate'],
  additionalProperties: false,
};

const CURRENT_SNAPSHOT_PARAMETERS = {
  type: 'object',
  properties: {},
  required: [],
  additionalProperties: false,
};

const ADMIN_ROLES = ['SUPER_ADMIN', 'OUTREACH_ADMIN'];

@Injectable()
export class AiToolRegistryService {
  private readonly registry: RegisteredTool[] = [
    this.tool(
      'get_outreach_overview',
      'Get aggregate patient volume, demographics, diagnoses, mental-health distributions, transfers, abnormal labs, and active queues.',
      [...ADMIN_ROLES, 'DOCTOR', 'NURSE'],
      'overview',
    ),
    this.tool(
      'get_registration_stats',
      'Get patient registration volume, patient demographics, queue enrollment, and priority aggregates. This never counts staff users.',
      [...ADMIN_ROLES, 'DATA_CLERK'],
      'registrations',
    ),
    this.tool(
      'get_workforce_stats',
      'Get the current count of staff users assigned to this outreach, including active status and role, station, and team breakdowns. This never counts patients.',
      ADMIN_ROLES,
      'users',
      false,
    ),
    this.tool(
      'get_queue_flow_stats',
      'Get queue arrivals, statuses, priorities, current station load, turnaround percentiles, and station flow statistics.',
      [
        ...ADMIN_ROLES,
        'DATA_CLERK',
        'NURSE',
        'DOCTOR',
        'PHARMACIST',
        'PSYCHOLOGIST',
      ],
      'queue-flow',
    ),
    this.tool(
      'get_doctor_stats',
      'Get the authenticated doctor’s own aggregate consultations, forms, queues, transfers, diagnoses, and flagged vitals.',
      ['DOCTOR'],
      'doctor-performance',
    ),
    this.tool(
      'get_disease_stats',
      'Get aggregate diagnoses and disease burden for a date range.',
      [...ADMIN_ROLES, 'DOCTOR'],
      'disease',
    ),
    this.tool(
      'get_mental_health_stats',
      'Get aggregate PHQ-9 and GAD-7 screening distributions and referral rates.',
      [...ADMIN_ROLES, 'PSYCHOLOGIST'],
      'mental-health',
    ),
    this.tool(
      'get_pcl5_stats',
      'Get aggregate PCL-5 screening volume, severity, average score, and registered-patient coverage.',
      [...ADMIN_ROLES, 'PSYCHOLOGIST'],
      'pcl5',
    ),
    this.tool(
      'get_communicable_disease_stats',
      'Get aggregate communicable-disease assessment flags for tuberculosis, malaria, HIV, fever, travel, and infected contact.',
      [...ADMIN_ROLES, 'DOCTOR', 'NURSE'],
      'communicable-disease',
    ),
    this.tool(
      'get_lab_stats',
      'Get aggregate lab test volumes and abnormal-result rates.',
      [...ADMIN_ROLES, 'DOCTOR'],
      'labs',
    ),
    this.tool(
      'get_vitals_stats',
      'Get aggregate vital-sign counts and abnormal rates.',
      [...ADMIN_ROLES, 'DOCTOR', 'NURSE'],
      'vitals',
    ),
    this.tool(
      'get_pharmacy_stats',
      'Get aggregate dispensing, stock, and medication usage statistics.',
      [...ADMIN_ROLES, 'PHARMACIST'],
      'pharmacy',
    ),
    this.tool(
      'get_stock_movement_stats',
      'Get pharmacy stock transaction volumes, net quantity changes, current stock risks, and upcoming expiry counts.',
      [...ADMIN_ROLES, 'PHARMACIST'],
      'stock-movement',
    ),
    this.tool(
      'get_transfer_stats',
      'Get aggregate transfer volume, urgency, receiving facilities, referred services, and transport-arrangement rates.',
      [...ADMIN_ROLES, 'DOCTOR'],
      'transfers',
    ),
    this.tool(
      'get_impact_stats',
      'Get the broad aggregate outreach impact report.',
      ADMIN_ROLES,
      'impact',
    ),
    this.tool(
      'get_doctor_performance_stats',
      'Get aggregate staff-level doctor performance metrics.',
      ADMIN_ROLES,
      'doctor-performance',
    ),
    this.tool(
      'get_evangelism_stats',
      'Get aggregate evangelism activity and outcome counts.',
      [...ADMIN_ROLES, 'EVANGELIST'],
      'evangelism',
    ),
    this.tool(
      'get_outreach_portfolio_stats',
      'Compare aggregate workload, staffing, queues, service structure, and stock risks across all outreaches.',
      ['SUPER_ADMIN'],
      'outreach-portfolio',
    ),
  ];

  constructor(private readonly stats: StatsService) {}

  definitionsFor(roles: string[]): OpenAI.Responses.FunctionTool[] {
    return this.registry
      .filter((tool) => tool.roles.some((role) => roles.includes(role)))
      .map((tool) => tool.definition);
  }

  async execute(
    name: string,
    rawArguments: string,
    context: AuthorizedAiContext,
  ): Promise<ExecutedTool> {
    const registered = this.registry.find(
      (tool) => tool.definition.name === name,
    );
    if (
      !registered ||
      !registered.roles.some((role) => context.user.roles.includes(role))
    ) {
      throw new BadRequestException(
        'The requested statistics tool is not available',
      );
    }

    const args = this.parseArguments(rawArguments);
    const startDate = this.parseDate(args.startDate, 'startDate');
    const endDate = this.parseDate(args.endDate, 'endDate');
    if (startDate && endDate && startDate > endDate) {
      throw new BadRequestException(
        'startDate must be before or equal to endDate',
      );
    }

    const { outreachId, user } = context;
    let data: unknown;
    switch (name) {
      case 'get_outreach_overview': {
        const overview = await this.stats.getAdminStats(
          outreachId,
          startDate,
          endDate,
        );
        data = ADMIN_ROLES.some((role) => user.roles.includes(role))
          ? {
              patientsRegisteredTodayCount: overview.totalPatientsToday,
              patientsRegisteredInPeriodCount: overview.totalPatientsOutreach,
              transfersInPeriodCount: overview.transfersCount,
              abnormalLabResultsInPeriodCount: overview.abnormalLabsCount,
              patientGenderBreakdown: overview.genderBreakdown,
              patientAgeBreakdown: overview.ageGroups,
              topDiagnosesInPeriod: overview.topDiagnoses,
              phq9SeverityBreakdown: overview.phq9Distribution,
              gad7SeverityBreakdown: overview.gad7Distribution,
              activeQueueByStationCurrent: overview.activeQueueLengths,
            }
          : {
              patientsRegisteredTodayCount: overview.totalPatientsToday,
              patientsRegisteredInPeriodCount: overview.totalPatientsOutreach,
              activeQueueByStationCurrent: overview.activeQueueLengths,
            };
        break;
      }
      case 'get_registration_stats':
        data = await this.stats.getClerkStats(outreachId, startDate, endDate);
        break;
      case 'get_workforce_stats': {
        const workforce = await this.stats.getUserStats(outreachId);
        data = user.roles.includes('SUPER_ADMIN')
          ? workforce
          : {
              assignedUsersCount: workforce.assignedUsersCount,
              activeAssignedUsersCount: workforce.activeAssignedUsersCount,
              inactiveAssignedUsersCount: workforce.inactiveAssignedUsersCount,
              usersByRole: workforce.usersByRole,
              usersByStation: workforce.usersByStation,
              usersByTeam: workforce.usersByTeam,
            };
        break;
      }
      case 'get_queue_flow_stats':
        data = await this.stats.getQueueFlowStats(
          outreachId,
          startDate,
          endDate,
        );
        break;
      case 'get_doctor_stats':
        data = await this.stats.getDoctorStats(
          user.id,
          outreachId,
          startDate,
          endDate,
        );
        break;
      case 'get_disease_stats':
        data = await this.stats.getDiseaseStats(outreachId, startDate, endDate);
        break;
      case 'get_mental_health_stats':
        data = await this.stats.getMentalHealthStats(
          outreachId,
          startDate,
          endDate,
        );
        break;
      case 'get_pcl5_stats':
        data = await this.stats.getPcl5Stats(outreachId, startDate, endDate);
        break;
      case 'get_communicable_disease_stats':
        data = await this.stats.getCommunicableDiseaseStats(
          outreachId,
          startDate,
          endDate,
        );
        break;
      case 'get_lab_stats':
        data = await this.stats.getLabStats(outreachId, startDate, endDate);
        break;
      case 'get_vitals_stats':
        data = await this.stats.getVitalsStats(outreachId, startDate, endDate);
        break;
      case 'get_pharmacy_stats': {
        if (user.roles.includes('PHARMACIST')) {
          const pharmacy = (await this.stats.getPharmacistStats(
            user.id,
            outreachId,
            startDate,
            endDate,
          )) as unknown as PersonalPharmacyStats;
          data = {
            unitsDispensedToday: pharmacy.unitsDispensedToday,
            uniquePatientsServedInPeriod: pharmacy.uniquePatientsServed,
            lowStockItemsCurrent: pharmacy.lowStockItems,
            outOfStockItemsCurrent: pharmacy.outOfStockItems,
            topDispensedMedicationsInPeriod:
              pharmacy.topDispensedMedications.map((item) => ({
                medicationName: item.medicationName,
                unitsDispensed: item.totalDispensed,
              })),
            unitsDispensedByDay: pharmacy.stockConsumptionByDay.map((item) => ({
              date: item.date,
              unitsDispensed: item.totalDispensed,
            })),
          };
        } else {
          const pharmacy = (await this.stats.getPharmacyStats(
            outreachId,
            startDate,
            endDate,
          )) as unknown as OutreachPharmacyStats;
          data = {
            unitsDispensedInPeriod: pharmacy.totalDispensed,
            uniquePatientsServedInPeriod: pharmacy.uniquePatientsServed,
            lowStockItemsCurrent: pharmacy.lowStockItems,
            outOfStockItemsCurrent: pharmacy.outOfStockItems,
            topMedicationsInPeriod: pharmacy.topMedications.map((item) => ({
              medicationName: item.medicationName,
              unitsDispensed: item.totalDispensed,
            })),
          };
        }
        break;
      }
      case 'get_stock_movement_stats':
        data = await this.stats.getStockMovementStats(
          outreachId,
          startDate,
          endDate,
        );
        break;
      case 'get_transfer_stats':
        data = await this.stats.getTransferStats(
          outreachId,
          startDate,
          endDate,
        );
        break;
      case 'get_impact_stats':
        data = await this.stats.getImpactStats(outreachId, startDate, endDate);
        break;
      case 'get_doctor_performance_stats': {
        const result = await this.stats.getDoctorPerformanceStats(
          outreachId,
          startDate,
          endDate,
        );
        data = {
          doctors: result.doctors.map((doctor) => ({
            doctorName: doctor.doctorName,
            consultationsCount: doctor.consultationsCount,
            avgQueueToObservationMinutes: doctor.avgQueueToObservationMinutes,
            followUpRate: doctor.followUpRate,
            transferRate: doctor.transferRate,
            formsCompleted: doctor.formsCompleted,
          })),
        };
        break;
      }
      case 'get_evangelism_stats':
        data = await this.stats.getEvangelismStats(
          outreachId,
          startDate,
          endDate,
        );
        break;
      case 'get_outreach_portfolio_stats':
        data = await this.stats.getOutreachPortfolioStats(startDate, endDate);
        break;
      default:
        throw new BadRequestException('Unsupported statistics tool');
    }

    const effectiveDateRange = registered.supportsDateRange
      ? { startDate: args.startDate, endDate: args.endDate }
      : { startDate: null, endDate: null };
    const privacyResult = this.suppressSmallPatientCohorts(data);

    return {
      domain: registered.domain,
      data: {
        scope: {
          outreachId,
          outreachName: context.outreachName,
          subject: registered.domain,
          effectiveDateRange,
          generatedAt: new Date().toISOString(),
          notes: this.scopeNotes(name),
          privacy: {
            minimumPatientCohortSize: 5,
            suppressedValuesPresent: privacyResult.suppressed,
          },
        },
        metrics: privacyResult.value,
      },
      dateRange: effectiveDateRange,
    };
  }

  private tool(
    name: string,
    description: string,
    roles: string[],
    domain: string,
    supportsDateRange = true,
  ): RegisteredTool {
    return {
      roles,
      domain,
      supportsDateRange,
      definition: {
        type: 'function',
        name,
        description,
        strict: true,
        parameters: supportsDateRange
          ? DATE_PARAMETERS
          : CURRENT_SNAPSHOT_PARAMETERS,
      },
    };
  }

  private parseArguments(raw: string): ToolArguments {
    try {
      const value = JSON.parse(raw) as Partial<ToolArguments>;
      return {
        startDate: value.startDate ?? null,
        endDate: value.endDate ?? null,
      };
    } catch {
      throw new BadRequestException(
        'The model returned malformed tool arguments',
      );
    }
  }

  private parseDate(value: string | null, field: string): Date | undefined {
    if (value === null) return undefined;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      throw new BadRequestException(`${field} must use YYYY-MM-DD format`);
    }
    const date = new Date(`${value}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(`${field} is not a valid date`);
    }
    return date;
  }

  private scopeNotes(name: string): string[] {
    switch (name) {
      case 'get_outreach_overview':
        return [
          'patientsRegisteredTodayCount uses the current calendar day.',
          'activeQueueByStationCurrent is a current snapshot; other metrics use the effective date range.',
        ];
      case 'get_impact_stats':
        return [
          'Dispensing values are medication units, not prescription counts.',
          'Staff performance breakdowns may overlap when users belong to multiple teams.',
        ];
      case 'get_registration_stats':
        return [
          'Every registration metric counts patients, never staff users.',
          'patientsRegisteredToday uses the current calendar day; period metrics use the effective date range.',
          'patientRegistrationsPerHour uses the current day when no date range is supplied.',
        ];
      case 'get_workforce_stats':
        return [
          'Every metric counts staff users assigned through outreach membership, never patients.',
          'Membership is a current snapshot and has no historical date range.',
          'Role and team breakdowns can overlap because a user may have multiple roles or teams.',
        ];
      case 'get_queue_flow_stats':
        return [
          'currentActiveQueueByStation is a current snapshot; all other flow metrics use the effective date range.',
          'Turnaround measures queue creation to queue completion.',
          'Station service time measures station arrival to departure.',
        ];
      case 'get_pcl5_stats':
        return [
          'Coverage uses patients registered in the effective period as its denominator.',
          'PCL-5 statistics are screening summaries and are not diagnoses.',
        ];
      case 'get_communicable_disease_stats':
        return [
          'The current schema stores boolean assessment flags, not confirmed laboratory diagnoses.',
          'Do not describe flagged counts as confirmed positive cases.',
        ];
      case 'get_doctor_stats':
        return [
          'activeQueuePatientsOutreach is outreach-wide and current, not a doctor-owned queue.',
          'avgQueueToObservationMinutes measures queue creation to observation recording, not consultation duration.',
          'completedEmergencyCasesOutreach is outreach-wide.',
        ];
      case 'get_pharmacy_stats':
        return [
          'Dispensing values are medication units, not prescription counts.',
          'Low-stock and out-of-stock lists are current snapshots.',
          'unitsDispensedByDay covers the last seven days when no date range is supplied.',
        ];
      case 'get_lab_stats':
        return ['Abnormal results are not necessarily positive diagnoses.'];
      case 'get_evangelism_stats':
        return [
          'Outcome categories may overlap and must not be added together as mutually exclusive totals.',
        ];
      case 'get_stock_movement_stats':
        return [
          'Transaction metrics use the effective date range; currentStockSnapshot is current.',
          'netQuantityChange is quantityAfter minus quantityBefore and may be negative.',
        ];
      case 'get_transfer_stats':
        return [
          'The transfer schema does not track downstream completion or receiving-facility outcomes.',
        ];
      case 'get_outreach_portfolio_stats':
        return [
          'Patient and observation activity uses the effective date range.',
          'Staffing, active queues, stations, teams, and stock risk are current snapshots.',
        ];
      default:
        return ['Metrics use the effective date range shown in this scope.'];
    }
  }

  private suppressSmallPatientCohorts(value: unknown): {
    value: unknown;
    suppressed: boolean;
  } {
    if (Array.isArray(value)) {
      let suppressed = false;
      const visible = value.filter((item) => {
        if (!item || typeof item !== 'object') return true;
        const count = (item as Record<string, unknown>).count;
        const keep = typeof count !== 'number' || count === 0 || count >= 5;
        if (!keep) suppressed = true;
        return keep;
      });
      const children = visible.map((item) =>
        this.suppressSmallPatientCohorts(item),
      );
      return {
        value: children.map((child) => child.value),
        suppressed: suppressed || children.some((child) => child.suppressed),
      };
    }
    if (value && typeof value === 'object') {
      const entries = Object.entries(value).map(([key, item]) => {
        const child = this.suppressSmallPatientCohorts(item);
        return { key, child };
      });
      return {
        value: Object.fromEntries(
          entries.map(({ key, child }) => [key, child.value]),
        ),
        suppressed: entries.some(({ child }) => child.suppressed),
      };
    }
    return { value, suppressed: false };
  }
}

import { BadRequestException } from '@nestjs/common';
import { AiToolRegistryService } from './ai-tool-registry.service';

describe('AiToolRegistryService', () => {
  const stats = {
    getAdminStats: jest.fn(),
    getClerkStats: jest.fn(),
    getUserStats: jest.fn(),
    getQueueFlowStats: jest.fn(),
    getPcl5Stats: jest.fn(),
    getCommunicableDiseaseStats: jest.fn(),
    getTransferStats: jest.fn(),
    getStockMovementStats: jest.fn(),
    getOutreachPortfolioStats: jest.fn(),
    getDoctorStats: jest.fn(),
    getDiseaseStats: jest.fn(),
    getMentalHealthStats: jest.fn(),
    getLabStats: jest.fn(),
    getVitalsStats: jest.fn(),
    getPharmacistStats: jest.fn(),
    getPharmacyStats: jest.fn(),
    getImpactStats: jest.fn(),
    getDoctorPerformanceStats: jest.fn(),
    getEvangelismStats: jest.fn(),
  };
  const context = {
    outreachId: 'outreach-1',
    outreachName: 'Kigali Outreach',
    user: {
      id: 'user-1',
      email: 'doctor@example.com',
      roles: ['DOCTOR'],
      mustChangePassword: false,
    },
  };

  beforeEach(() => jest.clearAllMocks());

  it('only advertises tools allowed for the authenticated role', () => {
    const service = new AiToolRegistryService(stats as any);
    const names = service
      .definitionsFor(['PSYCHOLOGIST'])
      .map((tool) => tool.name);
    expect(names).toEqual([
      'get_queue_flow_stats',
      'get_mental_health_stats',
      'get_pcl5_stats',
    ]);
    expect(names).not.toContain('get_doctor_performance_stats');
  });

  it('advertises Priority 1 tools only to their intended roles', () => {
    const service = new AiToolRegistryService(stats as any);
    const namesFor = (roles: string[]) =>
      service.definitionsFor(roles).map((tool) => tool.name);

    expect(namesFor(['PHARMACIST'])).toEqual(
      expect.arrayContaining([
        'get_queue_flow_stats',
        'get_pharmacy_stats',
        'get_stock_movement_stats',
      ]),
    );
    expect(namesFor(['DOCTOR'])).toEqual(
      expect.arrayContaining([
        'get_queue_flow_stats',
        'get_communicable_disease_stats',
        'get_transfer_stats',
      ]),
    );
    expect(namesFor(['SUPER_ADMIN'])).toContain('get_outreach_portfolio_stats');
    expect(namesFor(['OUTREACH_ADMIN'])).not.toContain(
      'get_outreach_portfolio_stats',
    );
  });

  it('wraps queue-flow statistics with the requested date scope', async () => {
    stats.getQueueFlowStats.mockResolvedValue({
      totalEntriesInPeriod: 12,
      entriesByStatus: { completed: 8 },
    });
    const service = new AiToolRegistryService(stats as any);

    const result = await service.execute(
      'get_queue_flow_stats',
      JSON.stringify({ startDate: '2026-06-01', endDate: '2026-06-27' }),
      context,
    );

    expect(result.data).toMatchObject({
      scope: {
        subject: 'queue-flow',
        effectiveDateRange: {
          startDate: '2026-06-01',
          endDate: '2026-06-27',
        },
      },
      metrics: { totalEntriesInPeriod: 12 },
    });
    expect(stats.getQueueFlowStats).toHaveBeenCalledWith(
      context.outreachId,
      expect.any(Date),
      expect.any(Date),
    );
  });

  it('executes an allow-listed aggregate tool with validated dates', async () => {
    stats.getVitalsStats.mockResolvedValue({ totalVitalRecords: 4 });
    const service = new AiToolRegistryService(stats as any);

    await expect(
      service.execute(
        'get_vitals_stats',
        JSON.stringify({ startDate: '2026-06-01', endDate: '2026-06-27' }),
        context,
      ),
    ).resolves.toMatchObject({
      domain: 'vitals',
      data: {
        scope: {
          subject: 'vitals',
          effectiveDateRange: {
            startDate: '2026-06-01',
            endDate: '2026-06-27',
          },
        },
        metrics: { totalVitalRecords: 4 },
      },
    });
    expect(stats.getVitalsStats).toHaveBeenCalledWith(
      context.outreachId,
      expect.any(Date),
      expect.any(Date),
    );
  });

  it('keeps staff-user counts separate from patient registrations', async () => {
    stats.getUserStats.mockResolvedValue({
      assignedUsersCount: 7,
      activeAssignedUsersCount: 6,
      inactiveAssignedUsersCount: 1,
      totalSystemUsersCount: 50,
      usersByRole: [{ role: 'DOCTOR', userCount: 2 }],
      usersByStation: [],
      usersByTeam: [],
    });
    stats.getClerkStats.mockResolvedValue({
      patientsRegisteredToday: 2,
      patientsRegisteredInPeriod: 8,
      patientRegistrationsPerHour: [],
    });
    const service = new AiToolRegistryService(stats as any);
    const adminContext = {
      ...context,
      user: { ...context.user, roles: ['SUPER_ADMIN'] },
    };

    const workforce = await service.execute(
      'get_workforce_stats',
      '{}',
      adminContext,
    );
    const registrations = await service.execute(
      'get_registration_stats',
      JSON.stringify({ startDate: null, endDate: null }),
      adminContext,
    );

    expect(workforce.data).toMatchObject({
      scope: { subject: 'users' },
      metrics: { assignedUsersCount: 7, totalSystemUsersCount: 50 },
    });
    expect(registrations.data).toMatchObject({
      scope: { subject: 'registrations' },
      metrics: { patientsRegisteredInPeriod: 8 },
    });
    expect(JSON.stringify(registrations.data)).not.toContain(
      'assignedUsersCount',
    );
    expect(
      service
        .definitionsFor(['SUPER_ADMIN'])
        .find((tool) => tool.name === 'get_workforce_stats')?.parameters,
    ).toEqual({
      type: 'object',
      properties: {},
      required: [],
      additionalProperties: false,
    });
  });

  it('suppresses patient cohort rows smaller than five', async () => {
    stats.getDiseaseStats.mockResolvedValue({
      topDiagnoses: [
        { diagnosis: 'Rare', count: 1 },
        { diagnosis: 'Common', count: 5 },
      ],
      totalObservations: 6,
    });
    const service = new AiToolRegistryService(stats as any);

    const result = await service.execute(
      'get_disease_stats',
      JSON.stringify({ startDate: null, endDate: null }),
      context,
    );

    expect(JSON.stringify(result.data)).not.toContain('Rare');
    expect(JSON.stringify(result.data)).toContain('Common');
  });

  it('rejects forbidden tools and malformed date ranges', async () => {
    const service = new AiToolRegistryService(stats as any);
    await expect(
      service.execute(
        'get_impact_stats',
        JSON.stringify({ startDate: null, endDate: null }),
        context,
      ),
    ).rejects.toThrow(BadRequestException);
    await expect(
      service.execute(
        'get_vitals_stats',
        JSON.stringify({ startDate: '2026-06-27', endDate: '2026-06-01' }),
        context,
      ),
    ).rejects.toThrow('startDate must be before or equal to endDate');
  });
});

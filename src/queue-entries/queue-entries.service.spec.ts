import { QueueEntriesService } from './queue-entries.service';

describe('QueueEntriesService.findMyQueue', () => {
  const paginated = {
    items: [],
    paginationInfo: { totalNumItems: 0, limit: 50, offset: 0, args: {} },
  };

  function createService({
    user,
    teams = [],
  }: {
    user: Record<string, unknown>;
    teams?: Record<string, unknown>[];
  }) {
    const userRepository = { findOne: jest.fn().mockResolvedValue(user) };
    const teamRepository = { find: jest.fn().mockResolvedValue(teams) };
    const service = new QueueEntriesService(
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      userRepository as never,
      {} as never,
      teamRepository as never,
    );
    jest.spyOn(service, 'findAll').mockResolvedValue(paginated as never);
    return { service, teamRepository };
  }

  it('uses an individual station before team stations', async () => {
    const { service, teamRepository } = createService({
      user: { station: { id: 'station-user', name: 'Personal Station' } },
    });
    const query = { limit: 50, offset: 0 };

    const result = await service.findMyQueue(
      {
        id: 'user-1',
        email: 'psychologist@test.local',
        roles: ['PSYCHOLOGIST'],
        mustChangePassword: false,
      },
      query,
    );

    expect(query).toMatchObject({ currentStationId: 'station-user' });
    expect(teamRepository.find).not.toHaveBeenCalled();
    expect(result.queueScope).toEqual({
      source: 'INDIVIDUAL',
      stations: [{ id: 'station-user', name: 'Personal Station' }],
    });
  });

  it('falls back to all active team stations when no individual station exists', async () => {
    const { service } = createService({
      user: { station: null },
      teams: [
        { station: { id: 'station-team', name: 'General Practice' } },
        { station: { id: 'station-team', name: 'General Practice' } },
        { station: { id: 'station-second', name: 'Mental Health' } },
      ],
    });
    const query = { limit: 50, offset: 0 };

    const result = await service.findMyQueue(
      {
        id: 'user-1',
        email: 'doctor@test.local',
        roles: ['DOCTOR'],
        mustChangePassword: false,
      },
      query,
    );

    expect(query).toMatchObject({
      currentStationIds: ['station-team', 'station-second'],
    });
    expect(result.queueScope).toEqual({
      source: 'TEAM',
      stations: [
        { id: 'station-team', name: 'General Practice' },
        { id: 'station-second', name: 'Mental Health' },
      ],
    });
  });
});

import { TeamsController } from './teams.controller';

describe('TeamsController', () => {
  const service = {
    findAll: jest.fn(),
    find: jest.fn(),
    findVisibleTeams: jest.fn(),
    findVisibleTeam: jest.fn(),
  };
  const controller = new TeamsController(service as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('limits non-admin listings to teams they lead or belong to', () => {
    const query = { outreachId: 'outreach-1' };
    controller.findAll(query, {
      id: 'user-1',
      email: 'doctor@test.local',
      roles: ['DOCTOR'],
      mustChangePassword: false,
    });

    expect(service.findVisibleTeams).toHaveBeenCalledWith(query, 'user-1');
    expect(service.findAll).not.toHaveBeenCalled();
  });

  it('keeps the full team listing available to outreach administrators', () => {
    const query = { outreachId: 'outreach-1' };
    controller.findAll(query, {
      id: 'admin-1',
      email: 'admin@test.local',
      roles: ['OUTREACH_ADMIN'],
      mustChangePassword: false,
    });

    expect(service.findAll).toHaveBeenCalledWith(query);
    expect(service.findVisibleTeams).not.toHaveBeenCalled();
  });
});

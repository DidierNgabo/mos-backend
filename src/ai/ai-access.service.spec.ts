import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { AiAccessService } from './ai-access.service';

describe('AiAccessService', () => {
  const outreach = { id: 'outreach-1', name: 'Kigali Outreach' };
  const user = {
    id: 'user-1',
    email: 'user@example.com',
    roles: ['DOCTOR'],
    mustChangePassword: false,
  };

  it('allows super admins without loading membership', async () => {
    const users = { findOne: jest.fn() };
    const outreaches = { findOne: jest.fn().mockResolvedValue(outreach) };
    const service = new AiAccessService(users as any, outreaches as any);

    await expect(
      service.authorize({ ...user, roles: ['SUPER_ADMIN'] }, outreach.id),
    ).resolves.toMatchObject({
      outreachId: outreach.id,
      outreachName: outreach.name,
    });
    expect(users.findOne).not.toHaveBeenCalled();
  });

  it('allows an assigned user and rejects an unassigned user', async () => {
    const outreaches = { findOne: jest.fn().mockResolvedValue(outreach) };
    const users = {
      findOne: jest
        .fn()
        .mockResolvedValueOnce({
          outreaches: { getItems: () => [{ id: outreach.id }] },
        })
        .mockResolvedValueOnce({ outreaches: { getItems: () => [] } }),
    };
    const service = new AiAccessService(users as any, outreaches as any);

    await expect(service.authorize(user, outreach.id)).resolves.toBeDefined();
    await expect(service.authorize(user, outreach.id)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('rejects an unknown outreach', async () => {
    const service = new AiAccessService(
      { findOne: jest.fn() } as any,
      { findOne: jest.fn().mockResolvedValue(null) } as any,
    );
    await expect(service.authorize(user, outreach.id)).rejects.toThrow(
      NotFoundException,
    );
  });
});

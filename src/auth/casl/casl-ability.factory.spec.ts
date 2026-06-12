import { Action } from './ability.types';
import { CaslAbilityFactory } from './casl-ability.factory';

describe('CaslAbilityFactory mental health access', () => {
  const outreach = { id: 'outreach-1' };
  const userRepository = {
    findOne: jest.fn().mockResolvedValue({
      outreaches: { getItems: () => [outreach] },
    }),
  };
  const factory = new CaslAbilityFactory(userRepository as never);

  it('allows psychologists to manage screenings and read the service queue', async () => {
    const ability = await factory.createForUser({
      id: 'psychologist-1',
      email: 'psychologist@test.local',
      roles: ['PSYCHOLOGIST'],
      mustChangePassword: false,
    });

    expect(ability.rulesFor(Action.Create, 'PHQ9Screening')).not.toHaveLength(
      0,
    );
    expect(ability.rulesFor(Action.Update, 'GAD7Screening')).not.toHaveLength(
      0,
    );
    expect(ability.rulesFor(Action.Delete, 'PCL5Screening')).not.toHaveLength(
      0,
    );
    expect(ability.rulesFor(Action.Read, 'QueueEntry')).not.toHaveLength(0);
  });

  it('does not allow nurses to read mental health screenings', async () => {
    const ability = await factory.createForUser({
      id: 'nurse-1',
      email: 'nurse@test.local',
      roles: ['NURSE'],
      mustChangePassword: false,
    });

    expect(ability.rulesFor(Action.Read, 'PHQ9Screening')).toHaveLength(0);
  });
});

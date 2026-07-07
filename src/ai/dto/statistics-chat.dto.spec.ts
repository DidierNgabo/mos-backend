import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ChatMessageRole, StatisticsChatDto } from './statistics-chat.dto';

describe('StatisticsChatDto', () => {
  const outreachId = '11111111-1111-4111-8111-111111111111';

  it('accepts a valid bounded conversation', async () => {
    const dto = plainToInstance(StatisticsChatDto, {
      outreachId,
      messages: [{ role: ChatMessageRole.USER, content: 'Show today stats' }],
    });
    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('rejects oversized messages and conversations longer than ten turns', async () => {
    const dto = plainToInstance(StatisticsChatDto, {
      outreachId,
      messages: Array.from({ length: 11 }, () => ({
        role: ChatMessageRole.USER,
        content: 'x'.repeat(2001),
      })),
    });
    const errors = await validate(dto);
    expect(errors.some((error) => error.property === 'messages')).toBe(true);
    expect(errors[0].children?.length).toBeGreaterThan(0);
  });
});

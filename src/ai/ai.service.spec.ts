import { AiService } from './ai.service';
import { ChatMessageRole } from './dto/statistics-chat.dto';

describe('AiService', () => {
  it('runs a tool loop, emits SSE-friendly chunks, and logs metadata only', async () => {
    const responses = {
      create: jest
        .fn()
        .mockResolvedValueOnce({
          output: [
            {
              type: 'function_call',
              name: 'get_vitals_stats',
              arguments: '{"startDate":null,"endDate":null}',
              call_id: 'call-1',
            },
            {
              type: 'function_call',
              name: 'get_workforce_stats',
              arguments: '{}',
              call_id: 'call-2',
            },
          ],
          output_text: '',
          usage: { input_tokens: 10, output_tokens: 5 },
        })
        .mockResolvedValueOnce({
          output: [],
          output_text: 'Kigali Outreach has 4 aggregate vital records.',
          usage: { input_tokens: 20, output_tokens: 8 },
        }),
    };
    const access = {
      authorize: jest.fn().mockResolvedValue({
        outreachId: '11111111-1111-4111-8111-111111111111',
        outreachName: 'Kigali Outreach',
        user: {
          id: 'user-1',
          email: 'doctor@example.com',
          roles: ['DOCTOR'],
          mustChangePassword: false,
        },
      }),
    };
    const limiter = { assertAllowed: jest.fn() };
    const tools = {
      definitionsFor: jest.fn().mockReturnValue([
        {
          type: 'function',
          name: 'get_vitals_stats',
          parameters: {},
          strict: true,
        },
      ]),
      execute: jest.fn().mockResolvedValue({
        domain: 'vitals',
        data: { totalVitalRecords: 4 },
        dateRange: { startDate: null, endDate: null },
      }),
    };
    const service = new AiService(access as any, limiter as any, tools as any);
    (service as any).client = { responses };
    const log = jest.fn();
    (service as any).logger = { log, error: jest.fn() };

    const events = [];
    for await (const event of service.chat(
      {
        id: 'user-1',
        email: 'doctor@example.com',
        roles: ['DOCTOR'],
        mustChangePassword: false,
      },
      {
        outreachId: '11111111-1111-4111-8111-111111111111',
        messages: [
          {
            role: ChatMessageRole.USER,
            content: 'secret prompt text',
          },
        ],
      },
    )) {
      events.push(event);
    }

    expect(events.map((event) => event.type)).toEqual([
      'meta',
      'delta',
      'done',
    ]);
    expect(tools.execute).toHaveBeenCalledWith(
      'get_vitals_stats',
      expect.any(String),
      expect.objectContaining({ outreachId: expect.any(String) }),
    );
    expect(tools.execute).toHaveBeenCalledTimes(2);
    expect(responses.create).toHaveBeenCalledWith(
      expect.objectContaining({ parallel_tool_calls: true }),
      expect.any(Object),
    );
    expect(log).toHaveBeenCalled();
    expect(log.mock.calls.flat().join(' ')).not.toContain('secret prompt text');
  });
});

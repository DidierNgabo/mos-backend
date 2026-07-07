import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import OpenAI from 'openai';
import { randomUUID } from 'crypto';
import { AuthenticatedUser } from 'src/auth/auth.types';
import {
  OPENAI_API_KEY,
  OPENAI_MODEL,
  OPENAI_REQUEST_TIMEOUT_MS,
} from 'src/config/config';
import { AiAccessService } from './ai-access.service';
import { AiRateLimitService } from './ai-rate-limit.service';
import { AiToolRegistryService } from './ai-tool-registry.service';
import { StatisticsChatDto } from './dto/statistics-chat.dto';

export type AiStreamEvent =
  | { type: 'meta'; data: { requestId: string; outreachId: string } }
  | { type: 'delta'; data: { text: string } }
  | {
      type: 'done';
      data: {
        domains: string[];
        dateRange: { startDate: string | null; endDate: string | null } | null;
        generatedAt: string;
      };
    };

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly client: OpenAI | null;

  constructor(
    private readonly access: AiAccessService,
    private readonly limiter: AiRateLimitService,
    private readonly tools: AiToolRegistryService,
  ) {
    this.client = OPENAI_API_KEY
      ? new OpenAI({
          apiKey: OPENAI_API_KEY,
          timeout: OPENAI_REQUEST_TIMEOUT_MS,
          maxRetries: 1,
        })
      : null;
  }

  async *chat(
    user: AuthenticatedUser,
    dto: StatisticsChatDto,
    signal?: AbortSignal,
  ): AsyncGenerator<AiStreamEvent> {
    if (!this.client) {
      throw new ServiceUnavailableException('The AI service is not configured');
    }

    this.limiter.assertAllowed(user.id);
    const context = await this.access.authorize(user, dto.outreachId);
    const definitions = this.tools.definitionsFor(user.roles);
    if (definitions.length === 0) {
      throw new ServiceUnavailableException(
        'No statistics are available for your role',
      );
    }

    const requestId = randomUUID();
    const startedAt = Date.now();
    const domains = new Set<string>();
    let lastDateRange: {
      startDate: string | null;
      endDate: string | null;
    } | null = null;
    let input: OpenAI.Responses.ResponseInput = dto.messages.map((message) => ({
      role: message.role,
      content: message.content,
    }));
    let inputTokens = 0;
    let outputTokens = 0;

    yield {
      type: 'meta',
      data: { requestId, outreachId: dto.outreachId },
    };

    try {
      let finalText = '';
      for (let round = 0; round < 3; round += 1) {
        const response = await this.client.responses.create(
          {
            model: OPENAI_MODEL,
            store: false,
            instructions: this.instructions(context.outreachName, user.roles),
            input,
            include: ['reasoning.encrypted_content'],
            tools: definitions,
            tool_choice: round === 0 ? 'required' : 'auto',
            parallel_tool_calls: true,
            max_output_tokens: 1200,
          },
          { signal },
        );

        inputTokens += response.usage?.input_tokens ?? 0;
        outputTokens += response.usage?.output_tokens ?? 0;
        const calls = response.output.filter(
          (item): item is OpenAI.Responses.ResponseFunctionToolCall =>
            item.type === 'function_call',
        );

        if (calls.length === 0) {
          finalText = response.output_text;
          break;
        }

        const outputs: OpenAI.Responses.ResponseInputItem.FunctionCallOutput[] =
          [];
        for (const call of calls) {
          const result = await this.tools.execute(
            call.name,
            call.arguments,
            context,
          );
          domains.add(result.domain);
          lastDateRange = result.dateRange;
          outputs.push({
            type: 'function_call_output',
            call_id: call.call_id,
            output: JSON.stringify(result.data),
          });
        }
        input = [
          ...input,
          ...(response.output as unknown as OpenAI.Responses.ResponseInputItem[]),
          ...outputs,
        ];

        if (round === 2) {
          const finalResponse = await this.client.responses.create(
            {
              model: OPENAI_MODEL,
              store: false,
              instructions: this.instructions(context.outreachName, user.roles),
              input,
              include: ['reasoning.encrypted_content'],
              tools: definitions,
              tool_choice: 'none',
              max_output_tokens: 1200,
            },
            { signal },
          );
          inputTokens += finalResponse.usage?.input_tokens ?? 0;
          outputTokens += finalResponse.usage?.output_tokens ?? 0;
          finalText = finalResponse.output_text;
        }
      }

      if (!finalText.trim()) {
        finalText =
          'I could not produce a statistics answer from the available aggregate data.';
      }

      for (const text of this.chunk(finalText)) {
        if (signal?.aborted) return;
        yield { type: 'delta', data: { text } };
      }

      yield {
        type: 'done',
        data: {
          domains: [...domains],
          dateRange: lastDateRange,
          generatedAt: new Date().toISOString(),
        },
      };

      this.logger.log(
        JSON.stringify({
          requestId,
          userId: user.id,
          domains: [...domains],
          durationMs: Date.now() - startedAt,
          inputTokens,
          outputTokens,
          status: 'completed',
        }),
      );
    } catch (error) {
      const failureCategory =
        error instanceof Error ? error.constructor.name : 'UnknownError';
      this.logger.error(
        JSON.stringify({
          requestId,
          userId: user.id,
          domains: [...domains],
          durationMs: Date.now() - startedAt,
          inputTokens,
          outputTokens,
          status: 'failed',
          failureCategory,
        }),
      );
      throw error;
    }
  }

  private instructions(outreachName: string, roles: string[]): string {
    return [
      'You are MOS Statistics Assistant, a concise read-only analytics assistant.',
      `The active outreach is "${outreachName}" and the user's roles are ${roles.join(', ')}.`,
      'For every factual statistics answer, call one or more available tools and use only their outputs.',
      'Treat patients and staff users as different entities. Never use a patient registration metric to answer a staff-user question.',
      'Read each tool scope, effectiveDateRange, metric name, unit, and note literally; do not rename a metric into a different concept.',
      'Never request, infer, or reveal patient names, registration numbers, contact details, or individual records.',
      'Refuse requests for identifiable patient information and refuse requests to modify data.',
      'Do not provide diagnosis, treatment, or medical advice.',
      'State the outreach and applicable date range. Treat a numeric zero as zero; say unavailable only when the tool did not provide the metric.',
      'Do not claim access to tools, tables, or facts that were not provided.',
      'If the requested metric is absent or a small cohort was suppressed, say it is unavailable rather than estimating it.',
      'Use short Markdown paragraphs and lists. Do not output raw HTML.',
    ].join('\n');
  }

  private chunk(value: string): string[] {
    return value.match(/[\s\S]{1,80}/g) ?? [];
  }
}

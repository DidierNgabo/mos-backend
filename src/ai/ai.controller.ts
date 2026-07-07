import { Body, Controller, HttpException, Post, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { AuthenticatedUser } from 'src/auth/auth.types';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { AiService, AiStreamEvent } from './ai.service';
import { StatisticsChatDto } from './dto/statistics-chat.dto';

@ApiTags('ai')
@ApiBearerAuth()
@Controller('ai')
export class AiController {
  constructor(private readonly ai: AiService) {}

  @Post('statistics-chat')
  @ApiOperation({ summary: 'Stream a role-scoped aggregate statistics answer' })
  async statisticsChat(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: StatisticsChatDto,
    @Res() response: Response,
  ): Promise<void> {
    response.set({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    response.flushHeaders();

    const controller = new AbortController();
    let closed = false;
    response.on('close', () => {
      closed = true;
      controller.abort();
    });

    try {
      for await (const event of this.ai.chat(user, dto, controller.signal)) {
        if (closed) break;
        this.writeEvent(response, event);
      }
    } catch (error) {
      if (!closed) {
        const message =
          error instanceof HttpException
            ? error.message
            : 'The statistics assistant is temporarily unavailable';
        this.writeEvent(response, {
          type: 'error',
          data: { message },
        });
      }
    } finally {
      if (!closed) response.end();
    }
  }

  private writeEvent(
    response: Response,
    event: AiStreamEvent | { type: 'error'; data: { message: string } },
  ): void {
    response.write(`event: ${event.type}\n`);
    response.write(`data: ${JSON.stringify(event.data)}\n\n`);
  }
}

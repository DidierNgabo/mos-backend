import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Public } from 'src/auth/decorators/public.decorator';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { AuthenticatedUser } from 'src/auth/auth.types';
import { Action } from 'src/auth/casl/ability.types';
import { CheckPolicies } from 'src/auth/casl/check-policies.decorator';
import { CreateQueueEntryDto } from './dto/create-queue-entry.dto';
import { MoveQueueEntryDto } from './dto/move-queue-entry.dto';
import { PublicQueueQueryDto } from './dto/public-queue-query.dto';
import { QueueEntryQueryDto } from './dto/query-queue-entry.dto';
import { UpdateQueueEntryDto } from './dto/update-queue-entry.dto';
import { UpdateQueueStatusDto } from './dto/update-queue-status.dto';
import { QueueEntriesService } from './queue-entries.service';

@ApiBearerAuth()
@Controller('queue-entries')
export class QueueEntriesController {
  constructor(private readonly queueEntriesService: QueueEntriesService) {}

  @Post()
  @CheckPolicies((ability) => ability.rulesFor(Action.Create, 'QueueEntry').some((r) => !r.inverted))
  create(@Body() dto: CreateQueueEntryDto) {
    return this.queueEntriesService.create(dto);
  }

  @Get()
  @CheckPolicies((ability) => ability.rulesFor(Action.Read, 'QueueEntry').some((r) => !r.inverted))
  findAll(@Query() query: QueueEntryQueryDto) {
    return this.queueEntriesService.findAll(query);
  }

  @Public()
  @Get('public')
  @ApiOperation({ summary: 'Public read-only queue display — no authentication required' })
  findPublic(@Query() query: PublicQueueQueryDto) {
    return this.queueEntriesService.findPublic(query);
  }

  @Get('my-queue')
  @CheckPolicies((ability) => ability.rulesFor(Action.Read, 'QueueEntry').some((r) => !r.inverted))
  getMyQueue(
    @Query() query: QueueEntryQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.queueEntriesService.findMyQueue(user, query);
  }

  @Get(':id')
  @CheckPolicies((ability) => ability.rulesFor(Action.Read, 'QueueEntry').some((r) => !r.inverted))
  findOne(@Param('id') id: string) {
    return this.queueEntriesService.find(id);
  }

  @Get(':id/chart')
  @CheckPolicies((ability) => ability.rulesFor(Action.Read, 'QueueEntry').some((r) => !r.inverted))
  findChart(@Param('id') id: string) {
    return this.queueEntriesService.findChart(id);
  }

  @Patch(':id')
  @CheckPolicies((ability) => ability.rulesFor(Action.Update, 'QueueEntry').some((r) => !r.inverted))
  update(@Param('id') id: string, @Body() dto: UpdateQueueEntryDto) {
    return this.queueEntriesService.update(id, dto);
  }

  @Delete(':id')
  @CheckPolicies((ability) => ability.can(Action.Delete, 'QueueEntry'))
  remove(@Param('id') id: string) {
    return this.queueEntriesService.remove(id);
  }

  @Patch(':id/move')
  @CheckPolicies((ability) => ability.rulesFor(Action.Update, 'QueueEntry').some((r) => !r.inverted))
  move(
    @Param('id') id: string,
    @Body() dto: MoveQueueEntryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.queueEntriesService.moveToStation(id, dto, user);
  }

  @Patch(':id/status')
  @CheckPolicies((ability) => ability.rulesFor(Action.Update, 'QueueEntry').some((r) => !r.inverted))
  updateStatus(@Param('id') id: string, @Body() dto: UpdateQueueStatusDto) {
    return this.queueEntriesService.updateStatus(id, dto);
  }
}

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation } from '@nestjs/swagger';
import { Action } from 'src/auth/casl/ability.types';
import { CheckPolicies } from 'src/auth/casl/check-policies.decorator';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { CreateOutreachDto } from './dto/create-outreach.dto';
import { OutreachQueryDto } from './dto/query-outreach.dto';
import { UpdateOutreachDto } from './dto/update-outreach.dto';
import { OutreachesService } from './outreaches.service';

@ApiBearerAuth()
@Controller('outreaches')
export class OutreachesController {
  constructor(private readonly outreachesService: OutreachesService) {}

  @Post()
  @CheckPolicies((ability) => ability.can(Action.Create, 'Outreach'))
  @ApiOperation({
    summary: 'Create a new outreach — createdBy is set to the authenticated user',
  })
  create(
    @Body() dto: CreateOutreachDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.outreachesService.createOutreach(dto, userId);
  }

  @Get()
  @CheckPolicies((ability) => ability.rulesFor(Action.Read, 'Outreach').some((r) => !r.inverted))
  @ApiOperation({ summary: 'List outreaches with filtering and pagination' })
  findAll(@Query() query: OutreachQueryDto) {
    return this.outreachesService.findAll(query);
  }

  @Get(':id')
  @CheckPolicies((ability) => ability.rulesFor(Action.Read, 'Outreach').some((r) => !r.inverted))
  @ApiOperation({ summary: 'Get a single outreach by ID' })
  findOne(@Param('id') id: string) {
    return this.outreachesService.find(id);
  }

  @Patch(':id')
  @CheckPolicies((ability) => ability.can(Action.Update, 'Outreach'))
  @ApiOperation({
    summary: 'Update outreach details (including reassigning members via memberIds)',
  })
  update(@Param('id') id: string, @Body() dto: UpdateOutreachDto) {
    return this.outreachesService.update(id, dto);
  }

  @Delete(':id')
  @CheckPolicies((ability) => ability.can(Action.Delete, 'Outreach'))
  @ApiOperation({ summary: 'Delete an outreach' })
  remove(@Param('id') id: string) {
    return this.outreachesService.remove(id);
  }

  @Post(':id/members')
  @CheckPolicies((ability) => ability.can(Action.Update, 'Outreach'))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add users to an outreach' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userIds: { type: 'array', items: { type: 'string', format: 'uuid' } },
      },
      required: ['userIds'],
    },
  })
  addMembers(
    @Param('id') id: string,
    @Body('userIds') userIds: string[],
  ) {
    return this.outreachesService.addMembers(id, userIds);
  }

  @Delete(':id/members')
  @CheckPolicies((ability) => ability.can(Action.Update, 'Outreach'))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove users from an outreach' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userIds: { type: 'array', items: { type: 'string', format: 'uuid' } },
      },
      required: ['userIds'],
    },
  })
  removeMembers(
    @Param('id') id: string,
    @Body('userIds') userIds: string[],
  ) {
    return this.outreachesService.removeMembers(id, userIds);
  }
}

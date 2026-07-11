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
import { Public } from 'src/auth/decorators/public.decorator';
import { Action } from 'src/auth/casl/ability.types';
import { CheckPolicies } from 'src/auth/casl/check-policies.decorator';
import { CreateStationDto } from './dto/create-station.dto';
import { StationQueryDto } from './dto/query-station.dto';
import { UpdateStationDto } from './dto/update-station.dto';
import { StationsService } from './stations.service';

@ApiBearerAuth()
@Controller('stations')
export class StationsController {
  constructor(private readonly stationsService: StationsService) {}

  @Post()
  @CheckPolicies((ability) => ability.can(Action.Create, 'Station'))
  @ApiOperation({ summary: 'Create a new station for an outreach' })
  create(@Body() dto: CreateStationDto) {
    return this.stationsService.create(dto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'List stations with filtering and pagination' })
  findAll(@Query() query: StationQueryDto) {
    return this.stationsService.findAll(query);
  }

  @Get(':id')
  @CheckPolicies((ability) => ability.can(Action.Read, 'Station'))
  @ApiOperation({ summary: 'Get a single station by ID' })
  findOne(@Param('id') id: string) {
    return this.stationsService.find(id);
  }

  @Patch(':id')
  @CheckPolicies((ability) => ability.can(Action.Update, 'Station'))
  @ApiOperation({ summary: 'Update station details' })
  update(@Param('id') id: string, @Body() dto: UpdateStationDto) {
    return this.stationsService.update(id, dto);
  }

  @Delete(':id')
  @CheckPolicies((ability) => ability.can(Action.Delete, 'Station'))
  @ApiOperation({ summary: 'Delete a station' })
  remove(@Param('id') id: string) {
    return this.stationsService.remove(id);
  }

  @Post(':id/users')
  @CheckPolicies((ability) => ability.can(Action.Update, 'Station'))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Assign clinical users to a station' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userIds: { type: 'array', items: { type: 'string', format: 'uuid' } },
      },
      required: ['userIds'],
    },
  })
  assignUsers(
    @Param('id') id: string,
    @Body('userIds') userIds: string[],
  ) {
    return this.stationsService.assignUsers(id, userIds);
  }

  @Delete(':id/users')
  @CheckPolicies((ability) => ability.can(Action.Update, 'Station'))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove users from a station' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userIds: { type: 'array', items: { type: 'string', format: 'uuid' } },
      },
      required: ['userIds'],
    },
  })
  unassignUsers(
    @Param('id') id: string,
    @Body('userIds') userIds: string[],
  ) {
    return this.stationsService.unassignUsers(id, userIds);
  }
}

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { AuthenticatedUser } from 'src/auth/auth.types';
import { Action } from 'src/auth/casl/ability.types';
import { CheckPolicies } from 'src/auth/casl/check-policies.decorator';
import { CreateObservationDto } from './dto/create-observation.dto';
import { DiagnosisSearchQueryDto } from './dto/diagnosis-search-query.dto';
import { ObservationQueryDto } from './dto/query-observation.dto';
import { UpdateObservationDto } from './dto/update-observation.dto';
import { ObservationsService } from './observations.service';

@ApiBearerAuth()
@Controller('observations')
export class ObservationsController {
  constructor(private readonly observationsService: ObservationsService) {}

  @Get('diagnoses/search')
  @CheckPolicies((ability) =>
    ability.rulesFor(Action.Read, 'Observation').some((r) => !r.inverted),
  )
  searchDiagnoses(@Query() query: DiagnosisSearchQueryDto) {
    return this.observationsService.searchDiagnoses(query.query, query.limit);
  }

  @Post()
  @CheckPolicies((ability) =>
    ability.rulesFor(Action.Create, 'Observation').some((r) => !r.inverted),
  )
  create(
    @Body() dto: CreateObservationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.observationsService.createObservation(dto, user.id);
  }

  @Get()
  @CheckPolicies((ability) =>
    ability.rulesFor(Action.Read, 'Observation').some((r) => !r.inverted),
  )
  findAll(@Query() query: ObservationQueryDto) {
    return this.observationsService.findAll(query);
  }

  @Get(':id')
  @CheckPolicies((ability) =>
    ability.rulesFor(Action.Read, 'Observation').some((r) => !r.inverted),
  )
  findOne(@Param('id') id: string) {
    return this.observationsService.find(id);
  }

  @Patch(':id')
  @CheckPolicies((ability) =>
    ability.rulesFor(Action.Update, 'Observation').some((r) => !r.inverted),
  )
  update(@Param('id') id: string, @Body() dto: UpdateObservationDto) {
    return this.observationsService.update(id, dto);
  }

  @Delete(':id')
  @CheckPolicies((ability) => ability.can(Action.Delete, 'Observation'))
  remove(@Param('id') id: string) {
    return this.observationsService.remove(id);
  }
}

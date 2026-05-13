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
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AppAbility } from 'src/auth/casl/ability.types';
import { Action } from 'src/auth/casl/ability.types';
import { CheckPolicies } from 'src/auth/casl/check-policies.decorator';
import { CurrentAbility } from 'src/auth/decorators/current-ability.decorator';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { CreatePatientDto } from './dto/create-patient.dto';
import { PatientQueryDto } from './dto/query-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { PatientsService } from './patients.service';

@ApiBearerAuth()
@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post()
  @CheckPolicies((ability) => ability.rulesFor(Action.Create, 'Patient').some((r) => !r.inverted))
  @ApiOperation({
    summary:
      'Register a new patient — registeredBy is set to the authenticated user',
  })
  create(
    @Body() dto: CreatePatientDto,
    @CurrentUser('id') userId: string,
    @CurrentAbility() ability: AppAbility,
  ) {
    return this.patientsService.createPatient(dto, userId, ability);
  }

  @Get()
  @CheckPolicies((ability) => ability.rulesFor(Action.Read, 'Patient').some((r) => !r.inverted))
  @ApiOperation({ summary: 'List patients with filtering and pagination' })
  findAll(@Query() query: PatientQueryDto) {
    return this.patientsService.findAll(query);
  }

  @Get(':id')
  @CheckPolicies((ability) => ability.rulesFor(Action.Read, 'Patient').some((r) => !r.inverted))
  @ApiOperation({ summary: 'Get a single patient by ID' })
  findOne(@Param('id') id: string) {
    return this.patientsService.find(id);
  }

  @Patch(':id')
  @CheckPolicies((ability) => ability.rulesFor(Action.Update, 'Patient').some((r) => !r.inverted))
  @ApiOperation({ summary: 'Update patient details' })
  update(@Param('id') id: string, @Body() dto: UpdatePatientDto) {
    return this.patientsService.update(id, dto);
  }

  @Delete(':id')
  @CheckPolicies((ability) => ability.rulesFor(Action.Delete, 'Patient').some((r) => !r.inverted))
  @ApiOperation({ summary: 'Delete a patient record' })
  remove(@Param('id') id: string) {
    return this.patientsService.remove(id);
  }
}

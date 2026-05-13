import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { AuthenticatedUser } from 'src/auth/auth.types';
import { Action } from 'src/auth/casl/ability.types';
import { CheckPolicies } from 'src/auth/casl/check-policies.decorator';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { PrescriptionQueryDto } from './dto/query-prescription.dto';
import { PrescriptionsService } from './prescriptions.service';

@ApiBearerAuth()
@Controller('prescriptions')
export class PrescriptionsController {
  constructor(private readonly prescriptionsService: PrescriptionsService) {}

  @Post()
  @CheckPolicies((ability) => ability.rulesFor(Action.Create, 'Prescription').some((r) => !r.inverted))
  create(@Body() dto: CreatePrescriptionDto, @CurrentUser() user: AuthenticatedUser) {
    return this.prescriptionsService.createPrescription(dto, user.id);
  }

  @Get()
  @CheckPolicies((ability) => ability.rulesFor(Action.Read, 'Prescription').some((r) => !r.inverted))
  findAll(@Query() query: PrescriptionQueryDto) {
    return this.prescriptionsService.findAll(query);
  }

  @Get(':id')
  @CheckPolicies((ability) => ability.rulesFor(Action.Read, 'Prescription').some((r) => !r.inverted))
  findOne(@Param('id') id: string) {
    return this.prescriptionsService.find(id);
  }

  @Patch(':id/dispense')
  @CheckPolicies((ability) => ability.rulesFor(Action.Update, 'Prescription').some((r) => !r.inverted))
  dispense(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.prescriptionsService.dispense(id, user.id);
  }

  @Patch(':id/cancel')
  @CheckPolicies((ability) => ability.rulesFor(Action.Update, 'Prescription').some((r) => !r.inverted))
  cancel(@Param('id') id: string) {
    return this.prescriptionsService.cancel(id);
  }

  @Delete(':id')
  @CheckPolicies((ability) => ability.can(Action.Delete, 'Prescription'))
  remove(@Param('id') id: string) {
    return this.prescriptionsService.remove(id);
  }
}

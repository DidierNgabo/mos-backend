import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { AuthenticatedUser } from 'src/auth/auth.types';
import { Action } from 'src/auth/casl/ability.types';
import { CheckPolicies } from 'src/auth/casl/check-policies.decorator';
import { BulkCreateLabResultDto } from './dto/bulk-create-lab-result.dto';
import { CreateLabResultDto } from './dto/create-lab-result.dto';
import { LabResultQueryDto } from './dto/query-lab-result.dto';
import { UpdateLabResultDto } from './dto/update-lab-result.dto';
import { LabResultsService } from './lab-results.service';

@ApiBearerAuth()
@Controller('lab-results')
export class LabResultsController {
  constructor(private readonly labResultsService: LabResultsService) {}

  @Post()
  @CheckPolicies((ability) => ability.rulesFor(Action.Create, 'LabResult').some((r) => !r.inverted))
  create(@Body() dto: CreateLabResultDto, @CurrentUser() user: AuthenticatedUser) {
    return this.labResultsService.createLabResult(dto, user.id);
  }

  @Post('bulk')
  @CheckPolicies((ability) => ability.rulesFor(Action.Create, 'LabResult').some((r) => !r.inverted))
  createBulk(@Body() dto: BulkCreateLabResultDto, @CurrentUser() user: AuthenticatedUser) {
    return this.labResultsService.createManyLabResults(dto, user.id);
  }

  @Get()
  @CheckPolicies((ability) => ability.rulesFor(Action.Read, 'LabResult').some((r) => !r.inverted))
  findAll(@Query() query: LabResultQueryDto) {
    return this.labResultsService.findAll(query);
  }

  @Get(':id')
  @CheckPolicies((ability) => ability.rulesFor(Action.Read, 'LabResult').some((r) => !r.inverted))
  findOne(@Param('id') id: string) {
    return this.labResultsService.find(id);
  }

  @Patch(':id')
  @CheckPolicies((ability) => ability.rulesFor(Action.Update, 'LabResult').some((r) => !r.inverted))
  update(@Param('id') id: string, @Body() dto: UpdateLabResultDto) {
    return this.labResultsService.update(id, dto);
  }

  @Delete(':id')
  @CheckPolicies((ability) => ability.can(Action.Delete, 'LabResult'))
  remove(@Param('id') id: string) {
    return this.labResultsService.remove(id);
  }
}

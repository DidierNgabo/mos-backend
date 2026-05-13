import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { AuthenticatedUser } from 'src/auth/auth.types';
import { Action } from 'src/auth/casl/ability.types';
import { CheckPolicies } from 'src/auth/casl/check-policies.decorator';
import { CreateCommunicableDiseaseDto } from './dto/create-communicable-disease.dto';
import { CommunicableDiseaseQueryDto } from './dto/query-communicable-disease.dto';
import { UpdateCommunicableDiseaseDto } from './dto/update-communicable-disease.dto';
import { CommunicableDiseasesService } from './communicable-diseases.service';

@ApiBearerAuth()
@Controller('communicable-diseases')
export class CommunicableDiseasesController {
  constructor(private readonly communicableDiseasesService: CommunicableDiseasesService) {}

  @Post()
  @CheckPolicies((ability) => ability.rulesFor(Action.Create, 'CommunicableDisease').some((r) => !r.inverted))
  create(@Body() dto: CreateCommunicableDiseaseDto, @CurrentUser() user: AuthenticatedUser) {
    return this.communicableDiseasesService.createScreening(dto, user.id);
  }

  @Get()
  @CheckPolicies((ability) => ability.rulesFor(Action.Read, 'CommunicableDisease').some((r) => !r.inverted))
  findAll(@Query() query: CommunicableDiseaseQueryDto) {
    return this.communicableDiseasesService.findAll(query);
  }

  @Get(':id')
  @CheckPolicies((ability) => ability.rulesFor(Action.Read, 'CommunicableDisease').some((r) => !r.inverted))
  findOne(@Param('id') id: string) {
    return this.communicableDiseasesService.find(id);
  }

  @Patch(':id')
  @CheckPolicies((ability) => ability.rulesFor(Action.Update, 'CommunicableDisease').some((r) => !r.inverted))
  update(@Param('id') id: string, @Body() dto: UpdateCommunicableDiseaseDto) {
    return this.communicableDiseasesService.update(id, dto);
  }

  @Delete(':id')
  @CheckPolicies((ability) => ability.can(Action.Delete, 'CommunicableDisease'))
  remove(@Param('id') id: string) {
    return this.communicableDiseasesService.remove(id);
  }
}

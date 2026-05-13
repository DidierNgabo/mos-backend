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
import { AppAbility, Action } from 'src/auth/casl/ability.types';
import { CheckPolicies } from 'src/auth/casl/check-policies.decorator';
import { CurrentAbility } from 'src/auth/decorators/current-ability.decorator';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { CreateVitalSignDto } from './dto/create-vital-sign.dto';
import { VitalSignQueryDto } from './dto/query-vital-sign.dto';
import { UpdateVitalSignDto } from './dto/update-vital-sign.dto';
import { VitalSignsService } from './vital-signs.service';

@ApiBearerAuth()
@Controller('vital-signs')
export class VitalSignsController {
  constructor(private readonly vitalSignsService: VitalSignsService) {}

  @Post()
  @CheckPolicies((ability) => ability.rulesFor(Action.Create, 'VitalSign').some((r) => !r.inverted))
  @ApiOperation({
    summary: 'Record vital signs for a patient — recordedBy is set to the authenticated user',
  })
  create(
    @Body() dto: CreateVitalSignDto,
    @CurrentUser('id') userId: string,
    @CurrentAbility() ability: AppAbility,
  ) {
    return this.vitalSignsService.createVitalSign(dto, userId, ability);
  }

  @Get()
  @CheckPolicies((ability) => ability.rulesFor(Action.Read, 'VitalSign').some((r) => !r.inverted))
  @ApiOperation({ summary: 'List vital signs with filtering and pagination' })
  findAll(@Query() query: VitalSignQueryDto) {
    return this.vitalSignsService.findAll(query);
  }

  @Get(':id')
  @CheckPolicies((ability) => ability.rulesFor(Action.Read, 'VitalSign').some((r) => !r.inverted))
  @ApiOperation({ summary: 'Get a single vital sign record by ID' })
  findOne(@Param('id') id: string) {
    return this.vitalSignsService.find(id);
  }

  @Patch(':id')
  @CheckPolicies((ability) => ability.rulesFor(Action.Update, 'VitalSign').some((r) => !r.inverted))
  @ApiOperation({ summary: 'Update a vital sign record' })
  update(@Param('id') id: string, @Body() dto: UpdateVitalSignDto) {
    return this.vitalSignsService.update(id, dto);
  }

  @Delete(':id')
  @CheckPolicies((ability) => ability.rulesFor(Action.Delete, 'VitalSign').some((r) => !r.inverted))
  @ApiOperation({ summary: 'Delete a vital sign record' })
  remove(@Param('id') id: string) {
    return this.vitalSignsService.remove(id);
  }
}

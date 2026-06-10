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
import { AuthenticatedUser } from 'src/auth/auth.types';
import { Action } from 'src/auth/casl/ability.types';
import { CheckPolicies } from 'src/auth/casl/check-policies.decorator';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { CreateEvangelismRecordDto } from './dto/create-evangelism-record.dto';
import { EvangelismRecordQueryDto } from './dto/query-evangelism-record.dto';
import { UpdateEvangelismRecordDto } from './dto/update-evangelism-record.dto';
import { EvangelismService } from './evangelism.service';

@ApiBearerAuth()
@Controller('evangelism-records')
export class EvangelismController {
  constructor(private readonly evangelismService: EvangelismService) {}

  @Post()
  @CheckPolicies((ability) =>
    ability.rulesFor(Action.Create, 'EvangelismRecord').some((r) => !r.inverted),
  )
  create(
    @Body() dto: CreateEvangelismRecordDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.evangelismService.createRecord(dto, user.id);
  }

  @Get()
  @CheckPolicies((ability) =>
    ability.rulesFor(Action.Read, 'EvangelismRecord').some((r) => !r.inverted),
  )
  findAll(@Query() query: EvangelismRecordQueryDto) {
    return this.evangelismService.findAll(query);
  }

  @Get(':id')
  @CheckPolicies((ability) =>
    ability.rulesFor(Action.Read, 'EvangelismRecord').some((r) => !r.inverted),
  )
  findOne(@Param('id') id: string) {
    return this.evangelismService.find(id);
  }

  @Patch(':id')
  @CheckPolicies((ability) =>
    ability.rulesFor(Action.Update, 'EvangelismRecord').some((r) => !r.inverted),
  )
  update(@Param('id') id: string, @Body() dto: UpdateEvangelismRecordDto) {
    return this.evangelismService.update(id, dto);
  }

  @Delete(':id')
  @CheckPolicies((ability) => ability.can(Action.Delete, 'EvangelismRecord'))
  remove(@Param('id') id: string) {
    return this.evangelismService.remove(id);
  }
}

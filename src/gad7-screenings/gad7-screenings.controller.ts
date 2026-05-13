import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuthenticatedUser } from 'src/auth/auth.types';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Action } from 'src/auth/casl/ability.types';
import { CheckPolicies } from 'src/auth/casl/check-policies.decorator';
import { CreateGAD7ScreeningDto } from './dto/create-gad7-screening.dto';
import { GAD7ScreeningQueryDto } from './dto/query-gad7-screening.dto';
import { UpdateGAD7ScreeningDto } from './dto/update-gad7-screening.dto';
import { GAD7ScreeningsService } from './gad7-screenings.service';

@ApiBearerAuth()
@Controller('gad7-screenings')
export class GAD7ScreeningsController {
  constructor(private readonly gad7ScreeningsService: GAD7ScreeningsService) {}

  @Post()
  @CheckPolicies((ability) => ability.rulesFor(Action.Create, 'GAD7Screening').some((r) => !r.inverted))
  create(@Body() dto: CreateGAD7ScreeningDto, @CurrentUser() user: AuthenticatedUser) {
    return this.gad7ScreeningsService.createScreening(dto, user.id);
  }

  @Get()
  @CheckPolicies((ability) => ability.rulesFor(Action.Read, 'GAD7Screening').some((r) => !r.inverted))
  findAll(@Query() query: GAD7ScreeningQueryDto) {
    return this.gad7ScreeningsService.findAll(query);
  }

  @Get(':id')
  @CheckPolicies((ability) => ability.rulesFor(Action.Read, 'GAD7Screening').some((r) => !r.inverted))
  findOne(@Param('id') id: string) {
    return this.gad7ScreeningsService.find(id);
  }

  @Patch(':id')
  @CheckPolicies((ability) => ability.rulesFor(Action.Update, 'GAD7Screening').some((r) => !r.inverted))
  update(@Param('id') id: string, @Body() dto: UpdateGAD7ScreeningDto) {
    return this.gad7ScreeningsService.updateScreening(id, dto);
  }

  @Delete(':id')
  @CheckPolicies((ability) => ability.can(Action.Delete, 'GAD7Screening'))
  remove(@Param('id') id: string) {
    return this.gad7ScreeningsService.remove(id);
  }
}

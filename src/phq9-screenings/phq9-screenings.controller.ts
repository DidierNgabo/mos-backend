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
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Action } from 'src/auth/casl/ability.types';
import { CheckPolicies } from 'src/auth/casl/check-policies.decorator';
import { CreatePHQ9ScreeningDto } from './dto/create-phq9-screening.dto';
import { MentalHealthSessionQueryDto } from './dto/query-mental-health-session.dto';
import { PHQ9ScreeningQueryDto } from './dto/query-phq9-screening.dto';
import { UpdatePHQ9ScreeningDto } from './dto/update-phq9-screening.dto';
import { PHQ9ScreeningsService } from './phq9-screenings.service';

@ApiBearerAuth()
@Controller('phq9-screenings')
export class PHQ9ScreeningsController {
  constructor(private readonly phq9ScreeningsService: PHQ9ScreeningsService) {}

  @Post()
  @CheckPolicies((ability) =>
    ability.rulesFor(Action.Create, 'PHQ9Screening').some((r) => !r.inverted),
  )
  create(
    @Body() dto: CreatePHQ9ScreeningDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.phq9ScreeningsService.createScreening(dto, user.id);
  }

  @Get()
  @CheckPolicies((ability) =>
    ability.rulesFor(Action.Read, 'PHQ9Screening').some((r) => !r.inverted),
  )
  findAll(@Query() query: PHQ9ScreeningQueryDto) {
    return this.phq9ScreeningsService.findAll(query);
  }

  @Get('sessions')
  @CheckPolicies((ability) =>
    ability.rulesFor(Action.Read, 'PHQ9Screening').some((r) => !r.inverted),
  )
  findSessions(
    @Query() query: MentalHealthSessionQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.phq9ScreeningsService.findSessions(query, user);
  }

  @Get(':id')
  @CheckPolicies((ability) =>
    ability.rulesFor(Action.Read, 'PHQ9Screening').some((r) => !r.inverted),
  )
  findOne(@Param('id') id: string) {
    return this.phq9ScreeningsService.find(id);
  }

  @Patch(':id')
  @CheckPolicies((ability) =>
    ability.rulesFor(Action.Update, 'PHQ9Screening').some((r) => !r.inverted),
  )
  update(@Param('id') id: string, @Body() dto: UpdatePHQ9ScreeningDto) {
    return this.phq9ScreeningsService.updateScreening(id, dto);
  }

  @Delete(':id')
  @CheckPolicies((ability) => ability.can(Action.Delete, 'PHQ9Screening'))
  remove(@Param('id') id: string) {
    return this.phq9ScreeningsService.remove(id);
  }
}

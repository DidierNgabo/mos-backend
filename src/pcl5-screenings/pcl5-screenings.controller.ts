import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuthenticatedUser } from 'src/auth/auth.types';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Action } from 'src/auth/casl/ability.types';
import { CheckPolicies } from 'src/auth/casl/check-policies.decorator';
import { CreatePCL5ScreeningDto } from './dto/create-pcl5-screening.dto';
import { PCL5ScreeningQueryDto } from './dto/query-pcl5-screening.dto';
import { UpdatePCL5ScreeningDto } from './dto/update-pcl5-screening.dto';
import { PCL5ScreeningsService } from './pcl5-screenings.service';

@ApiBearerAuth()
@Controller('pcl5-screenings')
export class PCL5ScreeningsController {
  constructor(private readonly pcl5ScreeningsService: PCL5ScreeningsService) {}

  @Post()
  @CheckPolicies((ability) => ability.rulesFor(Action.Create, 'PCL5Screening').some((r) => !r.inverted))
  create(@Body() dto: CreatePCL5ScreeningDto, @CurrentUser() user: AuthenticatedUser) {
    return this.pcl5ScreeningsService.createScreening(dto, user.id);
  }

  @Get()
  @CheckPolicies((ability) => ability.rulesFor(Action.Read, 'PCL5Screening').some((r) => !r.inverted))
  findAll(@Query() query: PCL5ScreeningQueryDto) {
    return this.pcl5ScreeningsService.findAll(query);
  }

  @Get(':id')
  @CheckPolicies((ability) => ability.rulesFor(Action.Read, 'PCL5Screening').some((r) => !r.inverted))
  findOne(@Param('id') id: string) {
    return this.pcl5ScreeningsService.find(id);
  }

  @Patch(':id')
  @CheckPolicies((ability) => ability.rulesFor(Action.Update, 'PCL5Screening').some((r) => !r.inverted))
  update(@Param('id') id: string, @Body() dto: UpdatePCL5ScreeningDto) {
    return this.pcl5ScreeningsService.updateScreening(id, dto);
  }

  @Delete(':id')
  @CheckPolicies((ability) => ability.can(Action.Delete, 'PCL5Screening'))
  remove(@Param('id') id: string) {
    return this.pcl5ScreeningsService.remove(id);
  }
}

import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { AuthenticatedUser } from 'src/auth/auth.types';
import { StatsService } from './stats.service';
import { StatsQueryDto } from './dto/stats-query.dto';

@ApiTags('stats')
@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  private parseDate(s?: string): Date | undefined {
    return s ? new Date(s) : undefined;
  }

  @Get('me')
  getMyStats(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: StatsQueryDto,
  ) {
    return this.statsService.getStatsByRole(user, query.outreachId);
  }

  @Get('admin')
  @Roles('SUPER_ADMIN')
  getAdminStats(@Query() query: StatsQueryDto) {
    return this.statsService.getAdminStats(query.outreachId);
  }

  @Get('disease')
  @Roles('SUPER_ADMIN')
  getDiseaseStats(@Query() query: StatsQueryDto) {
    return this.statsService.getDiseaseStats(
      query.outreachId,
      this.parseDate(query.startDate),
      this.parseDate(query.endDate),
    );
  }

  @Get('mental-health')
  @Roles('SUPER_ADMIN')
  getMentalHealthStats(@Query() query: StatsQueryDto) {
    return this.statsService.getMentalHealthStats(
      query.outreachId,
      this.parseDate(query.startDate),
      this.parseDate(query.endDate),
    );
  }

  @Get('labs')
  @Roles('SUPER_ADMIN')
  getLabStats(@Query() query: StatsQueryDto) {
    return this.statsService.getLabStats(
      query.outreachId,
      this.parseDate(query.startDate),
      this.parseDate(query.endDate),
    );
  }

  @Get('vitals')
  @Roles('SUPER_ADMIN')
  getVitalsStats(@Query() query: StatsQueryDto) {
    return this.statsService.getVitalsStats(
      query.outreachId,
      this.parseDate(query.startDate),
      this.parseDate(query.endDate),
    );
  }

  @Get('doctors')
  @Roles('SUPER_ADMIN')
  getDoctorPerformanceStats(@Query() query: StatsQueryDto) {
    return this.statsService.getDoctorPerformanceStats(
      query.outreachId,
      this.parseDate(query.startDate),
      this.parseDate(query.endDate),
    );
  }

  @Get('pharmacy')
  @Roles('SUPER_ADMIN')
  getPharmacyStats(@Query() query: StatsQueryDto) {
    return this.statsService.getPharmacyStats(
      query.outreachId,
      this.parseDate(query.startDate),
      this.parseDate(query.endDate),
    );
  }

  @Get('impact')
  @Roles('SUPER_ADMIN')
  getImpactStats(@Query() query: StatsQueryDto) {
    return this.statsService.getImpactStats(
      query.outreachId,
      this.parseDate(query.startDate),
      this.parseDate(query.endDate),
    );
  }
}

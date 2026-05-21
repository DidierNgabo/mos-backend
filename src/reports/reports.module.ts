import { Module } from '@nestjs/common';
import { StatsModule } from 'src/stats/stats.module';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [StatsModule],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}

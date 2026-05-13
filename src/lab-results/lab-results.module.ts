import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { User } from 'src/users/entities/user.entity';
import { LabResult } from './entities/lab-result.entity';
import { LabResultsController } from './lab-results.controller';
import { LabResultsMapper } from './lab-results.mapper';
import { LabResultsService } from './lab-results.service';

@Module({
  imports: [MikroOrmModule.forFeature([LabResult, User])],
  controllers: [LabResultsController],
  providers: [LabResultsService, LabResultsMapper],
  exports: [LabResultsService],
})
export class LabResultsModule {}

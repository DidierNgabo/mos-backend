import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { CommunicableDisease } from 'src/communicable-diseases/entities/communicable-disease.entity';
import { LabResult } from 'src/lab-results/entities/lab-result.entity';
import { Observation } from 'src/observations/entities/observation.entity';
import { Prescription } from 'src/prescriptions/entities/prescription.entity';
import { PrescriptionsModule } from 'src/prescriptions/prescriptions.module';
import { Transfer } from 'src/transfers/entities/transfer.entity';
import { User } from 'src/users/entities/user.entity';
import { VitalSign } from 'src/vital-signs/entities/vital-sign.entity';
import { QueueEntry } from './entities/queue-entry.entity';
import { StationVisit } from './entities/station-visit.entity';
import { QueueEntriesController } from './queue-entries.controller';
import { QueueEntriesMapper } from './queue-entries.mapper';
import { QueueEntriesService } from './queue-entries.service';

@Module({
  imports: [
    MikroOrmModule.forFeature([QueueEntry, StationVisit, VitalSign, Observation, LabResult, CommunicableDisease, Transfer, User, Prescription]),
    PrescriptionsModule,
  ],
  controllers: [QueueEntriesController],
  providers: [QueueEntriesService, QueueEntriesMapper],
  exports: [QueueEntriesService],
})
export class QueueEntriesModule {}

import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { Outreach } from 'src/outreaches/entities/outreach.entity';
import { QueueEntry } from 'src/queue-entries/entities/queue-entry.entity';
import { StationVisit } from 'src/queue-entries/entities/station-visit.entity';
import { Station } from 'src/stations/entities/station.entity';
import { User } from 'src/users/entities/user.entity';
import { Patient } from './entities/patient.entity';
import { PatientMapper } from './patients.mapper';
import { PatientsController } from './patients.controller';
import { PatientsService } from './patients.service';

@Module({
  imports: [MikroOrmModule.forFeature([Patient, Outreach, User, Station, QueueEntry, StationVisit])],
  controllers: [PatientsController],
  providers: [PatientsService, PatientMapper],
  exports: [PatientsService],
})
export class PatientsModule {}

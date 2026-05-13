import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { Outreach } from 'src/outreaches/entities/outreach.entity';
import { User } from 'src/users/entities/user.entity';
import { Patient } from './entities/patient.entity';
import { PatientMapper } from './patients.mapper';
import { PatientsController } from './patients.controller';
import { PatientsService } from './patients.service';

@Module({
  imports: [MikroOrmModule.forFeature([Patient, Outreach, User])],
  controllers: [PatientsController],
  providers: [PatientsService, PatientMapper],
  exports: [PatientsService],
})
export class PatientsModule {}

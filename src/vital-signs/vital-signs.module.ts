import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { Outreach } from 'src/outreaches/entities/outreach.entity';
import { Patient } from 'src/patients/entities/patient.entity';
import { Station } from 'src/stations/entities/station.entity';
import { User } from 'src/users/entities/user.entity';
import { VitalSign } from './entities/vital-sign.entity';
import { VitalSignMapper } from './vital-signs.mapper';
import { VitalSignsController } from './vital-signs.controller';
import { VitalSignsService } from './vital-signs.service';

@Module({
  imports: [MikroOrmModule.forFeature([VitalSign, Patient, Station, User, Outreach])],
  controllers: [VitalSignsController],
  providers: [VitalSignsService, VitalSignMapper],
  exports: [VitalSignsService],
})
export class VitalSignsModule {}

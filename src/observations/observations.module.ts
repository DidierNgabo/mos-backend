import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { User } from 'src/users/entities/user.entity';
import { Observation } from './entities/observation.entity';
import { ObservationsController } from './observations.controller';
import { ObservationsMapper } from './observations.mapper';
import { ObservationsService } from './observations.service';

@Module({
  imports: [MikroOrmModule.forFeature([Observation, User])],
  controllers: [ObservationsController],
  providers: [ObservationsService, ObservationsMapper],
  exports: [ObservationsService],
})
export class ObservationsModule {}

import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { Outreach } from 'src/outreaches/entities/outreach.entity';
import { User } from 'src/users/entities/user.entity';
import { Station } from './entities/station.entity';
import { StationsController } from './stations.controller';
import { StationsMapper } from './stations.mapper';
import { StationsService } from './stations.service';

@Module({
  imports: [MikroOrmModule.forFeature([Station, User, Outreach])],
  controllers: [StationsController],
  providers: [StationsService, StationsMapper],
  exports: [StationsService],
})
export class StationsModule {}

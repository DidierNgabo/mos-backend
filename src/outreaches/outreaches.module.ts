import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { Station } from 'src/stations/entities/station.entity';
import { Team } from 'src/teams/entities/team.entity';
import { User } from 'src/users/entities/user.entity';
import { Outreach } from './entities/outreach.entity';
import { OutreachMapper } from './outreaches.mapper';
import { OutreachesController } from './outreaches.controller';
import { OutreachesService } from './outreaches.service';

@Module({
  imports: [MikroOrmModule.forFeature([Outreach, User, Station, Team])],
  controllers: [OutreachesController],
  providers: [OutreachesService, OutreachMapper],
  exports: [OutreachesService],
})
export class OutreachesModule {}

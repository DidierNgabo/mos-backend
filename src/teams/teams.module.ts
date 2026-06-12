import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { Outreach } from 'src/outreaches/entities/outreach.entity';
import { Station } from 'src/stations/entities/station.entity';
import { User } from 'src/users/entities/user.entity';
import { Team } from './entities/team.entity';
import { TeamsController } from './teams.controller';
import { TeamsMapper } from './teams.mapper';
import { TeamsService } from './teams.service';

@Module({
  imports: [MikroOrmModule.forFeature([Team, User, Outreach, Station])],
  controllers: [TeamsController],
  providers: [TeamsService, TeamsMapper],
  exports: [TeamsService],
})
export class TeamsModule {}

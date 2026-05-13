import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { User } from 'src/users/entities/user.entity';
import { CommunicableDisease } from './entities/communicable-disease.entity';
import { CommunicableDiseasesController } from './communicable-diseases.controller';
import { CommunicableDiseasesMapper } from './communicable-diseases.mapper';
import { CommunicableDiseasesService } from './communicable-diseases.service';

@Module({
  imports: [MikroOrmModule.forFeature([CommunicableDisease, User])],
  controllers: [CommunicableDiseasesController],
  providers: [CommunicableDiseasesService, CommunicableDiseasesMapper],
  exports: [CommunicableDiseasesService],
})
export class CommunicableDiseasesModule {}

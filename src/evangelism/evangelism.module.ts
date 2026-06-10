import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { User } from 'src/users/entities/user.entity';
import { EvangelismRecord } from './entities/evangelism-record.entity';
import { EvangelismController } from './evangelism.controller';
import { EvangelismMapper } from './evangelism.mapper';
import { EvangelismService } from './evangelism.service';

@Module({
  imports: [MikroOrmModule.forFeature([EvangelismRecord, User])],
  controllers: [EvangelismController],
  providers: [EvangelismService, EvangelismMapper],
  exports: [EvangelismService],
})
export class EvangelismModule {}

import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { User } from 'src/users/entities/user.entity';
import { Transfer } from './entities/transfer.entity';
import { TransfersController } from './transfers.controller';
import { TransfersMapper } from './transfers.mapper';
import { TransfersService } from './transfers.service';

@Module({
  imports: [MikroOrmModule.forFeature([Transfer, User])],
  controllers: [TransfersController],
  providers: [TransfersService, TransfersMapper],
  exports: [TransfersService],
})
export class TransfersModule {}

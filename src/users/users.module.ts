import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { EmailModule } from 'src/email/email.module';
import { Role } from 'src/roles/entities/role.entity';
import { User } from './entities/user.entity';
import { UserMapper } from './users.mapper';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [MikroOrmModule.forFeature([User, Role]), EmailModule],
  controllers: [UsersController],
  providers: [UsersService, UserMapper],
  exports: [UsersService],
})
export class UsersModule {}

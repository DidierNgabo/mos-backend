import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { User } from 'src/users/entities/user.entity';
import { GAD7Screening } from './entities/gad7-screening.entity';
import { GAD7ScreeningsController } from './gad7-screenings.controller';
import { GAD7ScreeningsMapper } from './gad7-screenings.mapper';
import { GAD7ScreeningsService } from './gad7-screenings.service';

@Module({
  imports: [MikroOrmModule.forFeature([GAD7Screening, User])],
  controllers: [GAD7ScreeningsController],
  providers: [GAD7ScreeningsService, GAD7ScreeningsMapper],
  exports: [GAD7ScreeningsService],
})
export class GAD7ScreeningsModule {}

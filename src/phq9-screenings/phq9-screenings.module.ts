import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { User } from 'src/users/entities/user.entity';
import { PHQ9Screening } from './entities/phq9-screening.entity';
import { PHQ9ScreeningsController } from './phq9-screenings.controller';
import { PHQ9ScreeningsMapper } from './phq9-screenings.mapper';
import { PHQ9ScreeningsService } from './phq9-screenings.service';

@Module({
  imports: [MikroOrmModule.forFeature([PHQ9Screening, User])],
  controllers: [PHQ9ScreeningsController],
  providers: [PHQ9ScreeningsService, PHQ9ScreeningsMapper],
  exports: [PHQ9ScreeningsService],
})
export class PHQ9ScreeningsModule {}

import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { User } from 'src/users/entities/user.entity';
import { PCL5Screening } from './entities/pcl5-screening.entity';
import { PCL5ScreeningsController } from './pcl5-screenings.controller';
import { PCL5ScreeningsMapper } from './pcl5-screenings.mapper';
import { PCL5ScreeningsService } from './pcl5-screenings.service';

@Module({
  imports: [MikroOrmModule.forFeature([PCL5Screening, User])],
  controllers: [PCL5ScreeningsController],
  providers: [PCL5ScreeningsService, PCL5ScreeningsMapper],
  exports: [PCL5ScreeningsService],
})
export class PCL5ScreeningsModule {}

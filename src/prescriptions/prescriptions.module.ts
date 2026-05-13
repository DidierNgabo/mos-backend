import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { PharmacyStockModule } from 'src/pharmacy-stock/pharmacy-stock.module';
import { User } from 'src/users/entities/user.entity';
import { Prescription } from './entities/prescription.entity';
import { PrescriptionsController } from './prescriptions.controller';
import { PrescriptionsMapper } from './prescriptions.mapper';
import { PrescriptionsService } from './prescriptions.service';

@Module({
  imports: [MikroOrmModule.forFeature([Prescription, User]), PharmacyStockModule],
  controllers: [PrescriptionsController],
  providers: [PrescriptionsService, PrescriptionsMapper],
  exports: [PrescriptionsService],
})
export class PrescriptionsModule {}

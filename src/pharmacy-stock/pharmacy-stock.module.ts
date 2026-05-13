import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { Outreach } from 'src/outreaches/entities/outreach.entity';
import { User } from 'src/users/entities/user.entity';
import { PharmacyStock } from './entities/pharmacy-stock.entity';
import { StockTransaction } from './entities/stock-transaction.entity';
import { PharmacyStockController } from './pharmacy-stock.controller';
import { PharmacyStockMapper } from './pharmacy-stock.mapper';
import { PharmacyStockService } from './pharmacy-stock.service';

@Module({
  imports: [MikroOrmModule.forFeature([PharmacyStock, StockTransaction, Outreach, User])],
  controllers: [PharmacyStockController],
  providers: [PharmacyStockService, PharmacyStockMapper],
  exports: [PharmacyStockService],
})
export class PharmacyStockModule {}

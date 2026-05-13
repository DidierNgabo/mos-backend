import { PartialType } from '@nestjs/swagger';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreatePharmacyStockDto } from './create-pharmacy-stock.dto';

export class UpdatePharmacyStockDto extends PartialType(CreatePharmacyStockDto) {
  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

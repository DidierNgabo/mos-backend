import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsPositive, IsString } from 'class-validator';
import { TransactionType } from '../entities/stock-transaction.entity';

export class CreateStockTransactionDto {
  @ApiProperty({ enum: TransactionType })
  @IsEnum(TransactionType)
  transactionType: TransactionType;

  @ApiProperty({ example: 50 })
  @IsPositive()
  quantity: number;

  @ApiPropertyOptional({ example: 'Emergency restock from central pharmacy' })
  @IsString()
  @IsOptional()
  notes?: string;
}

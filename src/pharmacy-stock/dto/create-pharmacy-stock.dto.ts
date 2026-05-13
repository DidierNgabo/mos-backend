import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreatePharmacyStockDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  @IsNotEmpty()
  outreachId: string;

  @ApiProperty({ example: 'Amoxicillin' })
  @IsString()
  @IsNotEmpty()
  medicationName: string;

  @ApiProperty({ example: 'Amoxicillin trihydrate' })
  @IsString()
  @IsNotEmpty()
  genericName: string;

  @ApiProperty({ example: 'TABLET' })
  @IsString()
  @IsNotEmpty()
  dosageForm: string;

  @ApiProperty({ example: '500mg' })
  @IsString()
  @IsNotEmpty()
  strength: string;

  @ApiProperty({ example: 100 })
  @IsInt()
  @Min(0)
  quantityInStock: number;

  @ApiProperty({ example: 20 })
  @IsInt()
  @Min(0)
  lowStockThreshold: number;

  @ApiProperty({ example: 'tablets' })
  @IsString()
  @IsNotEmpty()
  unitOfMeasure: string;

  @ApiPropertyOptional({ example: 'Antibiotic' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ example: 'PharmaCorp' })
  @IsString()
  @IsOptional()
  manufacturer?: string;

  @ApiPropertyOptional({ example: 'BATCH-2024-001' })
  @IsString()
  @IsOptional()
  batchNumber?: string;

  @ApiPropertyOptional({ example: '2025-12-31' })
  @IsDateString()
  @IsOptional()
  expiryDate?: string;
}

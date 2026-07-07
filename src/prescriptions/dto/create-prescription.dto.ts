import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsPositive, IsString, IsUUID } from 'class-validator';

export class CreatePrescriptionDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  queueEntryId: string;

  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  patientId: string;

  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  outreachId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  pharmacyStockId?: string;

  @ApiPropertyOptional({ example: 'Ibuprofen 400mg' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  customMedicationName?: string;

  @ApiProperty({ example: '500mg twice daily' })
  @IsString()
  @IsNotEmpty()
  dosage: string;

  @ApiProperty({ example: 14 })
  @IsInt()
  @IsPositive()
  quantity: number;

  @ApiPropertyOptional({ example: 'Take after meals' })
  @IsString()
  @IsOptional()
  instructions?: string;
}

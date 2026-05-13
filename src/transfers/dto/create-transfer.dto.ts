import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { TransferUrgency } from '../entities/transfer.entity';

export class CreateTransferDto {
  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  queueEntryId?: string;

  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  patientId: string;

  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  outreachId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  transferReason: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  referredToFacility: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  referredService: string;

  @ApiPropertyOptional({ enum: TransferUrgency, default: TransferUrgency.ROUTINE })
  @IsEnum(TransferUrgency)
  @IsOptional()
  urgency?: TransferUrgency;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  transportArranged?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}

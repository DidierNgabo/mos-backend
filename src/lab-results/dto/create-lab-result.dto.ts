import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { LabTestType } from '../entities/lab-result.entity';

export class CreateLabResultDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  queueEntryId: string;

  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  patientId: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  stationId?: string;

  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  outreachId: string;

  @ApiProperty({ enum: LabTestType })
  @IsEnum(LabTestType)
  @IsNotEmpty()
  testType: LabTestType;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  resultValue: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  resultUnit?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isAbnormal?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}

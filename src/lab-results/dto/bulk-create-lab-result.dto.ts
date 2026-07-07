import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { LabTestType } from '../entities/lab-result.entity';

export class LabResultItemDto {
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

export class BulkCreateLabResultDto {
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

  @ApiProperty({ type: [LabResultItemDto] })
  @ValidateNested({ each: true })
  @Type(() => LabResultItemDto)
  @ArrayMinSize(1)
  results: LabResultItemDto[];
}

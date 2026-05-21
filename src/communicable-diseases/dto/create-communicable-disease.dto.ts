import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateCommunicableDiseaseDto {
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
  @IsBoolean()
  @IsOptional()
  tuberculosisScreen?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  tuberculosisNotes?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  malariaScreen?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  hasFever?: boolean;

  @ApiPropertyOptional()
  @IsInt()
  @Min(0)
  @IsOptional()
  feverDurationDays?: number;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  recentTravel?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  contactWithInfected?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  hivScreen?: boolean;
}

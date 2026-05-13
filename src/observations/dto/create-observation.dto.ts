import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateObservationDto {
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
  stationId: string;

  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  outreachId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  chiefComplaint: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  diagnosis: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  treatmentGiven?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  followUpRequired?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  followUpNotes?: string;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import {
  DivisionType,
  EducationLevel,
  LocationType,
  MaritalStatus,
  OccupationType,
  ReligionType,
} from '../entities/pcl5-screening.entity';

export class CreatePCL5ScreeningDto {
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

  // Demographic fields (optional)
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  initialOfParticipant?: string;

  @ApiPropertyOptional({ enum: MaritalStatus })
  @IsEnum(MaritalStatus)
  @IsOptional()
  maritalStatus?: MaritalStatus;

  @ApiPropertyOptional({ enum: EducationLevel })
  @IsEnum(EducationLevel)
  @IsOptional()
  educationLevel?: EducationLevel;

  @ApiPropertyOptional({ enum: OccupationType })
  @IsEnum(OccupationType)
  @IsOptional()
  occupation?: OccupationType;

  @ApiPropertyOptional({ enum: DivisionType })
  @IsEnum(DivisionType)
  @IsOptional()
  division?: DivisionType;

  @ApiPropertyOptional({ enum: LocationType })
  @IsEnum(LocationType)
  @IsOptional()
  locationType?: LocationType;

  @ApiPropertyOptional({ enum: ReligionType })
  @IsEnum(ReligionType)
  @IsOptional()
  religion?: ReligionType;

  // PCL-5 questions (0–4)
  @ApiProperty({ minimum: 0, maximum: 4 }) @IsInt() @Min(0) @Max(4) q1: number;
  @ApiProperty({ minimum: 0, maximum: 4 }) @IsInt() @Min(0) @Max(4) q2: number;
  @ApiProperty({ minimum: 0, maximum: 4 }) @IsInt() @Min(0) @Max(4) q3: number;
  @ApiProperty({ minimum: 0, maximum: 4 }) @IsInt() @Min(0) @Max(4) q4: number;
  @ApiProperty({ minimum: 0, maximum: 4 }) @IsInt() @Min(0) @Max(4) q5: number;
  @ApiProperty({ minimum: 0, maximum: 4 }) @IsInt() @Min(0) @Max(4) q6: number;
  @ApiProperty({ minimum: 0, maximum: 4 }) @IsInt() @Min(0) @Max(4) q7: number;
  @ApiProperty({ minimum: 0, maximum: 4 }) @IsInt() @Min(0) @Max(4) q8: number;
  @ApiProperty({ minimum: 0, maximum: 4 }) @IsInt() @Min(0) @Max(4) q9: number;
  @ApiProperty({ minimum: 0, maximum: 4 }) @IsInt() @Min(0) @Max(4) q10: number;
  @ApiProperty({ minimum: 0, maximum: 4 }) @IsInt() @Min(0) @Max(4) q11: number;
  @ApiProperty({ minimum: 0, maximum: 4 }) @IsInt() @Min(0) @Max(4) q12: number;
  @ApiProperty({ minimum: 0, maximum: 4 }) @IsInt() @Min(0) @Max(4) q13: number;
  @ApiProperty({ minimum: 0, maximum: 4 }) @IsInt() @Min(0) @Max(4) q14: number;
  @ApiProperty({ minimum: 0, maximum: 4 }) @IsInt() @Min(0) @Max(4) q15: number;
  @ApiProperty({ minimum: 0, maximum: 4 }) @IsInt() @Min(0) @Max(4) q16: number;
  @ApiProperty({ minimum: 0, maximum: 4 }) @IsInt() @Min(0) @Max(4) q17: number;
  @ApiProperty({ minimum: 0, maximum: 4 }) @IsInt() @Min(0) @Max(4) q18: number;
  @ApiProperty({ minimum: 0, maximum: 4 }) @IsInt() @Min(0) @Max(4) q19: number;
  @ApiProperty({ minimum: 0, maximum: 4 }) @IsInt() @Min(0) @Max(4) q20: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}

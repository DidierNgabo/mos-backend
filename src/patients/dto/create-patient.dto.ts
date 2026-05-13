import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { Gender } from '../entities/patient.entity';

export class CreatePatientDto {
  @ApiProperty({ description: 'ID of the outreach this patient is being registered for' })
  @IsUUID()
  @IsNotEmpty()
  outreachId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: '1990-05-15' })
  @IsDateString()
  @IsNotEmpty()
  dateOfBirth: string;

  @ApiProperty({ enum: Gender })
  @IsEnum(Gender)
  gender: Gender;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nationalId?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  village: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  district: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sector?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cell?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  province: string;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { OutreachStatus } from '../entities/outreach.entity';

export class CreateOutreachDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  location: string;

  @ApiProperty({ example: '2026-05-01' })
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @ApiPropertyOptional({ enum: OutreachStatus, default: OutreachStatus.PLANNED })
  @IsOptional()
  @IsEnum(OutreachStatus)
  status?: OutreachStatus = OutreachStatus.PLANNED;

  @ApiPropertyOptional({
    description: 'IDs of users to assign as members of this outreach',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  memberIds?: string[];
}

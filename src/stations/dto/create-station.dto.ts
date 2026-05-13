import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { StationType } from '../entities/station.entity';

export class CreateStationDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  @IsNotEmpty()
  outreachId: string;

  @ApiProperty({ example: 'Ophthalmology' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: StationType })
  @IsEnum(StationType)
  type: StationType;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;
}

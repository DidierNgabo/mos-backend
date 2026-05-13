import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { PaginationQueryDto } from 'src/utils/pagination.utils';
import { QueryBooleanTransform } from 'src/utils/validation.utils';
import { StationType } from '../entities/station.entity';

export class StationQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(StationType)
  type?: StationType;

  @IsOptional()
  @IsUUID()
  outreachId?: string;

  @IsOptional()
  @Transform(({ value }) => QueryBooleanTransform(value))
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsDateString()
  createdAt?: string;

  @IsOptional()
  @IsDateString()
  updatedAt?: string;

  @IsOptional()
  @IsString()
  search?: string;
}

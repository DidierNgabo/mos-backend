import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { PaginationQueryDto } from 'src/utils/pagination.utils';
import { QueryBooleanTransform } from 'src/utils/validation.utils';

export class UserQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsUUID()
  roleId?: string;

  @IsOptional()
  @IsUUID()
  stationId?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => QueryBooleanTransform(value))
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => QueryBooleanTransform(value))
  mustChangePassword?: boolean;

  @IsOptional()
  @IsDateString()
  createdAt?: Date;

  @IsOptional()
  @IsDateString()
  updatedAt?: Date;

  @IsOptional()
  @IsString()
  search?: string;
}

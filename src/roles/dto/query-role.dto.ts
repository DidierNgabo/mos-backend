import {
  IsOptional,
  IsString,
  IsNumber,
  IsEnum,
  IsUUID,
  IsDateString,
  IsNotEmpty,
} from 'class-validator';
import { PaginationQueryDto } from 'src/utils/pagination.utils';

export class RoleQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;



  @IsOptional()
  @IsUUID()
  roleId?: string;

  @IsOptional()
  @IsDateString()
  createdAt?: Date;

  @IsOptional()
  @IsDateString()
  updatedAt?: Date;

  // Global search - searches across multiple fields
  @IsOptional()
  @IsString()
  search?: string;


  @IsString()
  @IsNotEmpty()
  @IsOptional()
  roleNameLike?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  roleDescriptionLike?: string;

}

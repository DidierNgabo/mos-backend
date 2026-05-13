import {
  IsDateString,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { PaginationQueryDto } from 'src/utils/pagination.utils';

export class VitalSignQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID()
  patientId?: string;

  @IsOptional()
  @IsUUID()
  stationId?: string;

  @IsOptional()
  @IsUUID()
  outreachId?: string;

  @IsOptional()
  @IsUUID()
  recordedById?: string;

  @IsOptional()
  @IsDateString()
  createdAt?: string;
}

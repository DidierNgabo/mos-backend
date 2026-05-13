import { IsDateString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from 'src/utils/pagination.utils';
import { PCL5Severity } from '../entities/pcl5-screening.entity';

export class PCL5ScreeningQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID()
  patientId?: string;

  @IsOptional()
  @IsUUID()
  queueEntryId?: string;

  @IsOptional()
  @IsUUID()
  outreachId?: string;

  @IsOptional()
  @IsUUID()
  stationId?: string;

  @IsOptional()
  @IsUUID()
  recordedById?: string;

  @IsOptional()
  @IsEnum(PCL5Severity)
  severity?: PCL5Severity;

  @IsOptional()
  @IsDateString()
  createdAt?: Date;
}

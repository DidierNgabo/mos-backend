import { IsDateString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from 'src/utils/pagination.utils';
import { PHQ9Severity } from '../entities/phq9-screening.entity';

export class PHQ9ScreeningQueryDto extends PaginationQueryDto {
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
  @IsEnum(PHQ9Severity)
  severity?: PHQ9Severity;

  @IsOptional()
  @IsDateString()
  createdAt?: Date;
}

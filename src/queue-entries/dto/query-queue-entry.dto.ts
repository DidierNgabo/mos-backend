import { IsDateString, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { QueuePriority, QueueStatus } from '../entities/queue-entry.entity';
import { PaginationQueryDto } from 'src/utils/pagination.utils';

export class QueueEntryQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID()
  patientId?: string;

  @IsOptional()
  @IsUUID()
  outreachId?: string;

  @IsOptional()
  @IsUUID()
  currentStationId?: string;

  @IsOptional()
  @IsEnum(QueueStatus)
  status?: QueueStatus;

  @IsOptional()
  @IsEnum(QueuePriority)
  priority?: QueuePriority;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsDateString()
  createdAt?: Date;

  @IsOptional()
  @IsDateString()
  updatedAt?: Date;
}

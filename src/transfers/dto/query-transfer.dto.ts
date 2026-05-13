import { IsDateString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from 'src/utils/pagination.utils';
import { TransferUrgency } from '../entities/transfer.entity';

export class TransferQueryDto extends PaginationQueryDto {
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
  initiatedById?: string;

  @IsOptional()
  @IsEnum(TransferUrgency)
  urgency?: TransferUrgency;

  @IsOptional()
  @IsDateString()
  createdAt?: Date;
}

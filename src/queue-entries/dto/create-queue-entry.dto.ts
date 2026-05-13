import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { QueuePriority } from '../entities/queue-entry.entity';

export class CreateQueueEntryDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  patientId: string;

  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  outreachId: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  currentStationId?: string;

  @ApiPropertyOptional({ enum: QueuePriority, default: QueuePriority.NORMAL })
  @IsEnum(QueuePriority)
  @IsOptional()
  priority?: QueuePriority;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  chiefComplaint?: string;
}

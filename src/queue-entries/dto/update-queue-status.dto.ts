import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { QueueStatus } from '../entities/queue-entry.entity';

export class UpdateQueueStatusDto {
  @ApiProperty({ enum: QueueStatus })
  @IsEnum(QueueStatus)
  @IsNotEmpty()
  status: QueueStatus;
}

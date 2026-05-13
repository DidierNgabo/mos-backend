import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class MoveQueueEntryDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  stationId: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  reason?: string;
}

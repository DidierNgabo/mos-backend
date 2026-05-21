import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class StatsQueryDto {
  @ApiProperty({ description: 'ID of the outreach to aggregate stats for' })
  @IsUUID()
  outreachId: string;

  @ApiPropertyOptional({ example: '2026-05-01', description: 'Filter records from this date (inclusive)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-05-21', description: 'Filter records up to this date (inclusive)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

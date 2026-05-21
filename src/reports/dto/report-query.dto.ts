import { IsDateString, IsIn, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ReportQueryDto {
  @ApiProperty({ description: 'ID of the outreach to generate report for' })
  @IsUUID()
  outreachId: string;

  @ApiPropertyOptional({ enum: ['pdf', 'csv'], default: 'pdf' })
  @IsOptional()
  @IsIn(['pdf', 'csv'])
  format: 'pdf' | 'csv' = 'pdf';

  @ApiPropertyOptional({ example: '2026-05-01', description: 'Filter records from this date (inclusive)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-05-21', description: 'Filter records up to this date (inclusive)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class ImpactReportQueryDto {
  @ApiProperty({ description: 'ID of the outreach for the impact report' })
  @IsUUID()
  outreachId: string;

  @ApiPropertyOptional({ enum: ['pdf'], default: 'pdf' })
  @IsOptional()
  @IsIn(['pdf'])
  format: 'pdf' = 'pdf';

  @ApiPropertyOptional({ example: '2026-05-01', description: 'Filter records from this date (inclusive)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-05-21', description: 'Filter records up to this date (inclusive)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

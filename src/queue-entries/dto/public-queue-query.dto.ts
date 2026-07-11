import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationQueryDto } from 'src/utils/pagination.utils';

export class PublicQueueQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Search by patient name or registration number' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by outreach ID' })
  @IsOptional()
  @IsUUID()
  outreachId?: string;

  @ApiPropertyOptional({ description: 'Filter by station ID' })
  @IsOptional()
  @IsUUID()
  currentStationId?: string;
}

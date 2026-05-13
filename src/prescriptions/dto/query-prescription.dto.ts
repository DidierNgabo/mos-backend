import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from 'src/utils/pagination.utils';
import { PrescriptionStatus } from '../entities/prescription.entity';

export class PrescriptionQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  queueEntryId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  patientId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  outreachId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  pharmacyStockId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  prescribedById?: string;

  @ApiPropertyOptional({ enum: PrescriptionStatus })
  @IsEnum(PrescriptionStatus)
  @IsOptional()
  status?: PrescriptionStatus;
}

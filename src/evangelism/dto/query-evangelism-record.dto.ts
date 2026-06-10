import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { PaginationQueryDto } from 'src/utils/pagination.utils';
import { QueryBooleanTransform } from 'src/utils/validation.utils';

export class EvangelismRecordQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  outreachId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  patientId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  doneById?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @Transform(({ value }) => QueryBooleanTransform(value))
  @IsOptional()
  isSaved?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @Transform(({ value }) => QueryBooleanTransform(value))
  @IsOptional()
  acceptedJesus?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @Transform(({ value }) => QueryBooleanTransform(value))
  @IsOptional()
  continueTheJourney?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @Transform(({ value }) => QueryBooleanTransform(value))
  @IsOptional()
  followUp?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @Transform(({ value }) => QueryBooleanTransform(value))
  @IsOptional()
  notSure?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @Transform(({ value }) => QueryBooleanTransform(value))
  @IsOptional()
  declined?: boolean;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  createdAt?: Date;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  updatedAt?: Date;

  @ApiPropertyOptional({
    description:
      'Global search across name, healingRequest, sinsToConfess and prayerRequest',
  })
  @IsString()
  @IsOptional()
  search?: string;
}

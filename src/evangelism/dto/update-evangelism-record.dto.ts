import { PartialType } from '@nestjs/swagger';
import { CreateEvangelismRecordDto } from './create-evangelism-record.dto';

export class UpdateEvangelismRecordDto extends PartialType(
  CreateEvangelismRecordDto,
) {}

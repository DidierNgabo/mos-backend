import { PartialType } from '@nestjs/swagger';
import { CreateQueueEntryDto } from './create-queue-entry.dto';

export class UpdateQueueEntryDto extends PartialType(CreateQueueEntryDto) {}

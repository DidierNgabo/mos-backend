import { PartialType } from '@nestjs/swagger';
import { CreateOutreachDto } from './create-outreach.dto';

export class UpdateOutreachDto extends PartialType(CreateOutreachDto) {}

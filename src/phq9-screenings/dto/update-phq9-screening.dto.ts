import { PartialType } from '@nestjs/swagger';
import { CreatePHQ9ScreeningDto } from './create-phq9-screening.dto';

export class UpdatePHQ9ScreeningDto extends PartialType(CreatePHQ9ScreeningDto) {}

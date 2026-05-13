import { PartialType } from '@nestjs/swagger';
import { CreateGAD7ScreeningDto } from './create-gad7-screening.dto';

export class UpdateGAD7ScreeningDto extends PartialType(CreateGAD7ScreeningDto) {}

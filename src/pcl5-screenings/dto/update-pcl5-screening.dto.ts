import { PartialType } from '@nestjs/swagger';
import { CreatePCL5ScreeningDto } from './create-pcl5-screening.dto';

export class UpdatePCL5ScreeningDto extends PartialType(CreatePCL5ScreeningDto) {}

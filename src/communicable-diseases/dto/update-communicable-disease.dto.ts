import { PartialType } from '@nestjs/swagger';
import { CreateCommunicableDiseaseDto } from './create-communicable-disease.dto';

export class UpdateCommunicableDiseaseDto extends PartialType(CreateCommunicableDiseaseDto) {}

import { EntityRepository, FilterQuery } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { EntityMapper } from 'src/common/mikro-orm.entity-service';
import { CreateCommunicableDiseaseDto } from './dto/create-communicable-disease.dto';
import { CommunicableDiseaseQueryDto } from './dto/query-communicable-disease.dto';
import { UpdateCommunicableDiseaseDto } from './dto/update-communicable-disease.dto';
import { CommunicableDisease } from './entities/communicable-disease.entity';

@Injectable()
export class CommunicableDiseasesMapper
  implements EntityMapper<CommunicableDisease, CreateCommunicableDiseaseDto, UpdateCommunicableDiseaseDto, CommunicableDiseaseQueryDto>
{
  constructor(
    @InjectRepository(CommunicableDisease)
    private readonly repository: EntityRepository<CommunicableDisease>,
  ) {}

  fromCreateDto(dto: CreateCommunicableDiseaseDto): CommunicableDisease {
    const cd = new CommunicableDisease();
    cd.id = randomUUID();
    if (dto.tuberculosisScreen !== undefined) cd.tuberculosisScreen = dto.tuberculosisScreen;
    if (dto.tuberculosisNotes) cd.tuberculosisNotes = dto.tuberculosisNotes;
    if (dto.malariaScreen !== undefined) cd.malariaScreen = dto.malariaScreen;
    if (dto.hasFever !== undefined) cd.hasFever = dto.hasFever;
    if (dto.feverDurationDays !== undefined) cd.feverDurationDays = dto.feverDurationDays;
    if (dto.recentTravel !== undefined) cd.recentTravel = dto.recentTravel;
    if (dto.contactWithInfected !== undefined) cd.contactWithInfected = dto.contactWithInfected;
    (cd as any).queueEntry = { id: dto.queueEntryId };
    (cd as any).patient = { id: dto.patientId };
    (cd as any).outreach = { id: dto.outreachId };
    return cd;
  }

  async fromUpdateDto(id: string, dto: UpdateCommunicableDiseaseDto): Promise<CommunicableDisease | null> {
    const entity = await this.repository.findOne({ id });
    if (!entity) return null;
    return this.repository.assign(entity, this.entityFromDto(dto));
  }

  entityFromDto(dto: UpdateCommunicableDiseaseDto) {
    const patch: Partial<CommunicableDisease> = {};
    if (dto.tuberculosisScreen !== undefined) patch.tuberculosisScreen = dto.tuberculosisScreen;
    if (dto.tuberculosisNotes !== undefined) patch.tuberculosisNotes = dto.tuberculosisNotes;
    if (dto.malariaScreen !== undefined) patch.malariaScreen = dto.malariaScreen;
    if (dto.hasFever !== undefined) patch.hasFever = dto.hasFever;
    if (dto.feverDurationDays !== undefined) patch.feverDurationDays = dto.feverDurationDays;
    if (dto.recentTravel !== undefined) patch.recentTravel = dto.recentTravel;
    if (dto.contactWithInfected !== undefined) patch.contactWithInfected = dto.contactWithInfected;
    return patch;
  }

  filtersFromQueryDto(query: CommunicableDiseaseQueryDto): FilterQuery<CommunicableDisease>[] {
    const patientFilter: FilterQuery<CommunicableDisease> = query.patientId && { patient: { id: query.patientId } };
    const queueEntryFilter: FilterQuery<CommunicableDisease> = query.queueEntryId && { queueEntry: { id: query.queueEntryId } };
    const outreachFilter: FilterQuery<CommunicableDisease> = query.outreachId && { outreach: { id: query.outreachId } };
    const recordedByFilter: FilterQuery<CommunicableDisease> = query.recordedById && { recordedBy: { id: query.recordedById } };
    const createdAt: FilterQuery<CommunicableDisease> = query.createdAt && { createdAt: { $lt: query.createdAt } };

    return [patientFilter, queueEntryFilter, outreachFilter, recordedByFilter, createdAt].filter((f) => !!f);
  }
}

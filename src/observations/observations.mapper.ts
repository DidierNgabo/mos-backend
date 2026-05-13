import { EntityRepository, FilterQuery } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { EntityMapper } from 'src/common/mikro-orm.entity-service';
import { CreateObservationDto } from './dto/create-observation.dto';
import { ObservationQueryDto } from './dto/query-observation.dto';
import { UpdateObservationDto } from './dto/update-observation.dto';
import { Observation } from './entities/observation.entity';

@Injectable()
export class ObservationsMapper
  implements EntityMapper<Observation, CreateObservationDto, UpdateObservationDto, ObservationQueryDto>
{
  constructor(
    @InjectRepository(Observation)
    private readonly repository: EntityRepository<Observation>,
  ) {}

  fromCreateDto(dto: CreateObservationDto): Observation {
    const obs = new Observation();
    obs.id = randomUUID();
    obs.chiefComplaint = dto.chiefComplaint;
    obs.diagnosis = dto.diagnosis;
    if (dto.treatmentGiven) obs.treatmentGiven = dto.treatmentGiven;
    if (dto.followUpRequired !== undefined) obs.followUpRequired = dto.followUpRequired;
    if (dto.followUpNotes) obs.followUpNotes = dto.followUpNotes;
    (obs as any).queueEntry = { id: dto.queueEntryId };
    (obs as any).patient = { id: dto.patientId };
    (obs as any).station = { id: dto.stationId };
    (obs as any).outreach = { id: dto.outreachId };
    return obs;
  }

  async fromUpdateDto(id: string, dto: UpdateObservationDto): Promise<Observation | null> {
    const entity = await this.repository.findOne({ id });
    if (!entity) return null;
    return this.repository.assign(entity, this.entityFromDto(dto));
  }

  entityFromDto(dto: UpdateObservationDto) {
    const patch: Partial<Observation> = {};
    if (dto.chiefComplaint !== undefined) patch.chiefComplaint = dto.chiefComplaint;
    if (dto.diagnosis !== undefined) patch.diagnosis = dto.diagnosis;
    if (dto.treatmentGiven !== undefined) patch.treatmentGiven = dto.treatmentGiven;
    if (dto.followUpRequired !== undefined) patch.followUpRequired = dto.followUpRequired;
    if (dto.followUpNotes !== undefined) patch.followUpNotes = dto.followUpNotes;
    return patch;
  }

  filtersFromQueryDto(query: ObservationQueryDto): FilterQuery<Observation>[] {
    const patientFilter: FilterQuery<Observation> = query.patientId && { patient: { id: query.patientId } };
    const queueEntryFilter: FilterQuery<Observation> = query.queueEntryId && { queueEntry: { id: query.queueEntryId } };
    const outreachFilter: FilterQuery<Observation> = query.outreachId && { outreach: { id: query.outreachId } };
    const stationFilter: FilterQuery<Observation> = query.stationId && { station: { id: query.stationId } };
    const recordedByFilter: FilterQuery<Observation> = query.recordedById && { recordedBy: { id: query.recordedById } };
    const createdAt: FilterQuery<Observation> = query.createdAt && { createdAt: { $lt: query.createdAt } };
    const globalSearch: FilterQuery<Observation> = query.search && {
      $or: [
        { chiefComplaint: { $ilike: '%' + query.search + '%' } },
        { diagnosis: { $ilike: '%' + query.search + '%' } },
      ],
    };

    return [
      patientFilter, queueEntryFilter, outreachFilter, stationFilter,
      recordedByFilter, createdAt, globalSearch,
    ].filter((f) => !!f);
  }
}

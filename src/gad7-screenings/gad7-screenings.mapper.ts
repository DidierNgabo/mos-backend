import { EntityRepository, FilterQuery } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { EntityMapper } from 'src/common/mikro-orm.entity-service';
import { CreateGAD7ScreeningDto } from './dto/create-gad7-screening.dto';
import { GAD7ScreeningQueryDto } from './dto/query-gad7-screening.dto';
import { UpdateGAD7ScreeningDto } from './dto/update-gad7-screening.dto';
import { GAD7Screening } from './entities/gad7-screening.entity';

@Injectable()
export class GAD7ScreeningsMapper
  implements EntityMapper<GAD7Screening, CreateGAD7ScreeningDto, UpdateGAD7ScreeningDto, GAD7ScreeningQueryDto>
{
  constructor(
    @InjectRepository(GAD7Screening)
    private readonly repository: EntityRepository<GAD7Screening>,
  ) {}

  fromCreateDto(dto: CreateGAD7ScreeningDto): GAD7Screening {
    const s = new GAD7Screening();
    s.id = randomUUID();
    s.q1Anxious = dto.q1Anxious;
    s.q2Uncontrollable = dto.q2Uncontrollable;
    s.q3Worrying = dto.q3Worrying;
    s.q4Relaxing = dto.q4Relaxing;
    s.q5Restless = dto.q5Restless;
    s.q6Irritable = dto.q6Irritable;
    s.q7Afraid = dto.q7Afraid;
    if (dto.notes) s.notes = dto.notes;
    (s as any).queueEntry = { id: dto.queueEntryId };
    (s as any).patient = { id: dto.patientId };
    (s as any).station = { id: dto.stationId };
    (s as any).outreach = { id: dto.outreachId };
    return s;
  }

  async fromUpdateDto(id: string, dto: UpdateGAD7ScreeningDto): Promise<GAD7Screening | null> {
    const entity = await this.repository.findOne({ id });
    if (!entity) return null;
    return this.repository.assign(entity, this.entityFromDto(dto));
  }

  entityFromDto(dto: UpdateGAD7ScreeningDto) {
    const patch: Partial<GAD7Screening> = {};
    if (dto.q1Anxious !== undefined) patch.q1Anxious = dto.q1Anxious;
    if (dto.q2Uncontrollable !== undefined) patch.q2Uncontrollable = dto.q2Uncontrollable;
    if (dto.q3Worrying !== undefined) patch.q3Worrying = dto.q3Worrying;
    if (dto.q4Relaxing !== undefined) patch.q4Relaxing = dto.q4Relaxing;
    if (dto.q5Restless !== undefined) patch.q5Restless = dto.q5Restless;
    if (dto.q6Irritable !== undefined) patch.q6Irritable = dto.q6Irritable;
    if (dto.q7Afraid !== undefined) patch.q7Afraid = dto.q7Afraid;
    if (dto.notes !== undefined) patch.notes = dto.notes;
    return patch;
  }

  filtersFromQueryDto(query: GAD7ScreeningQueryDto): FilterQuery<GAD7Screening>[] {
    const patientFilter: FilterQuery<GAD7Screening> = query.patientId && { patient: { id: query.patientId } };
    const queueEntryFilter: FilterQuery<GAD7Screening> = query.queueEntryId && { queueEntry: { id: query.queueEntryId } };
    const outreachFilter: FilterQuery<GAD7Screening> = query.outreachId && { outreach: { id: query.outreachId } };
    const stationFilter: FilterQuery<GAD7Screening> = query.stationId && { station: { id: query.stationId } };
    const recordedByFilter: FilterQuery<GAD7Screening> = query.recordedById && { recordedBy: { id: query.recordedById } };
    const severityFilter: FilterQuery<GAD7Screening> = query.severity && { severity: query.severity };
    const createdAt: FilterQuery<GAD7Screening> = query.createdAt && { createdAt: { $lt: query.createdAt } };

    return [patientFilter, queueEntryFilter, outreachFilter, stationFilter, recordedByFilter, severityFilter, createdAt].filter((f) => !!f);
  }
}

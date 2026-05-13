import { EntityRepository, FilterQuery } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { EntityMapper } from 'src/common/mikro-orm.entity-service';
import { CreatePHQ9ScreeningDto } from './dto/create-phq9-screening.dto';
import { PHQ9ScreeningQueryDto } from './dto/query-phq9-screening.dto';
import { UpdatePHQ9ScreeningDto } from './dto/update-phq9-screening.dto';
import { PHQ9Screening } from './entities/phq9-screening.entity';

@Injectable()
export class PHQ9ScreeningsMapper
  implements EntityMapper<PHQ9Screening, CreatePHQ9ScreeningDto, UpdatePHQ9ScreeningDto, PHQ9ScreeningQueryDto>
{
  constructor(
    @InjectRepository(PHQ9Screening)
    private readonly repository: EntityRepository<PHQ9Screening>,
  ) {}

  fromCreateDto(dto: CreatePHQ9ScreeningDto): PHQ9Screening {
    const s = new PHQ9Screening();
    s.id = randomUUID();
    s.q1LittleInterest = dto.q1LittleInterest;
    s.q2Depressed = dto.q2Depressed;
    s.q3SleepProblems = dto.q3SleepProblems;
    s.q4Fatigue = dto.q4Fatigue;
    s.q5Appetite = dto.q5Appetite;
    s.q6Worthlessness = dto.q6Worthlessness;
    s.q7Concentration = dto.q7Concentration;
    s.q8Psychomotor = dto.q8Psychomotor;
    s.q9SelfHarm = dto.q9SelfHarm;
    if (dto.notes) s.notes = dto.notes;
    (s as any).queueEntry = { id: dto.queueEntryId };
    (s as any).patient = { id: dto.patientId };
    (s as any).station = { id: dto.stationId };
    (s as any).outreach = { id: dto.outreachId };
    return s;
  }

  async fromUpdateDto(id: string, dto: UpdatePHQ9ScreeningDto): Promise<PHQ9Screening | null> {
    const entity = await this.repository.findOne({ id });
    if (!entity) return null;
    return this.repository.assign(entity, this.entityFromDto(dto));
  }

  entityFromDto(dto: UpdatePHQ9ScreeningDto) {
    const patch: Partial<PHQ9Screening> = {};
    if (dto.q1LittleInterest !== undefined) patch.q1LittleInterest = dto.q1LittleInterest;
    if (dto.q2Depressed !== undefined) patch.q2Depressed = dto.q2Depressed;
    if (dto.q3SleepProblems !== undefined) patch.q3SleepProblems = dto.q3SleepProblems;
    if (dto.q4Fatigue !== undefined) patch.q4Fatigue = dto.q4Fatigue;
    if (dto.q5Appetite !== undefined) patch.q5Appetite = dto.q5Appetite;
    if (dto.q6Worthlessness !== undefined) patch.q6Worthlessness = dto.q6Worthlessness;
    if (dto.q7Concentration !== undefined) patch.q7Concentration = dto.q7Concentration;
    if (dto.q8Psychomotor !== undefined) patch.q8Psychomotor = dto.q8Psychomotor;
    if (dto.q9SelfHarm !== undefined) patch.q9SelfHarm = dto.q9SelfHarm;
    if (dto.notes !== undefined) patch.notes = dto.notes;
    return patch;
  }

  filtersFromQueryDto(query: PHQ9ScreeningQueryDto): FilterQuery<PHQ9Screening>[] {
    const patientFilter: FilterQuery<PHQ9Screening> = query.patientId && { patient: { id: query.patientId } };
    const queueEntryFilter: FilterQuery<PHQ9Screening> = query.queueEntryId && { queueEntry: { id: query.queueEntryId } };
    const outreachFilter: FilterQuery<PHQ9Screening> = query.outreachId && { outreach: { id: query.outreachId } };
    const stationFilter: FilterQuery<PHQ9Screening> = query.stationId && { station: { id: query.stationId } };
    const recordedByFilter: FilterQuery<PHQ9Screening> = query.recordedById && { recordedBy: { id: query.recordedById } };
    const severityFilter: FilterQuery<PHQ9Screening> = query.severity && { severity: query.severity };
    const createdAt: FilterQuery<PHQ9Screening> = query.createdAt && { createdAt: { $lt: query.createdAt } };

    return [patientFilter, queueEntryFilter, outreachFilter, stationFilter, recordedByFilter, severityFilter, createdAt].filter((f) => !!f);
  }
}

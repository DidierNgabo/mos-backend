import { EntityRepository, FilterQuery } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { EntityMapper } from 'src/common/mikro-orm.entity-service';
import { CreateLabResultDto } from './dto/create-lab-result.dto';
import { LabResultQueryDto } from './dto/query-lab-result.dto';
import { UpdateLabResultDto } from './dto/update-lab-result.dto';
import { LabResult } from './entities/lab-result.entity';

@Injectable()
export class LabResultsMapper
  implements EntityMapper<LabResult, CreateLabResultDto, UpdateLabResultDto, LabResultQueryDto>
{
  constructor(
    @InjectRepository(LabResult)
    private readonly repository: EntityRepository<LabResult>,
  ) {}

  fromCreateDto(dto: CreateLabResultDto): LabResult {
    const lr = new LabResult();
    lr.id = randomUUID();
    lr.testType = dto.testType;
    lr.resultValue = dto.resultValue;
    if (dto.resultUnit) lr.resultUnit = dto.resultUnit;
    if (dto.isAbnormal !== undefined) lr.isAbnormal = dto.isAbnormal;
    if (dto.notes) lr.notes = dto.notes;
    (lr as any).queueEntry = { id: dto.queueEntryId };
    (lr as any).patient = { id: dto.patientId };
    (lr as any).station = { id: dto.stationId };
    (lr as any).outreach = { id: dto.outreachId };
    return lr;
  }

  async fromUpdateDto(id: string, dto: UpdateLabResultDto): Promise<LabResult | null> {
    const entity = await this.repository.findOne({ id });
    if (!entity) return null;
    return this.repository.assign(entity, this.entityFromDto(dto));
  }

  entityFromDto(dto: UpdateLabResultDto) {
    const patch: Partial<LabResult> = {};
    if (dto.testType !== undefined) patch.testType = dto.testType;
    if (dto.resultValue !== undefined) patch.resultValue = dto.resultValue;
    if (dto.resultUnit !== undefined) patch.resultUnit = dto.resultUnit;
    if (dto.isAbnormal !== undefined) patch.isAbnormal = dto.isAbnormal;
    if (dto.notes !== undefined) patch.notes = dto.notes;
    return patch;
  }

  filtersFromQueryDto(query: LabResultQueryDto): FilterQuery<LabResult>[] {
    const patientFilter: FilterQuery<LabResult> = query.patientId && { patient: { id: query.patientId } };
    const queueEntryFilter: FilterQuery<LabResult> = query.queueEntryId && { queueEntry: { id: query.queueEntryId } };
    const outreachFilter: FilterQuery<LabResult> = query.outreachId && { outreach: { id: query.outreachId } };
    const stationFilter: FilterQuery<LabResult> = query.stationId && { station: { id: query.stationId } };
    const testTypeFilter: FilterQuery<LabResult> = query.testType && { testType: query.testType };
    const createdAt: FilterQuery<LabResult> = query.createdAt && { createdAt: { $lt: query.createdAt } };
    const globalSearch: FilterQuery<LabResult> = query.search && {
      $or: [
        { resultValue: { $ilike: '%' + query.search + '%' } },
        { notes: { $ilike: '%' + query.search + '%' } },
      ],
    };

    return [
      patientFilter, queueEntryFilter, outreachFilter, stationFilter,
      testTypeFilter, createdAt, globalSearch,
    ].filter((f) => !!f);
  }
}

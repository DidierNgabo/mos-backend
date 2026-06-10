import { EntityRepository, FilterQuery } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { EntityMapper } from 'src/common/mikro-orm.entity-service';
import { CreateEvangelismRecordDto } from './dto/create-evangelism-record.dto';
import { EvangelismRecordQueryDto } from './dto/query-evangelism-record.dto';
import { UpdateEvangelismRecordDto } from './dto/update-evangelism-record.dto';
import { EvangelismRecord } from './entities/evangelism-record.entity';

@Injectable()
export class EvangelismMapper
  implements
    EntityMapper<
      EvangelismRecord,
      CreateEvangelismRecordDto,
      UpdateEvangelismRecordDto,
      EvangelismRecordQueryDto
    >
{
  constructor(
    @InjectRepository(EvangelismRecord)
    private readonly repository: EntityRepository<EvangelismRecord>,
  ) {}

  fromCreateDto(dto: CreateEvangelismRecordDto): EvangelismRecord {
    const record = new EvangelismRecord();
    record.id = randomUUID();
    record.name = dto.name;
    if (dto.healingRequest !== undefined)
      record.healingRequest = dto.healingRequest;
    if (dto.sinsToConfess !== undefined)
      record.sinsToConfess = dto.sinsToConfess;
    if (dto.isSaved !== undefined) record.isSaved = dto.isSaved;
    if (dto.acceptedJesus !== undefined)
      record.acceptedJesus = dto.acceptedJesus;
    if (dto.continueTheJourney !== undefined)
      record.continueTheJourney = dto.continueTheJourney;
    if (dto.followUp !== undefined) record.followUp = dto.followUp;
    if (dto.notSure !== undefined) record.notSure = dto.notSure;
    if (dto.declined !== undefined) record.declined = dto.declined;
    if (dto.prayerRequest !== undefined)
      record.prayerRequest = dto.prayerRequest;
    (record as any).outreach = { id: dto.outreachId };
    record.patient = dto.patientId ? ({ id: dto.patientId } as any) : null;
    return record;
  }

  async fromUpdateDto(
    id: string,
    dto: UpdateEvangelismRecordDto,
  ): Promise<EvangelismRecord | null> {
    const entity = await this.repository.findOne({ id });
    if (!entity) return null;
    return this.repository.assign(entity, this.entityFromDto(dto));
  }

  entityFromDto(dto: UpdateEvangelismRecordDto) {
    const patch: Partial<EvangelismRecord> = {};
    if (dto.name !== undefined) patch.name = dto.name;
    if (dto.healingRequest !== undefined)
      patch.healingRequest = dto.healingRequest;
    if (dto.sinsToConfess !== undefined)
      patch.sinsToConfess = dto.sinsToConfess;
    if (dto.isSaved !== undefined) patch.isSaved = dto.isSaved;
    if (dto.acceptedJesus !== undefined)
      patch.acceptedJesus = dto.acceptedJesus;
    if (dto.continueTheJourney !== undefined)
      patch.continueTheJourney = dto.continueTheJourney;
    if (dto.followUp !== undefined) patch.followUp = dto.followUp;
    if (dto.notSure !== undefined) patch.notSure = dto.notSure;
    if (dto.declined !== undefined) patch.declined = dto.declined;
    if (dto.prayerRequest !== undefined)
      patch.prayerRequest = dto.prayerRequest;
    if (dto.outreachId !== undefined)
      (patch as any).outreach = { id: dto.outreachId };
    if (dto.patientId !== undefined)
      patch.patient = dto.patientId ? ({ id: dto.patientId } as any) : null;
    return patch;
  }

  filtersFromQueryDto(
    query: EvangelismRecordQueryDto,
  ): FilterQuery<EvangelismRecord>[] {
    const outreachFilter: FilterQuery<EvangelismRecord> = query.outreachId && {
      outreach: { id: query.outreachId },
    };
    const patientFilter: FilterQuery<EvangelismRecord> = query.patientId && {
      patient: { id: query.patientId },
    };
    const doneByFilter: FilterQuery<EvangelismRecord> = query.doneById && {
      doneBy: { id: query.doneById },
    };
    const isSavedFilter: FilterQuery<EvangelismRecord> =
      query.isSaved !== undefined && { isSaved: query.isSaved };
    const acceptedJesusFilter: FilterQuery<EvangelismRecord> =
      query.acceptedJesus !== undefined && {
        acceptedJesus: query.acceptedJesus,
      };
    const continueTheJourneyFilter: FilterQuery<EvangelismRecord> =
      query.continueTheJourney !== undefined && {
        continueTheJourney: query.continueTheJourney,
      };
    const followUpFilter: FilterQuery<EvangelismRecord> =
      query.followUp !== undefined && { followUp: query.followUp };
    const notSureFilter: FilterQuery<EvangelismRecord> =
      query.notSure !== undefined && { notSure: query.notSure };
    const declinedFilter: FilterQuery<EvangelismRecord> =
      query.declined !== undefined && { declined: query.declined };
    const createdAt: FilterQuery<EvangelismRecord> = query.createdAt && {
      createdAt: { $lt: query.createdAt },
    };
    const updatedAt: FilterQuery<EvangelismRecord> = query.updatedAt && {
      updatedAt: { $lt: query.updatedAt },
    };

    const globalSearch: FilterQuery<EvangelismRecord> = query.search && {
      $or: [
        { name: { $ilike: '%' + query.search + '%' } },
        { healingRequest: { $ilike: '%' + query.search + '%' } },
        { sinsToConfess: { $ilike: '%' + query.search + '%' } },
        { prayerRequest: { $ilike: '%' + query.search + '%' } },
      ],
    };

    return [
      outreachFilter,
      patientFilter,
      doneByFilter,
      isSavedFilter,
      acceptedJesusFilter,
      continueTheJourneyFilter,
      followUpFilter,
      notSureFilter,
      declinedFilter,
      createdAt,
      updatedAt,
      globalSearch,
    ].filter((f) => !!f);
  }
}

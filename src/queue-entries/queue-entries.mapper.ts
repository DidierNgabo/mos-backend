import { EntityRepository, FilterQuery } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { EntityMapper } from 'src/common/mikro-orm.entity-service';
import { CreateQueueEntryDto } from './dto/create-queue-entry.dto';
import { QueueEntryQueryDto } from './dto/query-queue-entry.dto';
import { UpdateQueueEntryDto } from './dto/update-queue-entry.dto';
import { QueueEntry } from './entities/queue-entry.entity';

@Injectable()
export class QueueEntriesMapper implements EntityMapper<
  QueueEntry,
  CreateQueueEntryDto,
  UpdateQueueEntryDto,
  QueueEntryQueryDto
> {
  constructor(
    @InjectRepository(QueueEntry)
    private readonly repository: EntityRepository<QueueEntry>,
  ) {}

  fromCreateDto(dto: CreateQueueEntryDto): QueueEntry {
    const entry = new QueueEntry();
    entry.id = randomUUID();
    if (dto.priority) entry.priority = dto.priority;
    if (dto.chiefComplaint) entry.chiefComplaint = dto.chiefComplaint;
    (entry as any).patient = { id: dto.patientId };
    (entry as any).outreach = { id: dto.outreachId };
    if (dto.currentStationId)
      (entry as any).currentStation = { id: dto.currentStationId };
    return entry;
  }

  async fromUpdateDto(
    id: string,
    dto: UpdateQueueEntryDto,
  ): Promise<QueueEntry | null> {
    const entity = await this.repository.findOne({ id });
    if (!entity) return null;
    const mapped = this.entityFromDto(dto);
    return this.repository.assign(entity, mapped);
  }

  entityFromDto(dto: UpdateQueueEntryDto) {
    const patch: Partial<QueueEntry> = {};
    if (dto.priority !== undefined) patch.priority = dto.priority;
    if (dto.chiefComplaint !== undefined)
      patch.chiefComplaint = dto.chiefComplaint;
    if (dto.patientId !== undefined)
      (patch as any).patient = { id: dto.patientId };
    if (dto.outreachId !== undefined)
      (patch as any).outreach = { id: dto.outreachId };
    if (dto.currentStationId !== undefined)
      (patch as any).currentStation = { id: dto.currentStationId };
    return patch;
  }

  filtersFromQueryDto(query: QueueEntryQueryDto): FilterQuery<QueueEntry>[] {
    const search = query.search?.trim();
    const patientFilter: FilterQuery<QueueEntry> = query.patientId && {
      patient: { id: query.patientId },
    };
    const outreachFilter: FilterQuery<QueueEntry> = query.outreachId && {
      outreach: { id: query.outreachId },
    };
    const stationFilter: FilterQuery<QueueEntry> = query.currentStationId && {
      currentStation: { id: query.currentStationId },
    };
    const stationsFilter: FilterQuery<QueueEntry> = query.currentStationIds
      ?.length && {
      currentStation: { id: { $in: query.currentStationIds } },
    };
    const statusFilter: FilterQuery<QueueEntry> = query.status && {
      status: query.status,
    };
    const priorityFilter: FilterQuery<QueueEntry> = query.priority && {
      priority: query.priority,
    };
    const createdAt: FilterQuery<QueueEntry> = query.createdAt && {
      createdAt: { $lt: query.createdAt },
    };
    const updatedAt: FilterQuery<QueueEntry> = query.updatedAt && {
      updatedAt: { $lt: query.updatedAt },
    };
    const globalSearch: FilterQuery<QueueEntry> = search && {
      $or: [
        { patient: { firstName: { $ilike: `%${search}%` } } },
        { patient: { lastName: { $ilike: `%${search}%` } } },
        { patient: { registrationNumber: { $ilike: `%${search}%` } } },
        { chiefComplaint: { $ilike: `%${search}%` } },
        {
          $and: search.split(/\s+/).map((part) => ({
            $or: [
              { patient: { firstName: { $ilike: `%${part}%` } } },
              { patient: { lastName: { $ilike: `%${part}%` } } },
            ],
          })),
        },
      ],
    };

    return [
      patientFilter,
      outreachFilter,
      stationFilter,
      stationsFilter,
      statusFilter,
      priorityFilter,
      createdAt,
      updatedAt,
      globalSearch,
    ].filter((f) => !!f);
  }
}

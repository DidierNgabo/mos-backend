import { EntityRepository, FilterQuery } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { EntityMapper } from 'src/common/mikro-orm.entity-service';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { TransferQueryDto } from './dto/query-transfer.dto';
import { UpdateTransferDto } from './dto/update-transfer.dto';
import { Transfer } from './entities/transfer.entity';

@Injectable()
export class TransfersMapper
  implements EntityMapper<Transfer, CreateTransferDto, UpdateTransferDto, TransferQueryDto>
{
  constructor(
    @InjectRepository(Transfer)
    private readonly repository: EntityRepository<Transfer>,
  ) {}

  fromCreateDto(dto: CreateTransferDto): Transfer {
    const t = new Transfer();
    t.id = randomUUID();
    t.transferReason = dto.transferReason;
    t.referredToFacility = dto.referredToFacility;
    t.referredService = dto.referredService;
    if (dto.urgency) t.urgency = dto.urgency;
    if (dto.transportArranged !== undefined) t.transportArranged = dto.transportArranged;
    if (dto.notes) t.notes = dto.notes;
    (t as any).patient = { id: dto.patientId };
    (t as any).outreach = { id: dto.outreachId };
    if (dto.queueEntryId) (t as any).queueEntry = { id: dto.queueEntryId };
    return t;
  }

  async fromUpdateDto(id: string, dto: UpdateTransferDto): Promise<Transfer | null> {
    const entity = await this.repository.findOne({ id });
    if (!entity) return null;
    return this.repository.assign(entity, this.entityFromDto(dto));
  }

  entityFromDto(dto: UpdateTransferDto) {
    const patch: Partial<Transfer> = {};
    if (dto.transferReason !== undefined) patch.transferReason = dto.transferReason;
    if (dto.referredToFacility !== undefined) patch.referredToFacility = dto.referredToFacility;
    if (dto.referredService !== undefined) patch.referredService = dto.referredService;
    if (dto.urgency !== undefined) patch.urgency = dto.urgency;
    if (dto.transportArranged !== undefined) patch.transportArranged = dto.transportArranged;
    if (dto.notes !== undefined) patch.notes = dto.notes;
    return patch;
  }

  filtersFromQueryDto(query: TransferQueryDto): FilterQuery<Transfer>[] {
    const patientFilter: FilterQuery<Transfer> = query.patientId && { patient: { id: query.patientId } };
    const queueEntryFilter: FilterQuery<Transfer> = query.queueEntryId && { queueEntry: { id: query.queueEntryId } };
    const outreachFilter: FilterQuery<Transfer> = query.outreachId && { outreach: { id: query.outreachId } };
    const initiatedByFilter: FilterQuery<Transfer> = query.initiatedById && { initiatedBy: { id: query.initiatedById } };
    const urgencyFilter: FilterQuery<Transfer> = query.urgency && { urgency: query.urgency };
    const createdAt: FilterQuery<Transfer> = query.createdAt && { createdAt: { $lt: query.createdAt } };

    return [patientFilter, queueEntryFilter, outreachFilter, initiatedByFilter, urgencyFilter, createdAt].filter((f) => !!f);
  }
}

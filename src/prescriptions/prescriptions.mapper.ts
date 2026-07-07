import { FilterQuery } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { EntityMapper } from 'src/common/mikro-orm.entity-service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { PrescriptionQueryDto } from './dto/query-prescription.dto';
import { UpdatePrescriptionDto } from './dto/update-prescription.dto';
import { Prescription } from './entities/prescription.entity';

@Injectable()
export class PrescriptionsMapper
  implements EntityMapper<Prescription, CreatePrescriptionDto, UpdatePrescriptionDto, PrescriptionQueryDto>
{
  constructor(
    @InjectRepository(Prescription)
    private readonly repository: EntityRepository<Prescription>,
  ) {}

  fromCreateDto(dto: CreatePrescriptionDto): Prescription {
    const p = new Prescription();
    p.dosage = dto.dosage;
    p.quantity = dto.quantity;
    if (dto.instructions) p.instructions = dto.instructions;
    (p as any).queueEntry = { id: dto.queueEntryId };
    (p as any).patient = { id: dto.patientId };
    (p as any).outreach = { id: dto.outreachId };
    if (dto.pharmacyStockId) (p as any).pharmacyStock = { id: dto.pharmacyStockId };
    if (dto.customMedicationName) p.customMedicationName = dto.customMedicationName;
    return p;
  }

  async fromUpdateDto(id: string, dto: UpdatePrescriptionDto): Promise<Prescription | null> {
    const entity = await this.repository.findOne({ id });
    if (!entity) return null;
    return this.repository.assign(entity, this.entityFromDto(dto));
  }

  entityFromDto(dto: UpdatePrescriptionDto) {
    const patch: Partial<Prescription> = {};
    if (dto.dosage !== undefined) patch.dosage = dto.dosage;
    if (dto.quantity !== undefined) patch.quantity = dto.quantity;
    if (dto.instructions !== undefined) patch.instructions = dto.instructions;
    return patch;
  }

  filtersFromQueryDto(query: PrescriptionQueryDto): FilterQuery<Prescription>[] {
    const queueEntryFilter: FilterQuery<Prescription> = query.queueEntryId && { queueEntry: { id: query.queueEntryId } };
    const patientFilter: FilterQuery<Prescription> = query.patientId && { patient: { id: query.patientId } };
    const outreachFilter: FilterQuery<Prescription> = query.outreachId && { outreach: { id: query.outreachId } };
    const stockFilter: FilterQuery<Prescription> = query.pharmacyStockId && { pharmacyStock: { id: query.pharmacyStockId } };
    const prescribedByFilter: FilterQuery<Prescription> = query.prescribedById && { prescribedBy: { id: query.prescribedById } };
    const statusFilter: FilterQuery<Prescription> = query.status && { status: query.status };

    return [
      queueEntryFilter, patientFilter, outreachFilter, stockFilter, prescribedByFilter, statusFilter,
    ].filter((f) => !!f);
  }
}

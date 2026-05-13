import { EntityRepository, FilterQuery } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { EntityMapper } from 'src/common/mikro-orm.entity-service';
import { CreatePCL5ScreeningDto } from './dto/create-pcl5-screening.dto';
import { PCL5ScreeningQueryDto } from './dto/query-pcl5-screening.dto';
import { UpdatePCL5ScreeningDto } from './dto/update-pcl5-screening.dto';
import { PCL5Screening } from './entities/pcl5-screening.entity';

@Injectable()
export class PCL5ScreeningsMapper
  implements EntityMapper<PCL5Screening, CreatePCL5ScreeningDto, UpdatePCL5ScreeningDto, PCL5ScreeningQueryDto>
{
  constructor(
    @InjectRepository(PCL5Screening)
    private readonly repository: EntityRepository<PCL5Screening>,
  ) {}

  fromCreateDto(dto: CreatePCL5ScreeningDto): PCL5Screening {
    const s = new PCL5Screening();
    s.id = randomUUID();
    if (dto.initialOfParticipant) s.initialOfParticipant = dto.initialOfParticipant;
    if (dto.maritalStatus) s.maritalStatus = dto.maritalStatus;
    if (dto.educationLevel) s.educationLevel = dto.educationLevel;
    if (dto.occupation) s.occupation = dto.occupation;
    if (dto.division) s.division = dto.division;
    if (dto.locationType) s.locationType = dto.locationType;
    if (dto.religion) s.religion = dto.religion;
    s.q1 = dto.q1; s.q2 = dto.q2; s.q3 = dto.q3; s.q4 = dto.q4; s.q5 = dto.q5;
    s.q6 = dto.q6; s.q7 = dto.q7; s.q8 = dto.q8; s.q9 = dto.q9; s.q10 = dto.q10;
    s.q11 = dto.q11; s.q12 = dto.q12; s.q13 = dto.q13; s.q14 = dto.q14; s.q15 = dto.q15;
    s.q16 = dto.q16; s.q17 = dto.q17; s.q18 = dto.q18; s.q19 = dto.q19; s.q20 = dto.q20;
    if (dto.notes) s.notes = dto.notes;
    (s as any).queueEntry = { id: dto.queueEntryId };
    (s as any).patient = { id: dto.patientId };
    (s as any).station = { id: dto.stationId };
    (s as any).outreach = { id: dto.outreachId };
    return s;
  }

  async fromUpdateDto(id: string, dto: UpdatePCL5ScreeningDto): Promise<PCL5Screening | null> {
    const entity = await this.repository.findOne({ id });
    if (!entity) return null;
    return this.repository.assign(entity, this.entityFromDto(dto));
  }

  entityFromDto(dto: UpdatePCL5ScreeningDto) {
    const patch: Partial<PCL5Screening> = {};
    if (dto.initialOfParticipant !== undefined) patch.initialOfParticipant = dto.initialOfParticipant;
    if (dto.maritalStatus !== undefined) patch.maritalStatus = dto.maritalStatus;
    if (dto.educationLevel !== undefined) patch.educationLevel = dto.educationLevel;
    if (dto.occupation !== undefined) patch.occupation = dto.occupation;
    if (dto.division !== undefined) patch.division = dto.division;
    if (dto.locationType !== undefined) patch.locationType = dto.locationType;
    if (dto.religion !== undefined) patch.religion = dto.religion;
    for (let i = 1; i <= 20; i++) {
      const key = `q${i}` as keyof PCL5Screening;
      if ((dto as any)[key] !== undefined) (patch as any)[key] = (dto as any)[key];
    }
    if (dto.notes !== undefined) patch.notes = dto.notes;
    return patch;
  }

  filtersFromQueryDto(query: PCL5ScreeningQueryDto): FilterQuery<PCL5Screening>[] {
    const patientFilter: FilterQuery<PCL5Screening> = query.patientId && { patient: { id: query.patientId } };
    const queueEntryFilter: FilterQuery<PCL5Screening> = query.queueEntryId && { queueEntry: { id: query.queueEntryId } };
    const outreachFilter: FilterQuery<PCL5Screening> = query.outreachId && { outreach: { id: query.outreachId } };
    const stationFilter: FilterQuery<PCL5Screening> = query.stationId && { station: { id: query.stationId } };
    const recordedByFilter: FilterQuery<PCL5Screening> = query.recordedById && { recordedBy: { id: query.recordedById } };
    const severityFilter: FilterQuery<PCL5Screening> = query.severity && { severity: query.severity };
    const createdAt: FilterQuery<PCL5Screening> = query.createdAt && { createdAt: { $lt: query.createdAt } };

    return [patientFilter, queueEntryFilter, outreachFilter, stationFilter, recordedByFilter, severityFilter, createdAt].filter((f) => !!f);
  }
}

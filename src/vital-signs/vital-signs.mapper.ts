import { EntityRepository, FilterQuery } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import { EntityMapper } from 'src/common/mikro-orm.entity-service';
import { CreateVitalSignDto } from './dto/create-vital-sign.dto';
import { VitalSignQueryDto } from './dto/query-vital-sign.dto';
import { UpdateVitalSignDto } from './dto/update-vital-sign.dto';
import { VitalSign } from './entities/vital-sign.entity';

@Injectable()
export class VitalSignMapper
  implements
    EntityMapper<VitalSign, CreateVitalSignDto, UpdateVitalSignDto, VitalSignQueryDto>
{
  constructor(
    @InjectRepository(VitalSign)
    private readonly repository: EntityRepository<VitalSign>,
  ) {}

  fromCreateDto(dto: CreateVitalSignDto): VitalSign {
    const { patientId: _patientId, stationId: _stationId, ...rest } = dto;
    return Object.assign(new VitalSign(), rest);
  }

  async fromUpdateDto(id: string, dto: UpdateVitalSignDto): Promise<VitalSign | null> {
    const vs = await this.repository.findOne({ id });
    if (!vs) return null;

    const { patientId: _patientId, stationId: _stationId, ...rest } = dto;
    this.repository.assign(vs, rest as Partial<VitalSign>);

    if (dto.weight !== undefined || dto.height !== undefined) {
      const newWeight = dto.weight ?? vs.weight;
      const newHeight = dto.height ?? vs.height;
      if (newWeight != null && newHeight != null) {
        vs.bmi = parseFloat((newWeight / Math.pow(newHeight / 100, 2)).toFixed(2));
      } else {
        vs.bmi = null;
      }
    }

    return vs;
  }

  entityFromDto(dto: UpdateVitalSignDto): VitalSign {
    const { patientId: _patientId, stationId: _stationId, ...rest } = dto;
    return Object.assign(new VitalSign(), rest);
  }

  filtersFromQueryDto(query: VitalSignQueryDto): FilterQuery<VitalSign>[] {
    const patientId: FilterQuery<VitalSign> = query.patientId && {
      patient: { id: query.patientId },
    };
    const stationId: FilterQuery<VitalSign> = query.stationId && {
      station: { id: query.stationId },
    };
    const outreachId: FilterQuery<VitalSign> = query.outreachId && {
      outreach: { id: query.outreachId },
    };
    const recordedById: FilterQuery<VitalSign> = query.recordedById && {
      recordedBy: { id: query.recordedById },
    };
    const createdAt: FilterQuery<VitalSign> = query.createdAt && {
      createdAt: { $lt: query.createdAt },
    };

    return [patientId, stationId, outreachId, recordedById, createdAt].filter(
      (f) => !!f,
    );
  }
}

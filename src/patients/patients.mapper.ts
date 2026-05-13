import { EntityRepository, FilterQuery } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import { EntityMapper } from 'src/common/mikro-orm.entity-service';
import { Outreach } from 'src/outreaches/entities/outreach.entity';
import { CreatePatientDto } from './dto/create-patient.dto';
import { PatientQueryDto } from './dto/query-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { Patient } from './entities/patient.entity';

@Injectable()
export class PatientMapper
  implements EntityMapper<Patient, CreatePatientDto, UpdatePatientDto, PatientQueryDto>
{
  constructor(
    @InjectRepository(Patient)
    private readonly repository: EntityRepository<Patient>,
    @InjectRepository(Outreach)
    private readonly outreachRepository: EntityRepository<Outreach>,
  ) {}

  fromCreateDto(dto: CreatePatientDto): Patient {
    const { outreachId: _outreachId, dateOfBirth, ...rest } = dto;
    return Object.assign(new Patient(), {
      ...rest,
      dateOfBirth: new Date(dateOfBirth),
    });
  }

  async fromUpdateDto(id: string, dto: UpdatePatientDto): Promise<Patient | null> {
    const patient = await this.repository.findOne({ id });
    if (!patient) return null;

    const { outreachId, dateOfBirth, ...rest } = dto;
    this.repository.assign(patient, {
      ...rest,
      ...(dateOfBirth ? { dateOfBirth: new Date(dateOfBirth) } : {}),
    });

    if (outreachId !== undefined) {
      const outreach = await this.outreachRepository.findOne({ id: outreachId });
      if (outreach) patient.outreach = outreach;
    }

    return patient;
  }

  entityFromDto(dto: UpdatePatientDto): Patient {
    const { outreachId: _outreachId, dateOfBirth, ...rest } = dto;
    return Object.assign(new Patient(), {
      ...rest,
      ...(dateOfBirth ? { dateOfBirth: new Date(dateOfBirth) } : {}),
    });
  }

  filtersFromQueryDto(query: PatientQueryDto): FilterQuery<Patient>[] {
    const registrationNumber: FilterQuery<Patient> = query.registrationNumber && {
      registrationNumber: { $ilike: '%' + query.registrationNumber + '%' },
    };
    const outreachId: FilterQuery<Patient> = query.outreachId && {
      outreach: { id: query.outreachId },
    };
    const gender: FilterQuery<Patient> = query.gender && { gender: query.gender };
    const registeredById: FilterQuery<Patient> = query.registeredById && {
      registeredBy: { id: query.registeredById },
    };
    const province: FilterQuery<Patient> = query.province && {
      province: { $ilike: '%' + query.province + '%' },
    };
    const district: FilterQuery<Patient> = query.district && {
      district: { $ilike: '%' + query.district + '%' },
    };
    const sector: FilterQuery<Patient> = query.sector && {
      sector: { $ilike: '%' + query.sector + '%' },
    };
    const cell: FilterQuery<Patient> = query.cell && {
      cell: { $ilike: '%' + query.cell + '%' },
    };
    const village: FilterQuery<Patient> = query.village && {
      village: { $ilike: '%' + query.village + '%' },
    };
    const createdAt: FilterQuery<Patient> = query.createdAt && {
      createdAt: { $lt: query.createdAt },
    };
    const globalSearch: FilterQuery<Patient> = query.search && {
      $or: [
        { firstName: { $ilike: '%' + query.search + '%' } },
        { lastName: { $ilike: '%' + query.search + '%' } },
        { registrationNumber: { $ilike: '%' + query.search + '%' } },
      ],
    };

    return [
      registrationNumber,
      outreachId,
      gender,
      registeredById,
      province,
      district,
      sector,
      cell,
      village,
      createdAt,
      globalSearch,
    ].filter((f) => !!f);
  }
}

import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/postgresql';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { subject } from '@casl/ability';
import { randomUUID } from 'crypto';
import { MikroOrmEntityService } from 'src/common/mikro-orm.entity-service';
import { Action } from 'src/auth/casl/ability.types';
import { AppAbility } from 'src/auth/casl/ability.types';
import { Outreach } from 'src/outreaches/entities/outreach.entity';
import { User } from 'src/users/entities/user.entity';
import { CreatePatientDto } from './dto/create-patient.dto';
import { PatientQueryDto } from './dto/query-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import {
  DEFAULT_PROJECTION,
  Patient,
  PatientProjection,
} from './entities/patient.entity';
import { PatientMapper } from './patients.mapper';

@Injectable()
export class PatientsService extends MikroOrmEntityService<
  Patient,
  CreatePatientDto,
  UpdatePatientDto,
  PatientQueryDto,
  PatientProjection
> {
  constructor(
    private readonly patientMapper: PatientMapper,
    @InjectRepository(Patient)
    repository: EntityRepository<Patient>,
    entityManager: EntityManager,
    @InjectRepository(Outreach)
    private readonly outreachRepository: EntityRepository<Outreach>,
    @InjectRepository(User)
    private readonly userRepository: EntityRepository<User>,
  ) {
    super(patientMapper, repository, entityManager, DEFAULT_PROJECTION);
  }

  async createPatient(
    dto: CreatePatientDto,
    registeredById: string,
    ability: AppAbility,
  ): Promise<Patient> {
    const outreach = await this.outreachRepository.findOne({ id: dto.outreachId });
    if (!outreach) throw new BadRequestException('Outreach not found');

    if (!ability.can(Action.Create, subject('Patient', { outreach: { id: outreach.id } } as any))) {
      throw new ForbiddenException();
    }

    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const prefix = `ORC-${yy}${mm}-`;
    const count = await this.repository.count({
      registrationNumber: { $like: `${prefix}%` },
    });
    const registrationNumber = `${prefix}${String(count + 1).padStart(5, '0')}`;

    const registeredBy = await this.userRepository.findOne({ id: registeredById });
    if (!registeredBy) throw new BadRequestException('Registrar user not found');

    const patient = this.patientMapper.fromCreateDto(dto);
    patient.id = randomUUID();
    patient.registrationNumber = registrationNumber;
    patient.outreach = outreach;
    patient.registeredBy = registeredBy;

    try {
      await this.entityManager.persist(patient).flush();
    } catch (error) {
      this.handleDatabaseConstraintError(error, false);
    }

    return this.find(patient.id) as Promise<Patient>;
  }
}

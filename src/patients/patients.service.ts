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
import { QueueEntry } from 'src/queue-entries/entities/queue-entry.entity';
import { StationVisit } from 'src/queue-entries/entities/station-visit.entity';
import { Station } from 'src/stations/entities/station.entity';
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
    @InjectRepository(Station)
    private readonly stationRepository: EntityRepository<Station>,
    @InjectRepository(QueueEntry)
    private readonly queueEntryRepository: EntityRepository<QueueEntry>,
    @InjectRepository(StationVisit)
    private readonly stationVisitRepository: EntityRepository<StationVisit>,
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

    const registeredBy = await this.userRepository.findOne({ id: registeredById });
    if (!registeredBy) throw new BadRequestException('Registrar user not found');

    const triageStation = await this.stationRepository.findOne({
      name: 'Triage',
      outreach: { id: outreach.id },
    });

    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const prefix = `ORC-${yy}${mm}-`;

    // nextval() from a PostgreSQL sequence is atomic — guaranteed unique across all
    // concurrent callers. No retry loop needed.
    const registrationNumber = await this.nextRegistrationNumber(prefix);

    const patient = await this.entityManager.transactional(async (em) => {
      const p = this.patientMapper.fromCreateDto(dto);
      p.id = randomUUID();
      p.registrationNumber = registrationNumber;
      p.outreach = em.getReference(Outreach, outreach!.id);
      p.registeredBy = em.getReference(User, registeredBy!.id);
      em.persist(p);

      if (triageStation) {
        const queueEntry = new QueueEntry();
        queueEntry.id = randomUUID();
        queueEntry.patient = p;
        queueEntry.outreach = em.getReference(Outreach, outreach!.id);
        queueEntry.currentStation = em.getReference(Station, triageStation.id);

        const visit = new StationVisit();
        visit.id = randomUUID();
        visit.queueEntry = queueEntry;
        visit.station = em.getReference(Station, triageStation.id);
        visit.movedBy = em.getReference(User, registeredBy!.id);
        visit.arrivedAt = new Date();

        em.persist(queueEntry);
        em.persist(visit);
      }

      return p;
    });

    return this.find(patient.id) as Promise<Patient>;
  }

  private async nextRegistrationNumber(prefix: string): Promise<string> {
    const conn = this.entityManager.getConnection('write');
    const row = await conn.execute<{ n: string }>(
      `SELECT nextval('patient_reg_num_seq') AS n`,
      [],
      'get',
    );
    return `${prefix}${String(Number(row.n)).padStart(5, '0')}`;
  }
}

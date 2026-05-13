import { subject } from '@casl/ability';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/postgresql';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Action, AppAbility } from 'src/auth/casl/ability.types';
import { MikroOrmEntityService } from 'src/common/mikro-orm.entity-service';
import { Outreach } from 'src/outreaches/entities/outreach.entity';
import { Patient } from 'src/patients/entities/patient.entity';
import { Station } from 'src/stations/entities/station.entity';
import { User } from 'src/users/entities/user.entity';
import { CreateVitalSignDto } from './dto/create-vital-sign.dto';
import { VitalSignQueryDto } from './dto/query-vital-sign.dto';
import { UpdateVitalSignDto } from './dto/update-vital-sign.dto';
import {
  DEFAULT_PROJECTION,
  VitalSign,
  VitalSignProjection,
} from './entities/vital-sign.entity';
import { VitalSignMapper } from './vital-signs.mapper';

@Injectable()
export class VitalSignsService extends MikroOrmEntityService<
  VitalSign,
  CreateVitalSignDto,
  UpdateVitalSignDto,
  VitalSignQueryDto,
  VitalSignProjection
> {
  constructor(
    private readonly vitalSignMapper: VitalSignMapper,
    @InjectRepository(VitalSign)
    repository: EntityRepository<VitalSign>,
    entityManager: EntityManager,
    @InjectRepository(Patient)
    private readonly patientRepository: EntityRepository<Patient>,
    @InjectRepository(Station)
    private readonly stationRepository: EntityRepository<Station>,
    @InjectRepository(User)
    private readonly userRepository: EntityRepository<User>,
  ) {
    super(vitalSignMapper, repository, entityManager, DEFAULT_PROJECTION);
  }

  async createVitalSign(
    dto: CreateVitalSignDto,
    recordedById: string,
    ability: AppAbility,
  ): Promise<VitalSign> {
    const patient = await this.patientRepository.findOne(
      { id: dto.patientId },
      { populate: ['outreach'] },
    );
    if (!patient) throw new BadRequestException('Patient not found');

    if (
      !ability.can(
        Action.Create,
        subject('VitalSign', { outreach: { id: patient.outreach.id } } as any),
      )
    ) {
      throw new ForbiddenException();
    }

    const station = await this.stationRepository.findOne({ id: dto.stationId });
    if (!station) throw new BadRequestException('Station not found');

    const recordedBy = await this.userRepository.findOne({ id: recordedById });
    if (!recordedBy) throw new BadRequestException('Recorder user not found');

    const bmi = parseFloat(
      (dto.weight / Math.pow(dto.height / 100, 2)).toFixed(2),
    );

    const vs = this.vitalSignMapper.fromCreateDto(dto);
    vs.id = randomUUID();
    vs.patient = patient;
    vs.station = station;
    vs.outreach = patient.outreach as Outreach;
    vs.recordedBy = recordedBy;
    vs.bmi = bmi;

    try {
      await this.entityManager.persist(vs).flush();
    } catch (error) {
      this.handleDatabaseConstraintError(error, false);
    }

    return this.find(vs.id) as Promise<VitalSign>;
  }
}

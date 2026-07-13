import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/postgresql';
import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { MikroOrmEntityService } from 'src/common/mikro-orm.entity-service';
import { User } from 'src/users/entities/user.entity';
import { CreateObservationDto } from './dto/create-observation.dto';
import { ObservationQueryDto } from './dto/query-observation.dto';
import { UpdateObservationDto } from './dto/update-observation.dto';
import {
  DEFAULT_PROJECTION,
  Observation,
  ObservationProjection,
} from './entities/observation.entity';
import { ObservationsMapper } from './observations.mapper';
import { DiagnosisCatalogService } from './diagnosis-catalog.service';

@Injectable()
export class ObservationsService extends MikroOrmEntityService<
  Observation,
  CreateObservationDto,
  UpdateObservationDto,
  ObservationQueryDto,
  ObservationProjection
> {
  constructor(
    private readonly observationsMapper: ObservationsMapper,
    @InjectRepository(Observation)
    repository: EntityRepository<Observation>,
    entityManager: EntityManager,
    @InjectRepository(User)
    private readonly userRepository: EntityRepository<User>,
    private readonly diagnosisCatalogService: DiagnosisCatalogService,
  ) {
    super(observationsMapper, repository, entityManager, DEFAULT_PROJECTION);
  }

  async createObservation(
    dto: CreateObservationDto,
    recordedById: string,
  ): Promise<Observation> {
    const recordedBy = await this.userRepository.findOne({ id: recordedById });
    if (!recordedBy) throw new BadRequestException('Recorder user not found');

    const normalizedDto = this.normalizeDiagnosis(dto);
    const obs = this.observationsMapper.fromCreateDto(
      normalizedDto,
    ) as Observation;
    obs.id = randomUUID();
    obs.recordedBy = recordedBy;

    try {
      await this.entityManager.persist(obs).flush();
    } catch (error) {
      this.handleDatabaseConstraintError(error, false);
    }

    return this.find(obs.id) as Promise<Observation>;
  }

  findMyObservations(userId: string, query: ObservationQueryDto) {
    query.recordedById = userId;
    return this.findAll(query);
  }

  searchDiagnoses(query: string, limit = 30) {
    return this.diagnosisCatalogService.search(query, limit);
  }

  async update(id: string, dto: UpdateObservationDto) {
    return super.update(id, this.normalizeDiagnosis(dto));
  }

  private normalizeDiagnosis<
    T extends CreateObservationDto | UpdateObservationDto,
  >(dto: T): T {
    if (dto.diagnosisCode) {
      const diagnosis = this.diagnosisCatalogService.findByCode(
        dto.diagnosisCode,
      );
      if (!diagnosis) {
        throw new BadRequestException(
          `Unknown ICD-11 diagnosis code: ${dto.diagnosisCode}`,
        );
      }
      return {
        ...dto,
        diagnosisCode: diagnosis.code,
        diagnosis: diagnosis.title,
      };
    }

    if (dto.diagnosis !== undefined) {
      const diagnosis = dto.diagnosis.trim();
      if (!diagnosis) {
        throw new BadRequestException('Diagnosis is required');
      }
      return { ...dto, diagnosisCode: null, diagnosis };
    }

    return dto;
  }
}

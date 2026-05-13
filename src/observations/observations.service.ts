import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/postgresql';
import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { MikroOrmEntityService } from 'src/common/mikro-orm.entity-service';
import { User } from 'src/users/entities/user.entity';
import { CreateObservationDto } from './dto/create-observation.dto';
import { ObservationQueryDto } from './dto/query-observation.dto';
import { UpdateObservationDto } from './dto/update-observation.dto';
import { DEFAULT_PROJECTION, Observation, ObservationProjection } from './entities/observation.entity';
import { ObservationsMapper } from './observations.mapper';

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
  ) {
    super(observationsMapper, repository, entityManager, DEFAULT_PROJECTION);
  }

  async createObservation(dto: CreateObservationDto, recordedById: string): Promise<Observation> {
    const recordedBy = await this.userRepository.findOne({ id: recordedById });
    if (!recordedBy) throw new BadRequestException('Recorder user not found');

    const obs = this.observationsMapper.fromCreateDto(dto) as Observation;
    obs.id = randomUUID();
    obs.recordedBy = recordedBy;

    try {
      await this.entityManager.persist(obs).flush();
    } catch (error) {
      this.handleDatabaseConstraintError(error, false);
    }

    return this.find(obs.id) as Promise<Observation>;
  }
}

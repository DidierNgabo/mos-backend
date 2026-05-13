import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/postgresql';
import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { MikroOrmEntityService } from 'src/common/mikro-orm.entity-service';
import { User } from 'src/users/entities/user.entity';
import { CreateCommunicableDiseaseDto } from './dto/create-communicable-disease.dto';
import { CommunicableDiseaseQueryDto } from './dto/query-communicable-disease.dto';
import { UpdateCommunicableDiseaseDto } from './dto/update-communicable-disease.dto';
import {
  CommunicableDisease,
  CommunicableDiseaseProjection,
  DEFAULT_PROJECTION,
} from './entities/communicable-disease.entity';
import { CommunicableDiseasesMapper } from './communicable-diseases.mapper';

@Injectable()
export class CommunicableDiseasesService extends MikroOrmEntityService<
  CommunicableDisease,
  CreateCommunicableDiseaseDto,
  UpdateCommunicableDiseaseDto,
  CommunicableDiseaseQueryDto,
  CommunicableDiseaseProjection
> {
  constructor(
    private readonly communicableDiseasesMapper: CommunicableDiseasesMapper,
    @InjectRepository(CommunicableDisease)
    repository: EntityRepository<CommunicableDisease>,
    entityManager: EntityManager,
    @InjectRepository(User)
    private readonly userRepository: EntityRepository<User>,
  ) {
    super(communicableDiseasesMapper, repository, entityManager, DEFAULT_PROJECTION);
  }

  async createScreening(dto: CreateCommunicableDiseaseDto, recordedById: string): Promise<CommunicableDisease> {
    const recordedBy = await this.userRepository.findOne({ id: recordedById });
    if (!recordedBy) throw new BadRequestException('Recorder user not found');

    const cd = this.communicableDiseasesMapper.fromCreateDto(dto) as CommunicableDisease;
    cd.id = randomUUID();
    cd.recordedBy = recordedBy;

    try {
      await this.entityManager.persist(cd).flush();
    } catch (error) {
      this.handleDatabaseConstraintError(error, false);
    }

    return this.find(cd.id) as Promise<CommunicableDisease>;
  }
}

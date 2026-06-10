import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/postgresql';
import { BadRequestException, Injectable } from '@nestjs/common';
import { MikroOrmEntityService } from 'src/common/mikro-orm.entity-service';
import { User } from 'src/users/entities/user.entity';
import { CreateEvangelismRecordDto } from './dto/create-evangelism-record.dto';
import { EvangelismRecordQueryDto } from './dto/query-evangelism-record.dto';
import { UpdateEvangelismRecordDto } from './dto/update-evangelism-record.dto';
import { EvangelismMapper } from './evangelism.mapper';
import {
  DEFAULT_PROJECTION,
  EvangelismRecord,
  EvangelismRecordProjection,
} from './entities/evangelism-record.entity';

@Injectable()
export class EvangelismService extends MikroOrmEntityService<
  EvangelismRecord,
  CreateEvangelismRecordDto,
  UpdateEvangelismRecordDto,
  EvangelismRecordQueryDto,
  EvangelismRecordProjection
> {
  constructor(
    private readonly evangelismMapper: EvangelismMapper,
    @InjectRepository(EvangelismRecord)
    repository: EntityRepository<EvangelismRecord>,
    entityManager: EntityManager,
    @InjectRepository(User)
    private readonly userRepository: EntityRepository<User>,
  ) {
    super(evangelismMapper, repository, entityManager, DEFAULT_PROJECTION);
  }

  async createRecord(
    dto: CreateEvangelismRecordDto,
    doneById: string,
  ): Promise<EvangelismRecord> {
    const doneBy = await this.userRepository.findOne({ id: doneById });
    if (!doneBy) throw new BadRequestException('User not found');

    const record = await Promise.resolve(this.evangelismMapper.fromCreateDto(dto));
    record.doneBy = doneBy;

    try {
      await this.entityManager.persist(record).flush();
    } catch (error) {
      this.handleDatabaseConstraintError(error, false);
    }

    return this.find(record.id) as Promise<EvangelismRecord>;
  }
}

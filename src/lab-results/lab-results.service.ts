import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/postgresql';
import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { MikroOrmEntityService } from 'src/common/mikro-orm.entity-service';
import { User } from 'src/users/entities/user.entity';
import { BulkCreateLabResultDto } from './dto/bulk-create-lab-result.dto';
import { CreateLabResultDto } from './dto/create-lab-result.dto';
import { LabResultQueryDto } from './dto/query-lab-result.dto';
import { UpdateLabResultDto } from './dto/update-lab-result.dto';
import { DEFAULT_PROJECTION, LabResult, LabResultProjection } from './entities/lab-result.entity';
import { LabResultsMapper } from './lab-results.mapper';

@Injectable()
export class LabResultsService extends MikroOrmEntityService<
  LabResult,
  CreateLabResultDto,
  UpdateLabResultDto,
  LabResultQueryDto,
  LabResultProjection
> {
  constructor(
    private readonly labResultsMapper: LabResultsMapper,
    @InjectRepository(LabResult)
    repository: EntityRepository<LabResult>,
    entityManager: EntityManager,
    @InjectRepository(User)
    private readonly userRepository: EntityRepository<User>,
  ) {
    super(labResultsMapper, repository, entityManager, DEFAULT_PROJECTION);
  }

  async createLabResult(dto: CreateLabResultDto, recordedById: string): Promise<LabResult> {
    const recordedBy = await this.userRepository.findOne({ id: recordedById });
    if (!recordedBy) throw new BadRequestException('Recorder user not found');

    const lr = this.labResultsMapper.fromCreateDto(dto) as LabResult;
    lr.id = randomUUID();
    lr.recordedBy = recordedBy;

    try {
      await this.entityManager.persist(lr).flush();
    } catch (error) {
      this.handleDatabaseConstraintError(error, false);
    }

    return this.find(lr.id) as Promise<LabResult>;
  }

  async createManyLabResults(dto: BulkCreateLabResultDto, recordedById: string): Promise<LabResult[]> {
    const recordedBy = await this.userRepository.findOne({ id: recordedById });
    if (!recordedBy) throw new BadRequestException('Recorder user not found');

    const entities = dto.results.map((item) => {
      const singleDto: CreateLabResultDto = {
        queueEntryId: dto.queueEntryId,
        patientId: dto.patientId,
        stationId: dto.stationId,
        outreachId: dto.outreachId,
        testType: item.testType,
        resultValue: item.resultValue,
        resultUnit: item.resultUnit,
        isAbnormal: item.isAbnormal,
        notes: item.notes,
      };
      const lr = this.labResultsMapper.fromCreateDto(singleDto) as LabResult;
      lr.id = randomUUID();
      lr.recordedBy = recordedBy;
      return lr;
    });

    try {
      await this.entityManager.persist(entities).flush();
    } catch (error) {
      this.handleDatabaseConstraintError(error, false);
    }

    return Promise.all(entities.map((lr) => this.find(lr.id) as Promise<LabResult>));
  }
}

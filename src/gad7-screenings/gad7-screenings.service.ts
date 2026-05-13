import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/postgresql';
import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { MikroOrmEntityService } from 'src/common/mikro-orm.entity-service';
import { User } from 'src/users/entities/user.entity';
import { CreateGAD7ScreeningDto } from './dto/create-gad7-screening.dto';
import { GAD7ScreeningQueryDto } from './dto/query-gad7-screening.dto';
import { UpdateGAD7ScreeningDto } from './dto/update-gad7-screening.dto';
import { DEFAULT_PROJECTION, GAD7Projection, GAD7Screening, GAD7Severity } from './entities/gad7-screening.entity';
import { GAD7ScreeningsMapper } from './gad7-screenings.mapper';

function computeGAD7Severity(total: number): GAD7Severity {
  if (total <= 4) return GAD7Severity.MINIMAL;
  if (total <= 9) return GAD7Severity.MILD;
  if (total <= 14) return GAD7Severity.MODERATE;
  return GAD7Severity.SEVERE;
}

@Injectable()
export class GAD7ScreeningsService extends MikroOrmEntityService<
  GAD7Screening,
  CreateGAD7ScreeningDto,
  UpdateGAD7ScreeningDto,
  GAD7ScreeningQueryDto,
  GAD7Projection
> {
  constructor(
    private readonly gad7Mapper: GAD7ScreeningsMapper,
    @InjectRepository(GAD7Screening)
    repository: EntityRepository<GAD7Screening>,
    entityManager: EntityManager,
    @InjectRepository(User)
    private readonly userRepository: EntityRepository<User>,
  ) {
    super(gad7Mapper, repository, entityManager, DEFAULT_PROJECTION);
  }

  async createScreening(dto: CreateGAD7ScreeningDto, recordedById: string): Promise<GAD7Screening> {
    const recordedBy = await this.userRepository.findOne({ id: recordedById });
    if (!recordedBy) throw new BadRequestException('Recorder user not found');

    const screening = this.gad7Mapper.fromCreateDto(dto) as GAD7Screening;
    screening.id = randomUUID();
    screening.recordedBy = recordedBy;

    const total =
      dto.q1Anxious + dto.q2Uncontrollable + dto.q3Worrying +
      dto.q4Relaxing + dto.q5Restless + dto.q6Irritable + dto.q7Afraid;
    screening.totalScore = total;
    screening.severity = computeGAD7Severity(total);

    try {
      await this.entityManager.persist(screening).flush();
    } catch (error) {
      this.handleDatabaseConstraintError(error, false);
    }

    return this.find(screening.id) as Promise<GAD7Screening>;
  }

  async updateScreening(id: string, dto: UpdateGAD7ScreeningDto): Promise<GAD7Screening> {
    const screening = await this.repository.findOne({ id });
    if (!screening) throw new BadRequestException('Screening not found');

    this.repository.assign(screening, dto);

    const total =
      screening.q1Anxious + screening.q2Uncontrollable + screening.q3Worrying +
      screening.q4Relaxing + screening.q5Restless + screening.q6Irritable + screening.q7Afraid;
    screening.totalScore = total;
    screening.severity = computeGAD7Severity(total);

    await this.entityManager.flush();
    return this.find(id) as Promise<GAD7Screening>;
  }
}

import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/postgresql';
import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { MikroOrmEntityService } from 'src/common/mikro-orm.entity-service';
import { User } from 'src/users/entities/user.entity';
import { CreatePHQ9ScreeningDto } from './dto/create-phq9-screening.dto';
import { PHQ9ScreeningQueryDto } from './dto/query-phq9-screening.dto';
import { UpdatePHQ9ScreeningDto } from './dto/update-phq9-screening.dto';
import { DEFAULT_PROJECTION, PHQ9Projection, PHQ9Screening, PHQ9Severity } from './entities/phq9-screening.entity';
import { PHQ9ScreeningsMapper } from './phq9-screenings.mapper';

function computePHQ9Severity(total: number): PHQ9Severity {
  if (total <= 4) return PHQ9Severity.NONE;
  if (total <= 9) return PHQ9Severity.MILD;
  if (total <= 14) return PHQ9Severity.MODERATE;
  if (total <= 19) return PHQ9Severity.MOD_SEVERE;
  return PHQ9Severity.SEVERE;
}

@Injectable()
export class PHQ9ScreeningsService extends MikroOrmEntityService<
  PHQ9Screening,
  CreatePHQ9ScreeningDto,
  UpdatePHQ9ScreeningDto,
  PHQ9ScreeningQueryDto,
  PHQ9Projection
> {
  constructor(
    private readonly phq9Mapper: PHQ9ScreeningsMapper,
    @InjectRepository(PHQ9Screening)
    repository: EntityRepository<PHQ9Screening>,
    entityManager: EntityManager,
    @InjectRepository(User)
    private readonly userRepository: EntityRepository<User>,
  ) {
    super(phq9Mapper, repository, entityManager, DEFAULT_PROJECTION);
  }

  async createScreening(dto: CreatePHQ9ScreeningDto, recordedById: string): Promise<PHQ9Screening> {
    const recordedBy = await this.userRepository.findOne({ id: recordedById });
    if (!recordedBy) throw new BadRequestException('Recorder user not found');

    const screening = this.phq9Mapper.fromCreateDto(dto) as PHQ9Screening;
    screening.id = randomUUID();
    screening.recordedBy = recordedBy;

    const total =
      dto.q1LittleInterest + dto.q2Depressed + dto.q3SleepProblems +
      dto.q4Fatigue + dto.q5Appetite + dto.q6Worthlessness +
      dto.q7Concentration + dto.q8Psychomotor + dto.q9SelfHarm;
    screening.totalScore = total;
    screening.severity = computePHQ9Severity(total);

    try {
      await this.entityManager.persist(screening).flush();
    } catch (error) {
      this.handleDatabaseConstraintError(error, false);
    }

    return this.find(screening.id) as Promise<PHQ9Screening>;
  }

  async updateScreening(id: string, dto: UpdatePHQ9ScreeningDto): Promise<PHQ9Screening> {
    const screening = await this.repository.findOne({ id });
    if (!screening) throw new BadRequestException('Screening not found');

    this.repository.assign(screening, dto);

    const total =
      screening.q1LittleInterest + screening.q2Depressed + screening.q3SleepProblems +
      screening.q4Fatigue + screening.q5Appetite + screening.q6Worthlessness +
      screening.q7Concentration + screening.q8Psychomotor + screening.q9SelfHarm;
    screening.totalScore = total;
    screening.severity = computePHQ9Severity(total);

    await this.entityManager.flush();
    return this.find(id) as Promise<PHQ9Screening>;
  }
}

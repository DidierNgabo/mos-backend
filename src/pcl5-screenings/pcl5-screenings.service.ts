import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/postgresql';
import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { MikroOrmEntityService } from 'src/common/mikro-orm.entity-service';
import { User } from 'src/users/entities/user.entity';
import { CreatePCL5ScreeningDto } from './dto/create-pcl5-screening.dto';
import { PCL5ScreeningQueryDto } from './dto/query-pcl5-screening.dto';
import { UpdatePCL5ScreeningDto } from './dto/update-pcl5-screening.dto';
import { DEFAULT_PROJECTION, PCL5Projection, PCL5Screening, PCL5Severity } from './entities/pcl5-screening.entity';
import { PCL5ScreeningsMapper } from './pcl5-screenings.mapper';

function computePCL5Severity(total: number): PCL5Severity {
  if (total <= 19) return PCL5Severity.MINIMAL;
  if (total <= 31) return PCL5Severity.MODERATE;
  if (total <= 43) return PCL5Severity.SEVERE;
  return PCL5Severity.EXTREME;
}

@Injectable()
export class PCL5ScreeningsService extends MikroOrmEntityService<
  PCL5Screening,
  CreatePCL5ScreeningDto,
  UpdatePCL5ScreeningDto,
  PCL5ScreeningQueryDto,
  PCL5Projection
> {
  constructor(
    private readonly pcl5Mapper: PCL5ScreeningsMapper,
    @InjectRepository(PCL5Screening)
    repository: EntityRepository<PCL5Screening>,
    entityManager: EntityManager,
    @InjectRepository(User)
    private readonly userRepository: EntityRepository<User>,
  ) {
    super(pcl5Mapper, repository, entityManager, DEFAULT_PROJECTION);
  }

  async createScreening(dto: CreatePCL5ScreeningDto, recordedById: string): Promise<PCL5Screening> {
    const recordedBy = await this.userRepository.findOne({ id: recordedById });
    if (!recordedBy) throw new BadRequestException('Recorder user not found');

    const screening = this.pcl5Mapper.fromCreateDto(dto) as PCL5Screening;
    screening.id = randomUUID();
    screening.recordedBy = recordedBy;

    const total =
      dto.q1 + dto.q2 + dto.q3 + dto.q4 + dto.q5 +
      dto.q6 + dto.q7 + dto.q8 + dto.q9 + dto.q10 +
      dto.q11 + dto.q12 + dto.q13 + dto.q14 + dto.q15 +
      dto.q16 + dto.q17 + dto.q18 + dto.q19 + dto.q20;
    screening.totalScore = total;
    screening.severity = computePCL5Severity(total);

    try {
      await this.entityManager.persist(screening).flush();
    } catch (error) {
      this.handleDatabaseConstraintError(error, false);
    }

    return this.find(screening.id) as Promise<PCL5Screening>;
  }

  async updateScreening(id: string, dto: UpdatePCL5ScreeningDto): Promise<PCL5Screening> {
    const screening = await this.repository.findOne({ id });
    if (!screening) throw new BadRequestException('Screening not found');

    this.repository.assign(screening, dto);

    const total =
      (screening.q1 ?? 0) + (screening.q2 ?? 0) + (screening.q3 ?? 0) + (screening.q4 ?? 0) + (screening.q5 ?? 0) +
      (screening.q6 ?? 0) + (screening.q7 ?? 0) + (screening.q8 ?? 0) + (screening.q9 ?? 0) + (screening.q10 ?? 0) +
      (screening.q11 ?? 0) + (screening.q12 ?? 0) + (screening.q13 ?? 0) + (screening.q14 ?? 0) + (screening.q15 ?? 0) +
      (screening.q16 ?? 0) + (screening.q17 ?? 0) + (screening.q18 ?? 0) + (screening.q19 ?? 0) + (screening.q20 ?? 0);
    screening.totalScore = total;
    screening.severity = computePCL5Severity(total);

    await this.entityManager.flush();
    return this.find(id) as Promise<PCL5Screening>;
  }
}

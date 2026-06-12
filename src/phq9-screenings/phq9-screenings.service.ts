import { InjectRepository } from '@mikro-orm/nestjs';
import { FilterQuery } from '@mikro-orm/core';
import { EntityManager, EntityRepository } from '@mikro-orm/postgresql';
import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AuthenticatedUser } from 'src/auth/auth.types';
import { RoleName } from 'src/auth/casl/casl-ability.factory';
import { MikroOrmEntityService } from 'src/common/mikro-orm.entity-service';
import { GAD7Screening } from 'src/gad7-screenings/entities/gad7-screening.entity';
import { PCL5Screening } from 'src/pcl5-screenings/entities/pcl5-screening.entity';
import { User } from 'src/users/entities/user.entity';
import { paginatedResponse } from 'src/utils/pagination.utils';
import { CreatePHQ9ScreeningDto } from './dto/create-phq9-screening.dto';
import { MentalHealthSessionQueryDto } from './dto/query-mental-health-session.dto';
import { PHQ9ScreeningQueryDto } from './dto/query-phq9-screening.dto';
import { UpdatePHQ9ScreeningDto } from './dto/update-phq9-screening.dto';
import {
  DEFAULT_PROJECTION,
  PHQ9Projection,
  PHQ9Screening,
  PHQ9Severity,
} from './entities/phq9-screening.entity';
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
    @InjectRepository(GAD7Screening)
    private readonly gad7Repository: EntityRepository<GAD7Screening>,
    @InjectRepository(PCL5Screening)
    private readonly pcl5Repository: EntityRepository<PCL5Screening>,
  ) {
    super(phq9Mapper, repository, entityManager, DEFAULT_PROJECTION);
  }

  async findSessions(
    query: MentalHealthSessionQueryDto,
    user?: AuthenticatedUser,
  ) {
    const filters: FilterQuery<PHQ9Screening>[] = [];
    const search = query.search?.trim();

    if (user?.roles.includes(RoleName.PSYCHOLOGIST)) {
      const psychologist = await this.userRepository.findOne(
        { id: user.id },
        { populate: ['outreaches'] },
      );
      const outreachIds =
        psychologist?.outreaches.getItems().map((outreach) => outreach.id) ??
        [];
      filters.push({ outreach: { id: { $in: outreachIds } } });
    }

    if (query.outreachId) {
      filters.push({ outreach: { id: query.outreachId } });
    }

    if (search) {
      filters.push({
        $or: [
          { patient: { firstName: { $ilike: `%${search}%` } } },
          { patient: { lastName: { $ilike: `%${search}%` } } },
          { patient: { registrationNumber: { $ilike: `%${search}%` } } },
          {
            $and: search.split(/\s+/).map((part) => ({
              $or: [
                { patient: { firstName: { $ilike: `%${part}%` } } },
                { patient: { lastName: { $ilike: `%${part}%` } } },
              ],
            })),
          },
        ],
      });
    }

    const [screenings, totalNumItems] = await this.repository.findAndCount(
      { $and: filters },
      {
        limit: query.limit,
        offset: query.offset,
        orderBy: { createdAt: 'desc' },
        populate: [
          'queueEntry',
          'patient',
          'station',
          'outreach',
          'recordedBy',
        ],
      },
    );

    const queueEntryIds = screenings.map(
      (screening) => screening.queueEntry.id,
    );
    const [gad7Screenings, pcl5Screenings] = queueEntryIds.length
      ? await Promise.all([
          this.gad7Repository.find(
            { queueEntry: { id: { $in: queueEntryIds } } },
            { populate: ['queueEntry'] },
          ),
          this.pcl5Repository.find(
            { queueEntry: { id: { $in: queueEntryIds } } },
            { populate: ['queueEntry'] },
          ),
        ])
      : [[], []];

    const closestTo = <
      T extends { createdAt: Date; queueEntry: { id: string } },
    >(
      candidates: T[],
      screening: PHQ9Screening,
    ): T | null => {
      const matching = candidates.filter(
        (candidate) => candidate.queueEntry.id === screening.queueEntry.id,
      );
      return (
        matching.sort(
          (a, b) =>
            Math.abs(a.createdAt.getTime() - screening.createdAt.getTime()) -
            Math.abs(b.createdAt.getTime() - screening.createdAt.getTime()),
        )[0] ?? null
      );
    };

    const items = screenings.map((phq9) => {
      const gad7 = closestTo(gad7Screenings, phq9);
      const pcl5 = closestTo(pcl5Screenings, phq9);

      return {
        id: phq9.id,
        queueEntryId: phq9.queueEntry.id,
        patient: {
          id: phq9.patient.id,
          firstName: phq9.patient.firstName,
          lastName: phq9.patient.lastName,
          registrationNumber: phq9.patient.registrationNumber,
          dateOfBirth: phq9.patient.dateOfBirth,
          gender: phq9.patient.gender,
        },
        station: { id: phq9.station.id, name: phq9.station.name },
        outreach: { id: phq9.outreach.id, name: phq9.outreach.name },
        recordedBy: {
          id: phq9.recordedBy.id,
          firstName: phq9.recordedBy.firstName,
          lastName: phq9.recordedBy.lastName,
        },
        demographics: {
          initialOfParticipant: phq9.initialOfParticipant,
          maritalStatus: phq9.maritalStatus,
          educationLevel: phq9.educationLevel,
          occupation: phq9.occupation,
          division: phq9.division,
          locationType: phq9.locationType,
          religion: phq9.religion,
        },
        phq9: {
          id: phq9.id,
          totalScore: phq9.totalScore,
          severity: phq9.severity,
          selfHarmResponse: phq9.q9SelfHarm,
          notes: phq9.notes,
        },
        gad7: gad7
          ? {
              id: gad7.id,
              totalScore: gad7.totalScore,
              severity: gad7.severity,
              notes: gad7.notes,
            }
          : null,
        pcl5: pcl5
          ? {
              id: pcl5.id,
              totalScore: pcl5.totalScore,
              severity: pcl5.severity,
              notes: pcl5.notes,
            }
          : null,
        createdAt: phq9.createdAt,
      };
    });

    return paginatedResponse(items, totalNumItems, query);
  }

  async createScreening(
    dto: CreatePHQ9ScreeningDto,
    recordedById: string,
  ): Promise<PHQ9Screening> {
    const recordedBy = await this.userRepository.findOne({ id: recordedById });
    if (!recordedBy) throw new BadRequestException('Recorder user not found');

    const screening = this.phq9Mapper.fromCreateDto(dto) as PHQ9Screening;
    screening.id = randomUUID();
    screening.recordedBy = recordedBy;

    const total =
      dto.q1LittleInterest +
      dto.q2Depressed +
      dto.q3SleepProblems +
      dto.q4Fatigue +
      dto.q5Appetite +
      dto.q6Worthlessness +
      dto.q7Concentration +
      dto.q8Psychomotor +
      dto.q9SelfHarm;
    screening.totalScore = total;
    screening.severity = computePHQ9Severity(total);

    try {
      await this.entityManager.persist(screening).flush();
    } catch (error) {
      this.handleDatabaseConstraintError(error, false);
    }

    return this.find(screening.id) as Promise<PHQ9Screening>;
  }

  async updateScreening(
    id: string,
    dto: UpdatePHQ9ScreeningDto,
  ): Promise<PHQ9Screening> {
    const screening = await this.repository.findOne({ id });
    if (!screening) throw new BadRequestException('Screening not found');

    this.repository.assign(screening, dto);

    const total =
      screening.q1LittleInterest +
      screening.q2Depressed +
      screening.q3SleepProblems +
      screening.q4Fatigue +
      screening.q5Appetite +
      screening.q6Worthlessness +
      screening.q7Concentration +
      screening.q8Psychomotor +
      screening.q9SelfHarm;
    screening.totalScore = total;
    screening.severity = computePHQ9Severity(total);

    await this.entityManager.flush();
    return this.find(id) as Promise<PHQ9Screening>;
  }
}

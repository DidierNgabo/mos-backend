import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/postgresql';
import { Injectable, NotFoundException } from '@nestjs/common';
import { MikroOrmEntityService } from 'src/common/mikro-orm.entity-service';
import { randomUUID } from 'crypto';
import { AuthenticatedUser } from 'src/auth/auth.types';
import { RoleName } from 'src/auth/casl/casl-ability.factory';
import { CommunicableDisease } from 'src/communicable-diseases/entities/communicable-disease.entity';
import { LabResult } from 'src/lab-results/entities/lab-result.entity';
import { Observation } from 'src/observations/entities/observation.entity';
import { Prescription } from 'src/prescriptions/entities/prescription.entity';
import { Station } from 'src/stations/entities/station.entity';
import { Team } from 'src/teams/entities/team.entity';
import { Transfer } from 'src/transfers/entities/transfer.entity';
import { User } from 'src/users/entities/user.entity';
import { VitalSign } from 'src/vital-signs/entities/vital-sign.entity';
import { CreateQueueEntryDto } from './dto/create-queue-entry.dto';
import { MoveQueueEntryDto } from './dto/move-queue-entry.dto';
import { QueueEntryQueryDto } from './dto/query-queue-entry.dto';
import { UpdateQueueEntryDto } from './dto/update-queue-entry.dto';
import { UpdateQueueStatusDto } from './dto/update-queue-status.dto';
import {
  QueueEntry,
  QueueStatus,
  QueueEntryProjection,
  DEFAULT_PROJECTION,
} from './entities/queue-entry.entity';
import { StationVisit } from './entities/station-visit.entity';
import { QueueEntriesMapper } from './queue-entries.mapper';

@Injectable()
export class QueueEntriesService extends MikroOrmEntityService<
  QueueEntry,
  CreateQueueEntryDto,
  UpdateQueueEntryDto,
  QueueEntryQueryDto,
  QueueEntryProjection
> {
  constructor(
    mapper: QueueEntriesMapper,
    @InjectRepository(QueueEntry)
    repository: EntityRepository<QueueEntry>,
    entityManager: EntityManager,
    @InjectRepository(StationVisit)
    private readonly stationVisitRepository: EntityRepository<StationVisit>,
    @InjectRepository(VitalSign)
    private readonly vitalSignRepository: EntityRepository<VitalSign>,
    @InjectRepository(Observation)
    private readonly observationRepository: EntityRepository<Observation>,
    @InjectRepository(LabResult)
    private readonly labResultRepository: EntityRepository<LabResult>,
    @InjectRepository(CommunicableDisease)
    private readonly communicableDiseaseRepository: EntityRepository<CommunicableDisease>,
    @InjectRepository(Transfer)
    private readonly transferRepository: EntityRepository<Transfer>,
    @InjectRepository(User)
    private readonly userRepository: EntityRepository<User>,
    @InjectRepository(Prescription)
    private readonly prescriptionRepository: EntityRepository<Prescription>,
    @InjectRepository(Team)
    private readonly teamRepository: EntityRepository<Team>,
  ) {
    super(mapper, repository, entityManager, DEFAULT_PROJECTION);
  }

  async findChart(entryId: string) {
    const entry = await this.repository.findOne(
      { id: entryId },
      { populate: ['patient', 'outreach', 'currentStation'] },
    );
    if (!entry) throw new NotFoundException('Queue entry not found');

    const patientId = (entry.patient as any).id;

    const [
      vitalSigns,
      observations,
      labResults,
      communicableDiseases,
      transfers,
      prescriptions,
    ] = await Promise.all([
      this.vitalSignRepository.find(
        { patient: { id: patientId } },
        { orderBy: { createdAt: 'DESC' }, limit: 20 },
      ),
      this.observationRepository.find(
        { queueEntry: { id: entryId } },
        { orderBy: { createdAt: 'DESC' } },
      ),
      this.labResultRepository.find(
        { queueEntry: { id: entryId } },
        { orderBy: { createdAt: 'DESC' } },
      ),
      this.communicableDiseaseRepository.find(
        { queueEntry: { id: entryId } },
        { orderBy: { createdAt: 'DESC' } },
      ),
      this.transferRepository.find(
        { queueEntry: { id: entryId } },
        { orderBy: { createdAt: 'DESC' } },
      ),
      this.prescriptionRepository.find(
        { queueEntry: { id: entryId } },
        {
          populate: ['pharmacyStock', 'prescribedBy', 'dispensedBy'],
          orderBy: { createdAt: 'DESC' },
        },
      ),
    ]);

    return {
      entry,
      vitalSigns,
      observations,
      labResults,
      communicableDiseases,
      transfers,
      prescriptions,
    };
  }

  async findMyQueue(user: AuthenticatedUser, query: QueueEntryQueryDto) {
    const isClinical = user.roles.some((r) =>
      [RoleName.NURSE, RoleName.DOCTOR, RoleName.PSYCHOLOGIST].includes(
        r as RoleName,
      ),
    );

    if (isClinical) {
      const dbUser = await this.userRepository.findOne(
        { id: user.id },
        { populate: ['station'] },
      );
      if (dbUser?.station) {
        query.currentStationId = (dbUser.station as any).id;
        const result = await this.findAll(query);
        return {
          ...result,
          queueScope: {
            source: 'INDIVIDUAL',
            stations: [
              {
                id: dbUser.station.id,
                name: dbUser.station.name,
              },
            ],
          },
        };
      } else {
        const teams = await this.teamRepository.find(
          {
            isActive: true,
            station: { $ne: null },
            $or: [{ leader: { id: user.id } }, { members: { id: user.id } }],
          },
          { populate: ['station'] },
        );
        const stationIds = [
          ...new Set(
            teams
              .map((team) => team.station?.id)
              .filter((id): id is string => Boolean(id)),
          ),
        ];
        if (stationIds.length === 0) {
          return {
            items: [],
            paginationInfo: {
              totalNumItems: 0,
              limit: query.limit ?? 50,
              offset: query.offset ?? 0,
            },
            queueScope: { source: 'NONE', stations: [] },
          };
        }
        query.currentStationIds = stationIds;
        const result = await this.findAll(query);
        return {
          ...result,
          queueScope: {
            source: 'TEAM',
            stations: teams
              .map((team) => team.station)
              .filter((station): station is Station => Boolean(station))
              .map((station) => ({ id: station.id, name: station.name }))
              .filter(
                (station, index, stations) =>
                  stations.findIndex((item) => item.id === station.id) ===
                  index,
              ),
          },
        };
      }
    }

    const result = await this.findAll(query);
    return { ...result, queueScope: { source: 'ALL', stations: [] } };
  }

  async moveToStation(
    id: string,
    dto: MoveQueueEntryDto,
    user: AuthenticatedUser,
  ): Promise<QueueEntry> {
    const entry = await this.repository.findOne(
      { id },
      { populate: ['currentStation'] },
    );
    if (!entry) throw new NotFoundException('Queue entry not found');

    const now = new Date();

    // Close out the current station visit if one is active
    if (entry.currentStation) {
      const activeVisit = await this.stationVisitRepository.findOne({
        queueEntry: { id },
        station: { id: (entry.currentStation as any).id },
        departedAt: null,
      });
      if (activeVisit) {
        activeVisit.departedAt = now;
        this.entityManager.persist(activeVisit);
      }
    }

    // Create a new station visit
    const visit = new StationVisit();
    visit.id = randomUUID();
    visit.arrivedAt = now;
    (visit as any).queueEntry = { id };
    (visit as any).station = { id: dto.stationId };
    (visit as any).movedBy = { id: user.id };
    if (dto.reason) visit.reason = dto.reason;
    this.entityManager.persist(visit);

    // Update the queue entry — use getReference so MikroORM has a proper entity proxy
    entry.currentStation = this.entityManager.getReference(
      Station,
      dto.stationId,
    );
    if (
      entry.status === QueueStatus.WAITING ||
      entry.status === QueueStatus.IN_SERVICE
    ) {
      entry.status = QueueStatus.WAITING;
    }
    this.entityManager.persist(entry);

    await this.entityManager.flush();
    return this.find(id);
  }

  async updateStatus(
    id: string,
    dto: UpdateQueueStatusDto,
  ): Promise<QueueEntry> {
    const entry = await this.repository.findOne({ id });
    if (!entry) throw new NotFoundException('Queue entry not found');

    entry.status = dto.status;
    if (
      dto.status === QueueStatus.COMPLETED ||
      dto.status === QueueStatus.NO_SHOW
    ) {
      entry.completedAt = new Date();
      (entry as any).currentStation = null;
    }

    await this.entityManager.flush();
    return this.find(id);
  }
}

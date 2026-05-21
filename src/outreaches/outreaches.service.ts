import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/postgresql';
import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { MikroOrmEntityService } from 'src/common/mikro-orm.entity-service';
import {
  DEFAULT_STATIONS,
  Station,
} from 'src/stations/entities/station.entity';
import {
  DEFAULT_TEAM_HIERARCHY,
  Team,
} from 'src/teams/entities/team.entity';
import { User } from 'src/users/entities/user.entity';
import { CreateOutreachDto } from './dto/create-outreach.dto';
import { OutreachQueryDto } from './dto/query-outreach.dto';
import { UpdateOutreachDto } from './dto/update-outreach.dto';
import {
  DEFAULT_PROJECTION,
  Outreach,
  OutreachProjection,
} from './entities/outreach.entity';
import { OutreachMapper } from './outreaches.mapper';

@Injectable()
export class OutreachesService extends MikroOrmEntityService<
  Outreach,
  CreateOutreachDto,
  UpdateOutreachDto,
  OutreachQueryDto,
  OutreachProjection
> {
  constructor(
    private readonly outreachMapper: OutreachMapper,
    @InjectRepository(Outreach)
    repository: EntityRepository<Outreach>,
    entityManager: EntityManager,
    @InjectRepository(User)
    private readonly userRepository: EntityRepository<User>,
  ) {
    super(outreachMapper, repository, entityManager, DEFAULT_PROJECTION);
  }

  async createOutreach(dto: CreateOutreachDto, createdById: string): Promise<Outreach> {
    const creator = await this.userRepository.findOne({ id: createdById });
    if (!creator) {
      throw new BadRequestException('Creator user not found');
    }

    const outreach = this.outreachMapper.fromCreateDto(dto);
    outreach.id = randomUUID();
    outreach.createdBy = creator;

    if (dto.memberIds?.length) {
      const members = await this.outreachMapper.resolveMembers(dto.memberIds);
      outreach.members.set(members);
    }

    try {
      await this.entityManager.persist(outreach).flush();
    } catch (error) {
      this.handleDatabaseConstraintError(error, false);
    }

    DEFAULT_STATIONS.forEach(({ name, type }) => {
      this.entityManager.create(Station, {
        id: randomUUID(),
        outreach,
        name,
        type,
        isActive: true,
      });
    });

    for (const group of DEFAULT_TEAM_HIERARCHY) {
      const parentTeam = this.entityManager.create(Team, {
        id: randomUUID(),
        outreach,
        name: group.name,
        type: group.type,
        isActive: true,
      });
      for (const childName of group.children) {
        this.entityManager.create(Team, {
          id: randomUUID(),
          outreach,
          name: childName,
          parent: parentTeam,
          isActive: true,
        });
      }
    }

    await this.entityManager.flush();

    return this.find(outreach.id) as Promise<Outreach>;
  }

  async addMembers(outreachId: string, userIds: string[]): Promise<Outreach> {
    const outreach = await this.repository.findOne(
      { id: outreachId },
      { populate: ['members'] },
    );
    if (!outreach) throw new BadRequestException('Outreach not found');

    const users = await this.userRepository.find({ id: { $in: userIds } });
    if (users.length !== userIds.length) {
      throw new BadRequestException('One or more userIds are invalid');
    }

    users.forEach((u) => outreach.members.add(u));
    await this.entityManager.flush();
    return this.find(outreachId) as Promise<Outreach>;
  }

  async removeMembers(
    outreachId: string,
    userIds: string[],
  ): Promise<Outreach> {
    const outreach = await this.repository.findOne(
      { id: outreachId },
      { populate: ['members'] },
    );
    if (!outreach) throw new BadRequestException('Outreach not found');

    const users = await this.userRepository.find({ id: { $in: userIds } });
    users.forEach((u) => outreach.members.remove(u));
    await this.entityManager.flush();
    return this.find(outreachId) as Promise<Outreach>;
  }
}

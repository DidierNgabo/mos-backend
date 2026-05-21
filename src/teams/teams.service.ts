import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/postgresql';
import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { MikroOrmEntityService } from 'src/common/mikro-orm.entity-service';
import { User } from 'src/users/entities/user.entity';
import { CreateTeamDto } from './dto/create-team.dto';
import { TeamQueryDto } from './dto/query-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { DEFAULT_PROJECTION, Team, TeamProjection } from './entities/team.entity';
import { TeamsMapper } from './teams.mapper';

@Injectable()
export class TeamsService extends MikroOrmEntityService<
  Team,
  CreateTeamDto,
  UpdateTeamDto,
  TeamQueryDto,
  TeamProjection
> {
  constructor(
    private readonly teamsMapper: TeamsMapper,
    @InjectRepository(Team)
    repository: EntityRepository<Team>,
    entityManager: EntityManager,
    @InjectRepository(User)
    private readonly userRepository: EntityRepository<User>,
  ) {
    super(teamsMapper, repository, entityManager, DEFAULT_PROJECTION);
  }

  async createTeam(dto: CreateTeamDto): Promise<Team> {
    const team = this.teamsMapper.fromCreateDto(dto) as Team;
    team.id = randomUUID();

    if (dto.leaderId) {
      const leader = await this.userRepository.findOne({ id: dto.leaderId });
      if (!leader) throw new BadRequestException('Leader user not found');
      team.leader = leader;
    }

    if (dto.memberIds?.length) {
      const members = await this.userRepository.find({
        id: { $in: dto.memberIds },
      });
      team.members.set(members);
    }

    try {
      await this.entityManager.persist(team).flush();
    } catch (error) {
      this.handleDatabaseConstraintError(error, false);
    }

    return this.find(team.id) as Promise<Team>;
  }

  async updateTeam(id: string, dto: UpdateTeamDto): Promise<Team> {
    const team = await this.repository.findOne({ id }, { populate: ['members'] });
    if (!team) throw new BadRequestException('Team not found');

    const updateData: any = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.type !== undefined) updateData.type = dto.type;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;
    if (dto.parentId !== undefined) updateData.parent = { id: dto.parentId };
    if (dto.outreachId !== undefined) updateData.outreach = { id: dto.outreachId };

    this.repository.assign(team, updateData);

    if (dto.leaderId !== undefined) {
      if (dto.leaderId === null) {
        team.leader = null;
      } else {
        const leader = await this.userRepository.findOne({ id: dto.leaderId });
        if (!leader) throw new BadRequestException('Leader user not found');
        team.leader = leader;
      }
    }

    if (dto.memberIds !== undefined) {
      const members = await this.userRepository.find({
        id: { $in: dto.memberIds },
      });
      team.members.set(members);
    }

    await this.entityManager.flush();
    return this.find(id) as Promise<Team>;
  }
}

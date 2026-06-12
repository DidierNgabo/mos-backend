import { EntityRepository, FilterQuery } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import { EntityMapper } from 'src/common/mikro-orm.entity-service';
import { CreateTeamDto } from './dto/create-team.dto';
import { TeamQueryDto } from './dto/query-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { Team } from './entities/team.entity';

@Injectable()
export class TeamsMapper implements EntityMapper<
  Team,
  CreateTeamDto,
  UpdateTeamDto,
  TeamQueryDto
> {
  constructor(
    @InjectRepository(Team)
    private readonly repository: EntityRepository<Team>,
  ) {}

  fromCreateDto(dto: CreateTeamDto): Team {
    const team = Object.assign(new Team(), {
      name: dto.name,
      description: dto.description ?? null,
      type: dto.type ?? null,
      isActive: dto.isActive ?? true,
    });
    if (dto.outreachId) {
      (team as any).outreach = { id: dto.outreachId };
    }
    if (dto.parentId) {
      (team as any).parent = { id: dto.parentId };
    }
    if (dto.stationId) {
      (team as any).station = { id: dto.stationId };
    }
    return team;
  }

  async fromUpdateDto(id: string, dto: UpdateTeamDto): Promise<Team | null> {
    const entity = await this.repository.findOne({ id });
    if (!entity) return null;
    return this.repository.assign(entity, this.entityFromDto(dto));
  }

  entityFromDto(dto: UpdateTeamDto): Partial<Team> {
    const data: any = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.parentId !== undefined) data.parent = { id: dto.parentId };
    if (dto.stationId !== undefined) {
      data.station = dto.stationId ? { id: dto.stationId } : null;
    }
    return data;
  }

  filtersFromQueryDto(query: TeamQueryDto): FilterQuery<Team>[] {
    const outreachFilter: FilterQuery<Team> = query.outreachId && {
      outreach: { id: query.outreachId },
    };
    const parentFilter: FilterQuery<Team> = query.parentId && {
      parent: { id: query.parentId },
    };
    const typeFilter: FilterQuery<Team> = query.type && {
      type: query.type,
    };
    const leaderFilter: FilterQuery<Team> = query.leaderId && {
      leader: { id: query.leaderId },
    };
    const memberFilter: FilterQuery<Team> =
      query.memberId &&
      ({
        members: { id: query.memberId },
      } as any);
    const isActiveFilter: FilterQuery<Team> = query.isActive !== undefined && {
      isActive: query.isActive,
    };
    const searchFilter: FilterQuery<Team> = query.search && {
      name: { $ilike: '%' + query.search + '%' },
    };
    const createdAtFilter: FilterQuery<Team> = query.createdAt && {
      createdAt: { $lt: query.createdAt },
    };
    const updatedAtFilter: FilterQuery<Team> = query.updatedAt && {
      updatedAt: { $lt: query.updatedAt },
    };

    return [
      outreachFilter,
      parentFilter,
      typeFilter,
      leaderFilter,
      memberFilter,
      isActiveFilter,
      searchFilter,
      createdAtFilter,
      updatedAtFilter,
    ].filter((f) => !!f);
  }
}

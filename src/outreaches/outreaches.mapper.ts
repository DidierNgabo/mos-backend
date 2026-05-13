import { EntityRepository, FilterQuery } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import { EntityMapper } from 'src/common/mikro-orm.entity-service';
import { User } from 'src/users/entities/user.entity';
import { CreateOutreachDto } from './dto/create-outreach.dto';
import { OutreachQueryDto } from './dto/query-outreach.dto';
import { UpdateOutreachDto } from './dto/update-outreach.dto';
import { Outreach, OutreachStatus } from './entities/outreach.entity';

@Injectable()
export class OutreachMapper
  implements
    EntityMapper<Outreach, CreateOutreachDto, UpdateOutreachDto, OutreachQueryDto>
{
  constructor(
    @InjectRepository(Outreach)
    private readonly repository: EntityRepository<Outreach>,
    @InjectRepository(User)
    private readonly userRepository: EntityRepository<User>,
  ) {}

  fromCreateDto(dto: CreateOutreachDto): Outreach {
    const { memberIds: _memberIds, ...rest } = dto;
    return Object.assign(new Outreach(), {
      ...rest,
      date: new Date(dto.date),
      status: dto.status ?? OutreachStatus.PLANNED,
    });
  }

  async fromUpdateDto(
    id: string,
    dto: UpdateOutreachDto,
  ): Promise<Outreach | null> {
    const outreach = await this.repository.findOne(
      { id },
      { populate: ['members'] },
    );
    if (!outreach) return null;

    const { memberIds, date, ...rest } = dto;
    this.repository.assign(outreach, {
      ...rest,
      ...(date ? { date: new Date(date) } : {}),
    });

    if (memberIds !== undefined) {
      const members = await this.userRepository.find({
        id: { $in: memberIds },
      });
      outreach.members.set(members);
    }

    return outreach;
  }

  entityFromDto(dto: UpdateOutreachDto): Outreach {
    const { memberIds: _memberIds, date, ...rest } = dto;
    return Object.assign(new Outreach(), {
      ...rest,
      ...(date ? { date: new Date(date) } : {}),
    });
  }

  async resolveMembers(memberIds: string[]): Promise<User[]> {
    if (!memberIds?.length) return [];
    return this.userRepository.find({ id: { $in: memberIds } });
  }

  filtersFromQueryDto(query: OutreachQueryDto) {
    const name: FilterQuery<Outreach> = query.name && {
      name: { $ilike: '%' + query.name + '%' },
    };
    const location: FilterQuery<Outreach> = query.location && {
      location: { $ilike: '%' + query.location + '%' },
    };
    const status: FilterQuery<Outreach> = query.status && {
      status: query.status,
    };
    const outreachId: FilterQuery<Outreach> = query.outreachId && {
      id: query.outreachId,
    };
    const createdById: FilterQuery<Outreach> = query.createdById && {
      createdBy: { id: query.createdById },
    };
    const memberId: FilterQuery<Outreach> = query.memberId && {
      members: { id: query.memberId },
    };
    const dateFrom: FilterQuery<Outreach> = query.dateFrom && {
      date: { $gte: new Date(query.dateFrom) },
    };
    const dateTo: FilterQuery<Outreach> = query.dateTo && {
      date: { $lte: new Date(query.dateTo) },
    };
    const createdAt: FilterQuery<Outreach> = query.createdAt && {
      createdAt: { $lt: query.createdAt },
    };
    const updatedAt: FilterQuery<Outreach> = query.updatedAt && {
      updatedAt: { $lt: query.updatedAt },
    };
    const globalSearch: FilterQuery<Outreach> = query.search && {
      $or: [
        { name: { $ilike: '%' + query.search + '%' } },
        { location: { $ilike: '%' + query.search + '%' } },
      ],
    };

    return [
      name,
      location,
      status,
      outreachId,
      createdById,
      memberId,
      dateFrom,
      dateTo,
      createdAt,
      updatedAt,
      globalSearch,
    ].filter((f) => !!f);
  }
}

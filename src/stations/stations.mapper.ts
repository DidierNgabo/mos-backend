import { EntityRepository, FilterQuery } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { EntityMapper } from 'src/common/mikro-orm.entity-service';
import { Outreach } from 'src/outreaches/entities/outreach.entity';
import { CreateStationDto } from './dto/create-station.dto';
import { StationQueryDto } from './dto/query-station.dto';
import { UpdateStationDto } from './dto/update-station.dto';
import { Station } from './entities/station.entity';

@Injectable()
export class StationsMapper
  implements
    EntityMapper<Station, CreateStationDto, UpdateStationDto, StationQueryDto>
{
  constructor(
    @InjectRepository(Station)
    private readonly repository: EntityRepository<Station>,
    @InjectRepository(Outreach)
    private readonly outreachRepository: EntityRepository<Outreach>,
  ) {}

  async fromCreateDto(dto: CreateStationDto): Promise<Station> {
    const outreach = await this.outreachRepository.findOne({
      id: dto.outreachId,
    });
    const station = Object.assign(new Station(), {
      id: randomUUID(),
      name: dto.name,
      type: dto.type,
      isActive: dto.isActive ?? true,
      outreach,
    });
    return station;
  }

  async fromUpdateDto(
    id: string,
    dto: UpdateStationDto,
  ): Promise<Station | null> {
    const station = await this.repository.findOne({ id });
    if (!station) return null;

    const { outreachId, ...rest } = dto;
    this.repository.assign(station, rest);

    if (outreachId !== undefined) {
      const outreach = await this.outreachRepository.findOne({
        id: outreachId,
      });
      station.outreach = outreach;
    }

    return station;
  }

  filtersFromQueryDto(query: StationQueryDto): FilterQuery<Station>[] {
    const name: FilterQuery<Station> = query.name && {
      name: { $ilike: '%' + query.name + '%' },
    };
    const type: FilterQuery<Station> = query.type && { type: query.type };
    const outreachId: FilterQuery<Station> = query.outreachId && {
      outreach: { id: query.outreachId },
    };
    const isActive: FilterQuery<Station> =
      query.isActive !== undefined && { isActive: query.isActive };
    const createdAt: FilterQuery<Station> = query.createdAt && {
      createdAt: { $gte: new Date(query.createdAt) },
    };
    const updatedAt: FilterQuery<Station> = query.updatedAt && {
      updatedAt: { $gte: new Date(query.updatedAt) },
    };
    const globalSearch: FilterQuery<Station> = query.search && {
      $or: [{ name: { $ilike: '%' + query.search + '%' } }],
    };

    return [
      name,
      type,
      outreachId,
      isActive,
      createdAt,
      updatedAt,
      globalSearch,
    ].filter((f) => !!f);
  }
}

import { EntityRepository, FilterQuery } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { EntityMapper } from 'src/common/mikro-orm.entity-service';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Role } from './entities/role.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RoleQueryDto } from './dto/query-role.dto';

@Injectable()
export class RoleMapper
  implements
    EntityMapper<Role, CreateRoleDto, UpdateRoleDto, RoleQueryDto>
{
  constructor(
    @InjectRepository(Role)
    private readonly repository: EntityRepository<Role>,
  ) {}

  fromCreateDto(dto: CreateRoleDto): Role {
    return Object.assign(new Role(), {
      ...dto,
    });
  }

  async fromUpdateDto(
    id: string,
    dto: UpdateRoleDto,
  ): Promise<Role | null> {
    const entity = await this.repository.findOne({ id });
    if (!entity) return null;
    const mappedDto = this.entityFromDto(dto);
    return this.repository.assign(entity, mappedDto);
  }

  entityFromDto(dto: UpdateRoleDto) {
    const {  ...RoleData } = dto;
    return Object.assign(new Role(), {
      ...RoleData,
    });
  }

  filtersFromQueryDto(query: RoleQueryDto) {
    const name: FilterQuery<Role> = query.name && {
      name: { $like: '%' + query.name + '%' },
    };
    const description: FilterQuery<Role> = query.description && {
      description: { $like: '%' + query.description + '%' },
    };

    const roleId: FilterQuery<Role> = query.roleId && {
      id: query.roleId,
    };
    
    
    const updatedAt: FilterQuery<Role> = query.updatedAt && {
      updatedAt: { $lt: query.updatedAt },
    };
    const createdAt: FilterQuery<Role> = query.createdAt && {
      createdAt: { $lt: query.createdAt },
    };

    // Global search filter - searches across multiple fields
    const globalSearch: FilterQuery<Role> = query.search && {
      $or: [
        { name: { $ilike: '%' + query.search + '%' } },
        { description: { $ilike: '%' + query.search + '%' } },
      ],
    };

    
    return [
      name,
      description,
      roleId,
      updatedAt,
      createdAt,
      globalSearch,
    ].filter((filter) => !!filter);
  }
}

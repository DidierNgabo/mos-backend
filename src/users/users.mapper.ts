import { EntityRepository, FilterQuery } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import { EntityMapper } from 'src/common/mikro-orm.entity-service';
import { Role } from 'src/roles/entities/role.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserQueryDto } from './dto/query-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UserMapper
  implements EntityMapper<User, CreateUserDto, UpdateUserDto, UserQueryDto>
{
  constructor(
    @InjectRepository(User)
    private readonly repository: EntityRepository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: EntityRepository<Role>,
  ) {}

  fromCreateDto(dto: CreateUserDto): User {
    const { roleIds: _roleIds, stationId, ...rest } = dto;
    const user = Object.assign(new User(), rest);
    if (stationId) {
      this.repository.assign(user, { station: stationId });
    }
    return user;
  }

  async fromUpdateDto(
    id: string,
    dto: UpdateUserDto,
  ): Promise<User | null> {
    const user = await this.repository.findOne({ id }, { populate: ['roles'] });
    if (!user) return null;

    const { roleIds, stationId, ...rest } = dto;
    this.repository.assign(user, rest as Partial<User>);

    if (stationId !== undefined) {
      this.repository.assign(user, { station: stationId || null });
    }

    if (roleIds !== undefined) {
      const roles = await this.roleRepository.find({ id: { $in: roleIds } });
      user.roles.set(roles);
    }
    return user;
  }

  entityFromDto(dto: UpdateUserDto) {
    const { roleIds: _roleIds, stationId: _stationId, ...rest } = dto;
    return Object.assign(new User(), rest);
  }

  async resolveRoles(roleIds: string[]): Promise<Role[]> {
    if (!roleIds?.length) return [];
    return this.roleRepository.find({ id: { $in: roleIds } });
  }

  filtersFromQueryDto(query: UserQueryDto) {
    const firstName: FilterQuery<User> = query.firstName && {
      firstName: { $ilike: '%' + query.firstName + '%' },
    };
    const lastName: FilterQuery<User> = query.lastName && {
      lastName: { $ilike: '%' + query.lastName + '%' },
    };
    const email: FilterQuery<User> = query.email && {
      email: { $ilike: '%' + query.email + '%' },
    };
    const userId: FilterQuery<User> = query.userId && { id: query.userId };
    const roleId: FilterQuery<User> = query.roleId && {
      roles: { id: query.roleId },
    };
    const stationId: FilterQuery<User> = query.stationId && {
      station: { id: query.stationId },
    };
    const isActive: FilterQuery<User> =
      query.isActive !== undefined && { isActive: query.isActive };
    const mustChangePassword: FilterQuery<User> =
      query.mustChangePassword !== undefined && {
        mustChangePassword: query.mustChangePassword,
      };
    const createdAt: FilterQuery<User> = query.createdAt && {
      createdAt: { $lt: query.createdAt },
    };
    const updatedAt: FilterQuery<User> = query.updatedAt && {
      updatedAt: { $lt: query.updatedAt },
    };

    const globalSearch: FilterQuery<User> = query.search && {
      $or: [
        { firstName: { $ilike: '%' + query.search + '%' } },
        { lastName: { $ilike: '%' + query.search + '%' } },
        { email: { $ilike: '%' + query.search + '%' } },
      ],
    };

    return [
      firstName,
      lastName,
      email,
      userId,
      roleId,
      stationId,
      isActive,
      mustChangePassword,
      createdAt,
      updatedAt,
      globalSearch,
    ].filter((filter) => !!filter);
  }
}

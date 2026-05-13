import { Injectable } from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RoleMapper } from './roles.mapper';
import { Role } from './entities/role.entity';
import { RoleProjection } from './entities/role.entity';
import { MikroOrmEntityService } from 'src/common/mikro-orm.entity-service';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/postgresql';
import { RoleQueryDto } from './dto/query-role.dto';

@Injectable()
export class RolesService extends MikroOrmEntityService<
  Role,
  CreateRoleDto,
  UpdateRoleDto,
 RoleQueryDto,
  RoleProjection
> {
  constructor(
    mapper: RoleMapper,
    @InjectRepository(Role)
    repository: EntityRepository<Role>,
    entityManager: EntityManager,
  ) {
    super(mapper, repository, entityManager);
  }
}

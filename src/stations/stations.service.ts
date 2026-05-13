import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/postgresql';
import { BadRequestException, Injectable } from '@nestjs/common';
import { RoleName } from 'src/auth/casl/casl-ability.factory';
import { MikroOrmEntityService } from 'src/common/mikro-orm.entity-service';
import { User } from 'src/users/entities/user.entity';
import { CreateStationDto } from './dto/create-station.dto';
import { StationQueryDto } from './dto/query-station.dto';
import { UpdateStationDto } from './dto/update-station.dto';
import {
  DEFAULT_PROJECTION,
  Station,
  StationProjection,
} from './entities/station.entity';
import { StationsMapper } from './stations.mapper';

const CLINICAL_ROLES: string[] = [
  RoleName.NURSE,
  RoleName.DOCTOR,
  RoleName.DATA_CLERK,
  RoleName.PHARMACIST,
];

@Injectable()
export class StationsService extends MikroOrmEntityService<
  Station,
  CreateStationDto,
  UpdateStationDto,
  StationQueryDto,
  StationProjection
> {
  constructor(
    mapper: StationsMapper,
    @InjectRepository(Station)
    repository: EntityRepository<Station>,
    entityManager: EntityManager,
    @InjectRepository(User)
    private readonly userRepository: EntityRepository<User>,
  ) {
    super(mapper, repository, entityManager, DEFAULT_PROJECTION);
  }

  async assignUsers(stationId: string, userIds: string[]): Promise<Station> {
    const station = await this.repository.findOne({ id: stationId });
    if (!station) throw new BadRequestException('Station not found');

    const users = await this.userRepository.find(
      { id: { $in: userIds } },
      { populate: ['roles'] },
    );

    if (users.length !== userIds.length) {
      throw new BadRequestException('One or more userIds are invalid');
    }

    const nonClinical = users.filter(
      (u) => !u.roles.getItems().some((r) => CLINICAL_ROLES.includes(r.name)),
    );
    if (nonClinical.length > 0) {
      const names = nonClinical
        .map((u) => `${u.firstName} ${u.lastName}`)
        .join(', ');
      throw new BadRequestException(
        `The following users do not have a clinical role and cannot be assigned to a station: ${names}`,
      );
    }

    users.forEach((u) => {
      u.station = station;
    });
    await this.entityManager.flush();

    return this.find(stationId) as Promise<Station>;
  }

  async unassignUsers(stationId: string, userIds: string[]): Promise<Station> {
    const users = await this.userRepository.find(
      { id: { $in: userIds }, station: { id: stationId } },
      { populate: ['station'] },
    );

    users.forEach((u) => {
      u.station = null;
    });
    await this.entityManager.flush();

    return this.find(stationId) as Promise<Station>;
  }
}

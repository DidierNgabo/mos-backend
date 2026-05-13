import { getRepositoryToken } from '@mikro-orm/nestjs';
import { EntityManager } from '@mikro-orm/postgresql';
import { Test, TestingModule } from '@nestjs/testing';
import { User } from 'src/users/entities/user.entity';
import { Station } from './entities/station.entity';
import { StationsMapper } from './stations.mapper';
import { StationsService } from './stations.service';

describe('StationsService', () => {
  let service: StationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StationsService,
        { provide: StationsMapper, useValue: {} },
        { provide: getRepositoryToken(Station), useValue: {} },
        { provide: getRepositoryToken(User), useValue: {} },
        { provide: EntityManager, useValue: {} },
      ],
    }).compile();

    service = module.get<StationsService>(StationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

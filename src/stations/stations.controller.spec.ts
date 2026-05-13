import { getRepositoryToken } from '@mikro-orm/nestjs';
import { EntityManager } from '@mikro-orm/postgresql';
import { Test, TestingModule } from '@nestjs/testing';
import { Outreach } from 'src/outreaches/entities/outreach.entity';
import { User } from 'src/users/entities/user.entity';
import { Station } from './entities/station.entity';
import { StationsController } from './stations.controller';
import { StationsMapper } from './stations.mapper';
import { StationsService } from './stations.service';

describe('StationsController', () => {
  let controller: StationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StationsController],
      providers: [
        StationsService,
        { provide: StationsMapper, useValue: {} },
        { provide: getRepositoryToken(Station), useValue: {} },
        { provide: getRepositoryToken(User), useValue: {} },
        { provide: getRepositoryToken(Outreach), useValue: {} },
        { provide: EntityManager, useValue: {} },
      ],
    }).compile();

    controller = module.get<StationsController>(StationsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

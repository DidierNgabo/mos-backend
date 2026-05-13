import { getRepositoryToken } from '@mikro-orm/nestjs';
import { EntityManager } from '@mikro-orm/postgresql';
import { Test, TestingModule } from '@nestjs/testing';
import { User } from 'src/users/entities/user.entity';
import { Outreach } from './entities/outreach.entity';
import { OutreachMapper } from './outreaches.mapper';
import { OutreachesController } from './outreaches.controller';
import { OutreachesService } from './outreaches.service';

describe('OutreachesController', () => {
  let controller: OutreachesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OutreachesController],
      providers: [
        OutreachesService,
        { provide: OutreachMapper, useValue: {} },
        { provide: getRepositoryToken(Outreach), useValue: {} },
        { provide: getRepositoryToken(User), useValue: {} },
        { provide: EntityManager, useValue: {} },
      ],
    }).compile();

    controller = module.get<OutreachesController>(OutreachesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

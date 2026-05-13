import { getRepositoryToken } from '@mikro-orm/nestjs';
import { EntityManager } from '@mikro-orm/postgresql';
import { Test, TestingModule } from '@nestjs/testing';
import { User } from 'src/users/entities/user.entity';
import { Outreach } from './entities/outreach.entity';
import { OutreachMapper } from './outreaches.mapper';
import { OutreachesService } from './outreaches.service';

describe('OutreachesService', () => {
  let service: OutreachesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OutreachesService,
        { provide: OutreachMapper, useValue: {} },
        { provide: getRepositoryToken(Outreach), useValue: {} },
        { provide: getRepositoryToken(User), useValue: {} },
        { provide: EntityManager, useValue: {} },
      ],
    }).compile();

    service = module.get<OutreachesService>(OutreachesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

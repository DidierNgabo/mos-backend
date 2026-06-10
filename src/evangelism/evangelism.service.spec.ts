import { getRepositoryToken } from '@mikro-orm/nestjs';
import { EntityManager } from '@mikro-orm/postgresql';
import { Test, TestingModule } from '@nestjs/testing';
import { User } from 'src/users/entities/user.entity';
import { EvangelismRecord } from './entities/evangelism-record.entity';
import { EvangelismMapper } from './evangelism.mapper';
import { EvangelismService } from './evangelism.service';

describe('EvangelismService', () => {
  let service: EvangelismService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EvangelismService,
        { provide: EvangelismMapper, useValue: {} },
        { provide: getRepositoryToken(EvangelismRecord), useValue: {} },
        { provide: getRepositoryToken(User), useValue: {} },
        { provide: EntityManager, useValue: {} },
      ],
    }).compile();

    service = module.get<EvangelismService>(EvangelismService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

import { getRepositoryToken } from '@mikro-orm/nestjs';
import { EntityManager } from '@mikro-orm/postgresql';
import { Test, TestingModule } from '@nestjs/testing';
import { User } from 'src/users/entities/user.entity';
import { EvangelismRecord } from './entities/evangelism-record.entity';
import { EvangelismController } from './evangelism.controller';
import { EvangelismMapper } from './evangelism.mapper';
import { EvangelismService } from './evangelism.service';

describe('EvangelismController', () => {
  let controller: EvangelismController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EvangelismController],
      providers: [
        EvangelismService,
        { provide: EvangelismMapper, useValue: {} },
        { provide: getRepositoryToken(EvangelismRecord), useValue: {} },
        { provide: getRepositoryToken(User), useValue: {} },
        { provide: EntityManager, useValue: {} },
      ],
    }).compile();

    controller = module.get<EvangelismController>(EvangelismController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

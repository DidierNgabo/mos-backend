import { Test, TestingModule } from '@nestjs/testing';
import { QueueEntriesController } from './queue-entries.controller';
import { QueueEntriesService } from './queue-entries.service';

describe('QueueEntriesController', () => {
  let controller: QueueEntriesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QueueEntriesController],
      providers: [{ provide: QueueEntriesService, useValue: {} }],
    }).compile();

    controller = module.get<QueueEntriesController>(QueueEntriesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

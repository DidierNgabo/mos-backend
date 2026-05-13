import { Test, TestingModule } from '@nestjs/testing';
import { QueueEntriesService } from './queue-entries.service';

describe('QueueEntriesService', () => {
  let service: QueueEntriesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [{ provide: QueueEntriesService, useValue: {} }],
    }).compile();

    service = module.get<QueueEntriesService>(QueueEntriesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { VitalSignsController } from './vital-signs.controller';

describe('VitalSignsController', () => {
  let controller: VitalSignsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VitalSignsController],
    })
      .useMocker(() => ({}))
      .compile();

    controller = module.get<VitalSignsController>(VitalSignsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

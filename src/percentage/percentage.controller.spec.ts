import { Test, TestingModule } from '@nestjs/testing';
import { PercentageController } from './percentage.controller';
import { PercentageService } from './percentage.service';

describe('PercentageController', () => {
  let controller: PercentageController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PercentageController],
      providers: [PercentageService],
    }).compile();

    controller = module.get<PercentageController>(PercentageController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

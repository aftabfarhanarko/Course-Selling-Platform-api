import { Test, TestingModule } from '@nestjs/testing';
import { PercentageService } from './percentage.service';

describe('PercentageService', () => {
  let service: PercentageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PercentageService],
    }).compile();

    service = module.get<PercentageService>(PercentageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

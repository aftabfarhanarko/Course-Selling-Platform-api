import { Test, TestingModule } from '@nestjs/testing';
import { PaymentmethodService } from './paymentmethod.service';

describe('PaymentmethodService', () => {
  let service: PaymentmethodService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PaymentmethodService],
    }).compile();

    service = module.get<PaymentmethodService>(PaymentmethodService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

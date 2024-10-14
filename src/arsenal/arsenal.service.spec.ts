import { Test, TestingModule } from '@nestjs/testing';
import { ArsenalService } from './arsenal.service';

describe('ArsenalService', () => {
  let service: ArsenalService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ArsenalService],
    }).compile();

    service = module.get<ArsenalService>(ArsenalService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

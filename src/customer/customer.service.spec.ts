import { Test, TestingModule } from '@nestjs/testing';
import { CustomerService } from './customer.service';
import { RedisModule } from '@goopen/nestjs-ioredis-provider';
import { MongooseModule } from '@nestjs/mongoose';
import { mongoUrl, mongoDb, redisUrl } from '../config/env';
import { UserModule } from '../user/user.module';
import { MarketModule } from '../market/market.module';
import { UserService } from '../user/user.service';

describe('CustomerService', () => {
  let module: TestingModule;
  let service: CustomerService;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(mongoUrl, {
          dbName: mongoDb,
          readPreference: "secondaryPreferred",
        }),
        RedisModule.register({
          url: redisUrl,
          isGlobal: true,
        }),
        UserModule,
        MarketModule,
      ],
      providers: [CustomerService],
    }).compile();

    service = module.get<CustomerService>(CustomerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCustomerBatch', () => {
    it('should return a list of customers', async () => {
      const batchIndex = service.getIndexFromTimeStamp(new Date());
      const customers = await service.getCustomerBatch('NY', batchIndex);
      expect(customers).toBeDefined();
      expect(customers.length).toBe(100);
    });
  });

  afterAll(async () => {
    await module.close();
  });
});

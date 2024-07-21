import { Test, TestingModule } from '@nestjs/testing';
import { ShippingService } from './shipping.service';
import { RedisModule } from '@goopen/nestjs-ioredis-provider';
import { MongooseModule } from '@nestjs/mongoose';
import { mongoUrl, mongoDb, redisUrl } from '../config/env';
import { MarketModule } from '../market/market.module';
import { UserModule } from '../user/user.module';

describe('ShippingService', () => {
  let service: ShippingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(mongoUrl, {
          dbName: mongoDb,
          readPreference: 'secondaryPreferred',
        }),
        RedisModule.register({
          url: redisUrl,
          isGlobal: true,
        }),
        UserModule,
        MarketModule,
      ],
      providers: [ShippingService],
    }).compile();

    service = module.get<ShippingService>(ShippingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

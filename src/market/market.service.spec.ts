import { Test, TestingModule } from '@nestjs/testing';
import { MarketService } from './market.service';
import { MongooseModule } from '@nestjs/mongoose';
import { mongoUrl, mongoDb } from '../config/env';
import { UserModule } from '../user/user.module';

describe('MarketService', () => {
  let module: TestingModule;
  let service: MarketService;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(mongoUrl, {
          dbName: mongoDb,
          readPreference: 'secondaryPreferred',
        }),
        UserModule,
      ],
      providers: [MarketService],
    }).compile();

    service = module.get<MarketService>(MarketService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getMarket', () => {
    it('should return market by id', async () => {
      const market = await service.getMarket('NY');
      expect(market).toBeDefined();
    });
  });

  afterAll(async () => {
    await module.close();
  });
});

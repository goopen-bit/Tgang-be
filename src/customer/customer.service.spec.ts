import { Test, TestingModule } from '@nestjs/testing';
import { CustomerService } from './customer.service';
import { RedisModule } from '@goopen/nestjs-ioredis-provider';
import { MongooseModule } from '@nestjs/mongoose';
import { mongoUrl, mongoDb, redisUrl } from '../config/env';
import { UserModule } from '../user/user.module';
import { MarketModule } from '../market/market.module';
import { faker } from '@faker-js/faker';
import { AuthTokenData } from '../config/types';
import { UserService } from '../user/user.service';

describe('CustomerService', () => {
  let module: TestingModule;
  let service: CustomerService;
  let userService: UserService;

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
    userService = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOneOrCreate', () => {
    let user: AuthTokenData;
    beforeEach(async () => {
      user = { id: faker.number.int(), username: faker.internet.userName() };
      await userService.findOneOrCreate(user);
    });

    it('should return a list of customers', async () => {
      const customers = await service.findOneOrCreate(user.id, 'NY');
      expect(customers).toBeDefined();
      expect(customers.length).toBeGreaterThan(0);
    });

    it('should return the same list of customers', async () => {
      const customers1 = await service.findOneOrCreate(user.id, 'NY');
      const customers2 = await service.findOneOrCreate(user.id, 'NY');
      expect(customers1).toEqual(customers2);
    });
  });

  afterAll(async () => {
    await module.close();
  });
});

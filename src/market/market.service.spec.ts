import { Test, TestingModule } from '@nestjs/testing';
import { MarketService } from './market.service';
import { MongooseModule } from '@nestjs/mongoose';
import { mongoUrl, mongoDb } from '../config/env';
import { UserModule } from '../user/user.module';
import { faker } from '@faker-js/faker';
import { AuthTokenData } from '../config/types';
import { EProduct } from './market.const';
import { UserService } from '../user/user.service';

describe('MarketService', () => {
  let module: TestingModule;
  let service: MarketService;
  let userService: UserService;

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
    userService = module.get<UserService>(UserService);
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

  describe('buyProduct', () => {
    let user: AuthTokenData;
    beforeEach(async () => {
      user = { id: faker.number.int(), username: faker.internet.userName() };
      await userService.findOneOrCreate(user);
    });

    it('should buy a product', async () => {
      await service.buyProduct(user.id, 'NY', {
        product: EProduct.WEED,
        quantity: 1,
      });
      const updatedUser = await userService.findOne(user.id);
      expect(updatedUser).toBeDefined();
      const product = updatedUser.products.find(
        (p) => p.name === EProduct.WEED,
      );
      expect(product).toBeDefined();
      expect(product.quantity).toBe(1);
    });

    it('should throw an error if not enough cash', async () => {
      await expect(
        service.buyProduct(user.id, 'NY', {
          product: EProduct.WEED,
          quantity: 1000,
        }),
      ).rejects.toThrow('Not enough cash');
    });

    it('should throw an error if product not unlocked', async () => {
      await expect(
        service.buyProduct(user.id, 'NY', {
          product: EProduct.COCAINE,
          quantity: 1,
        }),
      ).rejects.toThrow('Product not unlocked');
    });
  });

  afterAll(async () => {
    await module.close();
  });
});

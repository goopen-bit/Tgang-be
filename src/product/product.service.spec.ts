import { Test, TestingModule } from '@nestjs/testing';
import { ProductService } from './product.service';
import { MongooseModule } from '@nestjs/mongoose';
import { mongoUrl, mongoDb, redisUrl } from '../config/env';
import { UserModule } from '../user/user.module';
import { UserService } from '../user/user.service';
import { faker } from '@faker-js/faker';
import { AuthTokenData } from '../config/types';
import { EProduct } from './product.const';
import { MarketModule } from '../market/market.module';
import { CustomerModule } from '../customer/customer.module';
import { CustomerService } from '../customer/customer.service';
import { RedisModule } from '@goopen/nestjs-ioredis-provider';

describe('ProductService', () => {
  let module: TestingModule;
  let service: ProductService;
  let userService: UserService;
  let customerService: CustomerService;

  let findOneOrCreateSpy: jest.SpyInstance;

  beforeEach(async () => {
    module = await Test.createTestingModule({
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
        CustomerModule,
      ],
      providers: [ProductService],
    }).compile();

    service = module.get<ProductService>(ProductService);
    userService = module.get<UserService>(UserService);
    customerService = module.get<CustomerService>(CustomerService);

    findOneOrCreateSpy = jest
      .spyOn(customerService, 'findOneOrCreate')
      .mockResolvedValue([{ name: 'John Doe', product: EProduct.WEED, quantity: 2, price: 10 }]);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('buyProduct', () => {
    let user: AuthTokenData;
    beforeEach(async () => {
      user = { id: faker.number.int(), username: faker.internet.userName() };
      await userService.findOneOrCreate(user);
    });

    it('should buy a product', async () => {
      await service.buyProduct(user.id, 'NY', { product: EProduct.WEED, quantity: 1 });
      const updatedUser = await userService.findOne(user.id);
      expect(updatedUser).toBeDefined();
      const product = updatedUser.products.find((p) => p.name === EProduct.WEED);
      expect(product).toBeDefined();
      expect(product.quantity).toBe(1);
    });

    it('should throw an error if not enough cash', async () => {
      await expect(service.buyProduct(user.id, 'NY', { product: EProduct.WEED, quantity: 1000 })).rejects.toThrow(
        'Not enough cash',
      );
    });

    it('should throw an error if not enough carry capacity', async () => {
      const u = await userService.findOne(user.id);
      await u.updateOne({ cashAmount: 1000000 });
      await expect(service.buyProduct(user.id, 'NY', { product: EProduct.WEED, quantity: 101 })).rejects.toThrow(
        'Not enough carry capacity',
      );
    });

    it('should throw an error if product not unlocked', async () => {
      await expect(service.buyProduct(user.id, 'NY', { product: EProduct.COCAINE, quantity: 1 })).rejects.toThrow(
        'Product not unlocked',
      );
    });
  });

  describe('sellProduct', () => {
    let user: AuthTokenData;
    beforeEach(async () => {
      user = { id: faker.number.int(), username: faker.internet.userName() };
      await userService.findOneOrCreate(user);
      await service.buyProduct(user.id, 'NY', { product: EProduct.WEED, quantity: 4 });
    });

    it('should sell a product', async () => {
      await service.sellProduct(user.id, 'NY', { name: 'John Doe', product: EProduct.WEED, quantity: 1 });
      const updatedUser = await userService.findOne(user.id);
      expect(updatedUser).toBeDefined();
      const product = updatedUser.products.find((p) => p.name === EProduct.WEED);
      expect(product).toBeDefined();
      expect(product.quantity).toBe(3);

      const customers = await customerService.findOneOrCreate(user.id, 'NY');
      const customer = customers.find((c) => c.name === 'John Doe');
      expect(customer).toBeDefined();
      expect(customer.quantity).toBe(1);
    });
  });

  afterAll(async () => {
    findOneOrCreateSpy.mockRestore();
    await module.close();
  });
});

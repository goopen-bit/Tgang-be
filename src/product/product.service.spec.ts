import { Test, TestingModule } from "@nestjs/testing";
import { ProductService } from "./product.service";
import { MongooseModule } from "@nestjs/mongoose";
import { mongoUrl, mongoDb, redisUrl } from "../config/env";
import { UserModule } from "../user/user.module";
import { UserService } from "../user/user.service";
import { faker } from "@faker-js/faker";
import { AuthTokenData } from "../config/types";
import { EProduct } from "./product.const";
import { MarketModule } from "../market/market.module";
import { CustomerModule } from "../customer/customer.module";
import { REDIS_CLIENT, RedisModule } from "@goopen/nestjs-ioredis-provider";
import Redis from "ioredis";
import { CustomerService } from "../customer/customer.service";
import { CUSTOMER_BATCH_SIZE } from "../customer/customer.const";
import { STARTING_CASH } from "../user/user.const";
import { subMinutes } from "date-fns";

describe("ProductService", () => {
  let module: TestingModule;
  let service: ProductService;
  let userService: UserService;
  let customerService: CustomerService;
  let redis: Redis;

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
        CustomerModule,
      ],
      providers: [ProductService],
    }).compile();

    service = module.get<ProductService>(ProductService);
    userService = module.get<UserService>(UserService);
    customerService = module.get<CustomerService>(CustomerService);
    redis = module.get<Redis>(REDIS_CLIENT);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("buyProduct", () => {
    let user: AuthTokenData;
    beforeEach(async () => {
      user = { id: faker.number.int(), username: faker.internet.userName() };
      await userService.findOneOrCreate(user);
    });

    it("should buy a product", async () => {
      await service.buyProduct(user.id, "NY", {
        product: EProduct.WEED,
        quantity: 1,
      });
      const updatedUser = await userService.findOne(user.id);
      expect(updatedUser).toBeDefined();
      const product = updatedUser.products.find(
        (p) => p.name === EProduct.WEED
      );
      expect(product).toBeDefined();
      expect(product.quantity).toBe(1);
    });

    it("should throw an error if not enough cash", async () => {
      await expect(
        service.buyProduct(user.id, "NY", {
          product: EProduct.WEED,
          quantity: 1000,
        })
      ).rejects.toThrow("Not enough cash");
    });

    it("should throw an error if not enough carry capacity", async () => {
      const u = await userService.findOne(user.id);
      await u.updateOne({ cashAmount: 1000000 });
      await expect(
        service.buyProduct(user.id, "NY", {
          product: EProduct.WEED,
          quantity: 101,
        })
      ).rejects.toThrow("Not enough carry capacity");
    });

    it("should throw an error if product not unlocked", async () => {
      await expect(
        service.buyProduct(user.id, "NY", {
          product: EProduct.COCAINE,
          quantity: 1,
        })
      ).rejects.toThrow("Product not unlocked");
    });
  });

  describe("validateUserDeals", () => {
    let customerIndex;
    beforeAll(async () => {
      const index = customerService.getIndexFromTimeStamp(
        subMinutes(new Date(), 40)
      );
      customerIndex = index * CUSTOMER_BATCH_SIZE;
      const key = customerService.getBatchKey("NY", index);
      const batch = [
        {
          product: EProduct.WEED,
          quantity: 3,
          customerIndex: customerIndex + 0,
        },
        {
          product: EProduct.COCAINE,
          quantity: 1,
          customerIndex: customerIndex + 1,
        },
        {
          product: EProduct.MDMA,
          quantity: 4,
          customerIndex: customerIndex + 2,
        },
        {
          product: EProduct.WEED,
          quantity: 7,
          customerIndex: customerIndex + 3,
        },
        {
          product: EProduct.MDMA,
          quantity: 3,
          customerIndex: customerIndex + 4,
        },
      ];
      await redis.set(key, JSON.stringify(batch), "PX", 10000);
    });

    let user: AuthTokenData;
    beforeEach(async () => {
      user = { id: faker.number.int(), username: faker.internet.userName() };
      const u = await userService.findOneOrCreate(user);
      u.products = [
        {
          name: EProduct.WEED,
          quantity: 10,
          unlocked: true,
        },
        {
          name: EProduct.MDMA,
          quantity: 6,
          unlocked: true,
        },
      ];
      await u.save();
    });

    it("should validate user deals", async () => {
      const res = await service.validateUserDeals(user.id, "NY", [
        customerIndex + 0,
        customerIndex + 2,
      ]);
      expect(res).toBeDefined();
      const userWeed = res.products.find((p) => p.name === EProduct.WEED);
      const userMdma = res.products.find((p) => p.name === EProduct.MDMA);
      expect(userWeed.quantity).toBe(7);
      expect(userMdma.quantity).toBe(2);
      expect(res.cashAmount).toBe(STARTING_CASH + 20 * 3 + 30 * 4);
    });

    it("should skip deals that are not available to customer", async () => {
      const res = await service.validateUserDeals(user.id, "NY", [
        customerIndex + 0,
        customerIndex + 1,
      ]);
      expect(res).toBeDefined();
      const userWeed = res.products.find((p) => p.name === EProduct.WEED);
      const userMdma = res.products.find((p) => p.name === EProduct.MDMA);
      expect(userWeed.quantity).toBe(7);
      expect(userMdma.quantity).toBe(6);
      expect(res.cashAmount).toBe(STARTING_CASH + 20 * 3);
    });

    it("should skip deals that are below quantity", async () => {
      const res = await service.validateUserDeals(user.id, "NY", [
        customerIndex + 2,
        customerIndex + 4,
      ]);
      expect(res).toBeDefined();
      const userWeed = res.products.find((p) => p.name === EProduct.WEED);
      const userMdma = res.products.find((p) => p.name === EProduct.MDMA);
      expect(userWeed.quantity).toBe(10);
      expect(userMdma.quantity).toBe(2);
      expect(res.cashAmount).toBe(STARTING_CASH + 30 * 4);
    });

    it("should ignore deals that are not valid for the user", async () => {
      const res = await service.validateUserDeals(user.id, "NY", [
        customerIndex + 0,
        customerIndex + 1,
        customerIndex + 2,
        customerIndex + 3,
        customerIndex + 4,
      ]);
      expect(res).toBeDefined();
      const userWeed = res.products.find((p) => p.name === EProduct.WEED);
      const userMdma = res.products.find((p) => p.name === EProduct.MDMA);
      expect(userWeed.quantity).toBe(0);
      expect(userMdma.quantity).toBe(2);
      expect(res.cashAmount).toBe(STARTING_CASH + 20 * 10 + 30 * 4);
    });
  });

  afterAll(async () => {
    await module.close();
  });
});

import { Test, TestingModule } from "@nestjs/testing";
import { CustomerService } from "./customer.service";
import { RedisModule } from "@goopen/nestjs-ioredis-provider";
import { MongooseModule } from "@nestjs/mongoose";
import { mongoUrl, mongoDb, redisUrl } from "../config/env";
import { UserModule } from "../user/user.module";
import { MarketModule } from "../market/market.module";
import { UserService } from "../user/user.service";
import { faker } from "@faker-js/faker";
import { User } from "../user/user.schema";

describe("CustomerService", () => {
  let module: TestingModule;
  let service: CustomerService;
  let userService: UserService;
  let user: User;
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
    user = await userService.findOneOrCreate({
      id: faker.number.int(),
      username: faker.internet.userName(),
    } as User);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getCustomerBatch", () => {
    it("should return a list of customers", async () => {
      const batchIndex = service.getIndexFromTimeStamp(new Date());
      const customers = await service.getCustomerBatch(
        "NY",
        batchIndex,
        user.id
      );
      expect(customers).toBeDefined();
      // @note fix that to get a more accurate test but now with random filtering it's hard
      expect(customers.length).toBeGreaterThan(100);
    });
  });
  afterEach(async () => {
    await userService.delete(user.id);
  });
  afterAll(async () => {
    await module.close();
  });
});

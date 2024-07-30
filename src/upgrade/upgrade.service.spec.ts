import { Test, TestingModule } from "@nestjs/testing";
import { UpgradeService } from "./upgrade.service";
import { UserModule } from "../user/user.module";
import { UserService } from "../user/user.service";
import { faker } from "@faker-js/faker";
import { BuyUpgradeDto } from "./dto/buy-upgrade.dto";
import { upgradesData } from "./data/upgrades";
import { User } from "../user/schemas/user.schema";
import { MongooseModule } from "@nestjs/mongoose";
import { mongoUrl, mongoDb, redisUrl } from "../config/env";
import { EUpgradeCategory } from "./upgrade.interface";
import { EProduct } from "../market/market.const";
import { RedisModule } from "@goopen/nestjs-ioredis-provider";

describe("UpgradeService", () => {
  let module: TestingModule;
  let service: UpgradeService;
  let userService: UserService;
  let user: User;
  const maxCash = 9999999999;

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
      ],
      providers: [UpgradeService],
    }).compile();

    service = module.get<UpgradeService>(UpgradeService);
    userService = module.get<UserService>(UserService);
  });

  beforeEach(async () => {
    // Create a user before each test
    user = await userService.findOneOrCreate({
      id: faker.number.int(),
      username: faker.internet.userName(),
    } as User);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("buyUpgrade - PRODUCT", () => {
    it("should buy an upgrade", async () => {
      const params: BuyUpgradeDto = {
        category: EUpgradeCategory.PRODUCT,
        upgrade: EProduct.WEED,
      };
      await userService.update(user.id, { cashAmount: maxCash });
      await service.buyUpgrade(user.id, params);
      const updatedUser = await userService.findOne(user.id);
      const userUpgrade = updatedUser.products.find(
        (u) => u.name === EProduct.WEED
      );
      expect(userUpgrade).toBeDefined();
      expect(userUpgrade.level).toBe(2);
    });

    it("should buy an upgrade that has unlock requirement", async () => {
      const params: BuyUpgradeDto = {
        category: EUpgradeCategory.PRODUCT,
        upgrade: EProduct.COCAINE,
      };
      await userService.update(user.id, {
        products: [
          {
            name: EProduct.WEED,
            level: 5,
            quantity: 0,
            image: "img.jpg",
          },
        ],
      });
      await service.buyUpgrade(user.id, params);
      const updatedUser = await userService.findOne(user.id);
      const userUpgrade = updatedUser.products.find(
        (u) => u.name === EProduct.COCAINE
      );
      expect(userUpgrade).toBeDefined();
      expect(userUpgrade.level).toBe(1);
    });

    it("should throw an error if not enough cash", async () => {
      const params: BuyUpgradeDto = {
        category: EUpgradeCategory.PRODUCT,
        upgrade: EProduct.WEED,
      };
      await userService.update(user.id, { cashAmount: 50 });
      await expect(service.buyUpgrade(user.id, params)).rejects.toThrow(
        "Not enough cash"
      );
    });

    it("should throw an error if upgrade is locked", async () => {
      const params: BuyUpgradeDto = {
        category: EUpgradeCategory.PRODUCT,
        upgrade: EProduct.MUSHROOM,
      };
      await expect(service.buyUpgrade(user.id, params)).rejects.toThrow(
        "Upgrade not unlocked"
      );
    });
  });

  describe("findAll", () => {
    it("should return all upgrades", () => {
      const upgrades = service.findAll();
      expect(upgrades).toEqual(upgradesData);
    });
  });
});

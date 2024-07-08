import { Test, TestingModule } from "@nestjs/testing";
import { UpgradeService } from "./upgrade.service";
import { UserModule } from "../user/user.module";
import { UserService } from "../user/user.service";
import { faker } from "@faker-js/faker";
import { BuyUpgradeDto } from "./dto/buy-upgrade.dto";
import { upgradesData } from "./data/upgrades";
import { User } from "../user/user.schema";
import { MongooseModule } from "@nestjs/mongoose";
import { RedisModule } from "@goopen/nestjs-ioredis-provider";
import { mongoUrl, mongoDb, redisUrl } from "../config/env";

describe("UpgradeService", () => {
  let module: TestingModule;
  let service: UpgradeService;
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
      ],
      providers: [UpgradeService],
    }).compile();

    service = module.get<UpgradeService>(UpgradeService);
    userService = module.get<UserService>(UserService);

    // Create a user before each test
    user = await userService.findOneOrCreate({
      id: faker.number.int(),
      username: faker.internet.userName(),
      cashAmount: 5000,
      reputation: 1,
      products: [],
      upgrades: [],
      carryingGear: [],
    } as User);
  });

  afterEach(async () => {
    // Clean up the user after each test
    await userService.delete(user.id);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("buyUpgrade", () => {
    let upgrade: any;

    beforeEach(() => {
      upgrade = upgradesData[0].upgrades[0];
    });

    it("should buy an upgrade", async () => {
      const params: BuyUpgradeDto = { id: upgrade.id };
      await service.buyUpgrade(user.id, params);

      const updatedUser = await userService.findOne(user.id);
      expect(updatedUser).toBeDefined();
      const userUpgrade = updatedUser.upgrades.find((u) => u.id === upgrade.id);
      expect(userUpgrade).toBeDefined();
      expect(userUpgrade.level).toBe(0);

      await service.buyUpgrade(user.id, params);
      const updatedUser1 = await userService.findOne(user.id);
      expect(updatedUser1).toBeDefined();
      const userUpgrade1 = updatedUser1.upgrades.find(
        (u) => u.id === upgrade.id
      );
      expect(userUpgrade1).toBeDefined();
      expect(userUpgrade1.level).toBe(1);
    });

    it("should throw an error if not enough cash", async () => {
      const params: BuyUpgradeDto = { id: upgrade.id };
      await userService.update(user.id, { cashAmount: 50 });
      await expect(service.buyUpgrade(user.id, params)).rejects.toThrow(
        "Not enough cash"
      );
    });

    it("should throw an error if upgrade already at max level", async () => {
      await userService.update(user.id, { cashAmount: 9999999 });

      await service.buyUpgrade(user.id, { id: upgrade.id });
      await service.buyUpgrade(user.id, { id: upgrade.id });
      await service.buyUpgrade(user.id, { id: upgrade.id });
      await service.buyUpgrade(user.id, { id: upgrade.id });
      await service.buyUpgrade(user.id, { id: upgrade.id });

      const params: BuyUpgradeDto = { id: upgrade.id };
      await expect(service.buyUpgrade(user.id, params)).rejects.toThrow(
        "Upgrade already at max level"
      );
    });

    it("should throw an error if upgrade is locked", async () => {
      const lockedUpgrade = upgradesData[0].upgrades[1]; // Assume this is a locked upgrade
      const params: BuyUpgradeDto = { id: lockedUpgrade.id };
      await expect(service.buyUpgrade(user.id, params)).rejects.toThrow(
        "Upgrade not unlocked"
      );
    });
  });

  describe("findAll and findOne", () => {
    it("should return all upgrades", () => {
      const upgrades = service.findAll();
      expect(upgrades).toEqual(upgradesData);
    });

    it("should return one upgrade by id", () => {
      const upgrade = service.findOne(upgradesData[0].upgrades[0].id);
      expect(upgrade).toBeDefined();
      expect(upgrade.id).toBe(upgradesData[0].upgrades[0].id);
    });
  });
});

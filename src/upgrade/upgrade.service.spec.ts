import { Test, TestingModule } from "@nestjs/testing";
import { UpgradeService } from "./upgrade.service";
import { UserModule } from "../user/user.module";
import { UserService } from "../user/user.service";
import { faker } from "@faker-js/faker";
import { BuyUpgradeDto } from "./dto/buy-upgrade.dto";
import { upgradesData } from "./data/upgrades";
import { User } from "../user/schemas/user.schema";
import { MongooseModule } from "@nestjs/mongoose";
import { RedisModule } from "@goopen/nestjs-ioredis-provider";
import { mongoUrl, mongoDb, redisUrl } from "../config/env";
import { EUpgradeCategory } from "./upgrade.interface";
import { EProduct } from "../product/product.const";

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

    // Create a user before each test
    user = await userService.findOneOrCreate({
      id: faker.number.int(),
      username: faker.internet.userName(),
    } as User);
  });

  afterEach(async () => {
    await userService.delete(user.id);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("buyUpgrade", () => {
    let upgrade: any;

    beforeEach(() => {
      upgrade = upgradesData[EUpgradeCategory.DEALER].upgrades[EProduct.METH];
      upgrade.locked = false;
    });

    it("should buy an upgrade", async () => {
      const params: BuyUpgradeDto = {
        id: upgrade.id,
      };
      await userService.update(user.id, { cashAmount: maxCash });
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
      const params: BuyUpgradeDto = {
        id: upgrade.id,
      };
      await userService.update(user.id, { cashAmount: 50 });
      await expect(service.buyUpgrade(user.id, params)).rejects.toThrow(
        "Not enough cash"
      );
    });

    it("should throw an error if upgrade already at max level", async () => {
      await userService.update(user.id, { cashAmount: maxCash });

      await service.buyUpgrade(user.id, {
        id: upgrade.id,
      });
      await service.buyUpgrade(user.id, {
        id: upgrade.id,
      });
      await service.buyUpgrade(user.id, {
        id: upgrade.id,
      });
      await service.buyUpgrade(user.id, {
        id: upgrade.id,
      });
      await service.buyUpgrade(user.id, {
        id: upgrade.id,
      });

      const params: BuyUpgradeDto = {
        id: upgrade.id,
      };
      await expect(service.buyUpgrade(user.id, params)).rejects.toThrow(
        "Upgrade already at max level"
      );
    });

    it("should throw an error if upgrade is locked", async () => {
      const lockedUpgrade = upgradesData
        .find((category) => category.category === EUpgradeCategory.DEALER)
        .upgrades.find((u) => u.title === "Heroin");
      const params: BuyUpgradeDto = {
        id: lockedUpgrade.id,
      };
      await expect(service.buyUpgrade(user.id, params)).rejects.toThrow(
        "Upgrade not unlocked"
      );
    });

    it("should unlock dependent upgrades when requirements are met", async () => {
      const weedUpgrade = upgradesData
        .find((category) => category.category === EUpgradeCategory.DEALER)
        .upgrades.find((u) => u.title === "Weed");
      const cokeUpgrade = upgradesData
        .find((category) => category.category === EUpgradeCategory.DEALER)
        .upgrades.find((u) => u.title === "Coke");
      const methUpgrade = upgradesData
        .find((category) => category.category === EUpgradeCategory.DEALER)
        .upgrades.find((u) => u.title === "Meth");

      // Set initial cash amount
      await userService.update(user.id, { cashAmount: maxCash });

      // Buy the Weed upgrade to unlock coke
      await service.buyUpgrade(user.id, {
        id: weedUpgrade.id,
      });

      // Buy the Coke upgrade
      await service.buyUpgrade(user.id, {
        id: cokeUpgrade.id,
      });

      // Verify that the Coke upgrade is at level 1
      let updatedUser = await userService.findOne(user.id);
      let userUpgrade = updatedUser.upgrades.find(
        (u) => u.id === cokeUpgrade.id
      );
      expect(userUpgrade).toBeDefined();
      expect(userUpgrade.level).toBe(1);

      // Upgrade the Coke upgrade to level 1
      await service.buyUpgrade(user.id, {
        id: cokeUpgrade.id,
      });

      // Verify that the Coke upgrade is now at level 2
      updatedUser = await userService.findOne(user.id);
      userUpgrade = updatedUser.upgrades.find((u) => u.id === cokeUpgrade.id);
      expect(userUpgrade).toBeDefined();
      expect(userUpgrade.level).toBe(2);

      // Verify that the Coke upgrade is now at level 2
      updatedUser = await userService.findOne(user.id);
      userUpgrade = updatedUser.upgrades.find((u) => u.id === methUpgrade.id);
      expect(userUpgrade).toBeDefined();
      expect(userUpgrade.level).toBe(0);

      // Verify that the Meth upgrade is now unlocked
      const methUserUpgrade = updatedUser.upgrades.find(
        (u) => u.id === methUpgrade.id
      );
      expect(methUserUpgrade).toBeDefined();
      expect(methUserUpgrade.locked).toBe(false);
    });
  });

  describe("findAll and findOne", () => {
    it("should return all upgrades", () => {
      const upgrades = service.findAll();
      expect(upgrades).toEqual(upgradesData);
    });

    it("should return one upgrade by id", () => {
      const upgrade = service.findOne(
        upgradesData[EUpgradeCategory.DEALER].upgrades[EProduct.COCAINE].id
      );
      expect(upgrade).toBeDefined();
      expect(upgrade.id).toBe(
        upgradesData[EUpgradeCategory.DEALER].upgrades[EProduct.COCAINE].id
      );
    });
  });
});

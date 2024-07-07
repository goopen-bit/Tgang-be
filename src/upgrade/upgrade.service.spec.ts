import { Test, TestingModule } from "@nestjs/testing";
import { UpgradeService } from "./upgrade.service";
import { MongooseModule } from "@nestjs/mongoose";
import { mongoUrl, mongoDb, redisUrl } from "../config/env";
import { UserModule } from "../user/user.module";
import { UserService } from "../user/user.service";
import { faker } from "@faker-js/faker";
import { AuthTokenData } from "../config/types";
import { Upgrade, UpgradeSchema } from "./upgrade.schema";
import { RedisModule } from "@goopen/nestjs-ioredis-provider";
import { BuyUpgradeDto } from "./dto/buy-upgrade.dto";

describe("UpgradeService", () => {
  let module: TestingModule;
  let service: UpgradeService;
  let userService: UserService;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(mongoUrl, {
          dbName: mongoDb,
          readPreference: "secondaryPreferred",
        }),
        MongooseModule.forFeature([
          { name: Upgrade.name, schema: UpgradeSchema },
        ]),
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

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("buyUpgrade", () => {
    let user: AuthTokenData;
    let upgrade: Upgrade;

    beforeEach(async () => {
      user = { id: faker.number.int(), username: faker.internet.userName() };
      await userService.findOneOrCreate(user);
      await userService.update(user.id, { cashAmount: 5000 });

      upgrade = await service.create({
        id: 123,
        title: "Coka",
        description: "Increase the number of item to carry",
        level: 0,
        maxLevel: 5,
        levelPrices: [100, 200, 300, 400, 500],
        value: [0.9, 0.86, 0.85, 0.82, 0.8, 0.75],
        image: "/assets/cc.png",
        locked: false,
        group: "product",
        requirement: null,
      });
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
      expect(updatedUser).toBeDefined();
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
      // Create a locked upgrade
      const lockedUpgrade = await service.create({
        id: 456,
        title: "Meta",
        description: "Increase the number of item to carry",
        level: 0,
        maxLevel: 5,
        levelPrices: [200, 400, 600, 800, 1000],
        value: [0.9, 0.86, 0.85, 0.82, 0.8, 0.75],
        image: "/assets/meth.png",
        locked: true,
        group: "product",
        requirement: { title: "Coke", level: 1 },
      });

      const params: BuyUpgradeDto = { id: lockedUpgrade.id };
      await expect(service.buyUpgrade(user.id, params)).rejects.toThrow(
        "Upgrade not unlocked"
      );
    });

    afterEach(async () => {
      await service.delete(upgrade.id);
      await userService.delete(user.id);
    });
  });

  describe("findAll and findOne", () => {
    let upgrade1: Upgrade;
    let upgrade2: Upgrade;

    beforeEach(async () => {
      upgrade1 = await service.create({
        id: 789,
        title: "Weed_lab",
        description: "Start your weed production",
        level: 0,
        maxLevel: 5,
        levelPrices: [200, 400, 600, 800, 1000],
        value: [0.9, 0.86, 0.85, 0.82, 0.8, 0.75],
        image: "https://test.jpg",
        locked: false,
        group: "production",
        requirement: null,
      });

      upgrade2 = await service.create({
        id: 101,
        title: "Workout",
        description: "Increase your health score",
        level: 0,
        maxLevel: 5,
        levelPrices: [200, 400, 600, 800, 1000],
        value: [0.9, 0.86, 0.85, 0.82, 0.8, 0.75],
        image: "https://test.jpg",
        locked: false,
        group: "stats",
        requirement: null,
      });
    });

    it("should return all upgrades", async () => {
      const upgrades = await service.findAll();
      expect(upgrades.length).toBeGreaterThanOrEqual(2);
      expect(upgrades).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: 789 }),
          expect.objectContaining({ id: 101 }),
        ])
      );
    });

    it("should return one upgrade by id", async () => {
      const upgrade = await service.findOne(upgrade1.id);
      expect(upgrade).toBeDefined();
      expect(upgrade.id).toBe(upgrade1.id);
    });

    afterEach(async () => {
      await service.delete(upgrade1.id);
      await service.delete(upgrade2.id);
    });
  });

  afterAll(async () => {
    await service.delete(456);
    await module.close();
  });
});

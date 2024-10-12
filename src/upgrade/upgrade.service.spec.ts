import { Test, TestingModule } from "@nestjs/testing";
import { UpgradeService } from "./upgrade.service";
import { UserModule } from "../user/user.module";
import { UserService } from "../user/user.service";
import { faker } from "@faker-js/faker";
import { BuyUpgradeDto } from "./dto/buy-upgrade.dto";
import { upgradesData } from "./data/upgrades";
import { User } from "../user/schemas/user.schema";
import { EUpgradeCategory } from "./upgrade.interface";
import { EProduct } from "../market/market.const";
import { mockTokenData } from "../../test/utils/user";
import { MarketModule } from "../market/market.module";
import { appConfigImports } from '../config/app';

describe("UpgradeService", () => {
  let module: TestingModule;
  let service: UpgradeService;
  let userService: UserService;
  let user: User;
  const maxCash = 9999999999;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        ...appConfigImports,
        MarketModule,
        UserModule,
      ],
      providers: [UpgradeService],
    }).compile();

    service = module.get<UpgradeService>(UpgradeService);
    userService = module.get<UserService>(UserService);
  });

  beforeEach(async () => {
    // Create a user before each test
    const res = await userService.findOneOrCreate(
      mockTokenData(),
      faker.internet.ip()
    );
    user = res.user;
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("buyUpgrade - PRODUCT", () => {
    it("should buy an upgrade", async () => {
      const params: BuyUpgradeDto = {
        category: EUpgradeCategory.PRODUCT,
        upgrade: EProduct.HERB,
      };
      await userService.update(user.id, { cashAmount: maxCash });
      await service.buyUpgrade(user.id, params);
      const updatedUser = await userService.findOne(user.id);
      const userUpgrade = updatedUser.products.find(
        (u) => u.name === EProduct.HERB
      );
      expect(userUpgrade).toBeDefined();
      expect(userUpgrade.level).toBe(2);
    });

    it("should buy an upgrade that has unlock requirement", async () => {
      const params: BuyUpgradeDto = {
        category: EUpgradeCategory.PRODUCT,
        upgrade: EProduct.MUSHROOM,
      };
      await userService.update(user.id, {
        products: [
          {
            name: EProduct.HERB,
            level: 5,
            quantity: 0,
            image: "img.jpg",
          },
        ],
      });
      await service.buyUpgrade(user.id, params);
      const updatedUser = await userService.findOne(user.id);
      const userUpgrade = updatedUser.products.find(
        (u) => u.name === EProduct.MUSHROOM
      );
      expect(userUpgrade).toBeDefined();
      expect(userUpgrade.level).toBe(1);
    });

    it("should throw an error if not enough cash", async () => {
      const params: BuyUpgradeDto = {
        category: EUpgradeCategory.PRODUCT,
        upgrade: EProduct.HERB,
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

    it("should throw error if not enough time has passed since previous upgrade", async () => {
      const params: BuyUpgradeDto = {
        category: EUpgradeCategory.PRODUCT,
        upgrade: EProduct.HERB,
      };
      await service.buyUpgrade(user.id, params);
      await expect(
        service.buyUpgrade(user.id, params)
      ).rejects.toThrow("Upgrade not available yet");
    });
  });

  describe("findAll", () => {
    it("should return all upgrades", () => {
      const upgrades = service.findAll();
      expect(upgrades).toEqual(upgradesData);
    });
  });
});

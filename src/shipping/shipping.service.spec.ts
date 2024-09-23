import { Test, TestingModule } from "@nestjs/testing";
import { ShippingService } from "./shipping.service";
import { MarketModule } from "../market/market.module";
import { UserModule } from "../user/user.module";
import { AuthTokenData } from "../config/types";
import { faker } from "@faker-js/faker";
import { UserService } from "../user/user.service";
import { EShippingMethod } from "./shipping.const";
import { mockTokenData } from "../../test/utils/user";
import { appConfigImports } from '../config/app';

describe("ShippingService", () => {
  let service: ShippingService;
  let userService: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ...appConfigImports,
        UserModule,
        MarketModule,
      ],
      providers: [ShippingService],
    }).compile();

    service = module.get<ShippingService>(ShippingService);
    userService = module.get<UserService>(UserService);
  });

  let user: AuthTokenData;
  beforeEach(async () => {
    user = mockTokenData();
    const { user: u } = await userService.findOneOrCreate(user, faker.internet.ip());
    u.cashAmount = 1000000;
    await u.save();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("buyShippingUpgrade", () => {
    it("should buy a shipping upgrade", async () => {
      await service.buyShippingUpgrade(user.id, EShippingMethod.ENVELOPE);
      const updatedUser = await userService.findOne(user.id);
      expect(updatedUser.shipping.length).toBeGreaterThan(0);
      expect(updatedUser.cashAmount).toBeLessThan(1000000);
    });

    it("should throw error if not enough money", async () => {
      const u = await userService.findOne(user.id);
      u.cashAmount = 10;
      await u.save();
      await expect(
        service.buyShippingUpgrade(user.id, EShippingMethod.ENVELOPE)
      ).rejects.toThrow("Not enough cash");
    });

    it("should throw error if upgrade already bought", async () => {
      await service.buyShippingUpgrade(user.id, EShippingMethod.ENVELOPE);
      await expect(
        service.buyShippingUpgrade(user.id, EShippingMethod.ENVELOPE)
      ).rejects.toThrow("Upgrade already bought");
    });

    it("should throw error if not enough referred users", async () => {
      const u = await userService.findOne(user.id);
      u.referredUsers = [];
      await u.save();
      await expect(
        service.buyShippingUpgrade(user.id, EShippingMethod.CONTAINER)
      ).rejects.toThrow("Invite 2 users to upgrade");
    });
  });

  describe("upgradEShippingMethodCapacity", () => {
    it("should upgrade shipping capacity", async () => {
      await service.buyShippingUpgrade(user.id, EShippingMethod.ENVELOPE);
      await service.upgradeShippingCapacity(user.id, EShippingMethod.ENVELOPE);
      const updatedUser = await userService.findOne(user.id);
      const userShipping = updatedUser.shipping.find(
        (u) => u.method === EShippingMethod.ENVELOPE
      );
      expect(userShipping.capacityLevel).toBe(2);
      expect(updatedUser.cashAmount).toBeLessThan(1000000);
    });

    it("should throw error if not enough money", async () => {
      const u = await userService.findOne(user.id);
      await service.buyShippingUpgrade(user.id, EShippingMethod.ENVELOPE);
      u.cashAmount = 10;
      await u.save();
      await expect(
        service.upgradeShippingCapacity(user.id, EShippingMethod.ENVELOPE)
      ).rejects.toThrow("Not enough cash");
    });

    it("should throw error if upgrade not bought", async () => {
      await expect(
        service.upgradeShippingCapacity(user.id, EShippingMethod.ENVELOPE)
      ).rejects.toThrow("Upgrade not bought");
    });

    it("should throw error if not enough referred users", async () => {
      const u = await userService.findOne(user.id);
      u.referredUsers = [];
      await u.save();
      await expect(
        service.upgradeShippingCapacity(user.id, EShippingMethod.PLANE)
      ).rejects.toThrow("Upgrade not bought");
    });
  });

  describe("upgradShippingTime", () => {
    it("should upgrade shipping time", async () => {
      await service.buyShippingUpgrade(user.id, EShippingMethod.ENVELOPE);
      await service.upgradeShippingTime(user.id, EShippingMethod.ENVELOPE);
      const updatedUser = await userService.findOne(user.id);
      const userShipping = updatedUser.shipping.find(
        (u) => u.method === EShippingMethod.ENVELOPE
      );
      expect(userShipping.shippingTimeLevel).toBe(2);
      expect(updatedUser.cashAmount).toBeLessThan(1000000);
    });

    it("should throw error if not enough money", async () => {
      const u = await userService.findOne(user.id);
      await service.buyShippingUpgrade(user.id, EShippingMethod.ENVELOPE);
      u.cashAmount = 10;
      await u.save();
      await expect(
        service.upgradeShippingTime(user.id, EShippingMethod.ENVELOPE)
      ).rejects.toThrow("Not enough cash");
    });

    it("should throw error if upgrade not bought", async () => {
      await expect(
        service.upgradeShippingTime(user.id, EShippingMethod.ENVELOPE)
      ).rejects.toThrow("Upgrade not bought");
    });

    it("should throw error if not enough referred users", async () => {
      const u = await userService.findOne(user.id);
      u.referredUsers = [];
      await u.save();
      await expect(
        service.upgradeShippingTime(user.id, EShippingMethod.PLANE)
      ).rejects.toThrow("Upgrade not bought");
    });
  });
});

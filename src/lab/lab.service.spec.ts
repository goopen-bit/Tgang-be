import { Test, TestingModule } from "@nestjs/testing";
import { MongooseModule } from "@nestjs/mongoose";
import { LabService } from "./lab.service";
import { UserModule } from "../user/user.module";
import { User, UserSchema } from "../user/schemas/user.schema";
import { faker } from "@faker-js/faker";
import { AuthTokenData } from "../config/types";
import { UserService } from "../user/user.service";
import { EProduct } from "../market/market.const";
import { subHours } from "date-fns";
import { mockTokenData } from "../../test/utils/user";
import { appConfigImports } from '../config/app';
import { ECRAFTABLE_ITEM } from './craftable_item.const';

describe("LabService", () => {
  let module: TestingModule;
  let service: LabService;
  let userService: UserService;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        ...appConfigImports,
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
        UserModule,
      ],
      providers: [LabService],
    }).compile();

    service = module.get<LabService>(LabService);
    userService = module.get<UserService>(UserService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("buyLabPlot", () => {
    let user: AuthTokenData;
    beforeEach(async () => {
      user = mockTokenData();
      const { user: u } = await userService.findOneOrCreate(user, faker.internet.ip());
      u.cashAmount = 1000000;
      await u.save();
    });

    it("should buy a lab plot", async () => {
      await service.buyLabPlot(user.id);
      const updatedUser = await userService.findOne(user.id);
      expect(updatedUser.labPlots.length).toBeGreaterThan(0);
      expect(updatedUser.cashAmount).toBeLessThan(1000000);
    });

    it("should throw error if not enough money", async () => {
      const u = await userService.findOne(user.id);
      u.cashAmount = 100;
      await u.save();
      await expect(service.buyLabPlot(user.id)).rejects.toThrow(
        "Not enough money"
      );
    });
  });

  describe("buyLab", () => {
    let user: AuthTokenData;
    beforeEach(async () => {
      user = mockTokenData();
      const { user: u } = await userService.findOneOrCreate(user, faker.internet.ip());
      u.cashAmount = 1000000;
      u.labPlots = [{ plotId: 1 }];
      await u.save();
    });

    it("should buy a lab", async () => {
      await service.buyLabPlot(user.id);
      await service.buyLab(user.id, { labProduct: EProduct.HERB, plotId: 1 });
      const updatedUser = await userService.findOne(user.id);
      expect(updatedUser.labPlots[0].lab).toBeDefined();
      expect(updatedUser.cashAmount).toBeLessThan(1000000);
    });

    it("should throw error if plot is not empty", async () => {
      await service.buyLab(user.id, { labProduct: EProduct.HERB, plotId: 1 });
      await expect(
        service.buyLab(user.id, { labProduct: EProduct.HERB, plotId: 1 })
      ).rejects.toThrow("Plot is not empty");
    });

    it("should throw error if not enough money", async () => {
      const u = await userService.findOne(user.id);
      u.cashAmount = 100;
      await u.save();
      await expect(
        service.buyLab(user.id, { labProduct: EProduct.HERB, plotId: 1 })
      ).rejects.toThrow("Not enough money");
    });
  });

  describe("upgradeLabCapacity", () => {
    let user: AuthTokenData;
    beforeEach(async () => {
      user = mockTokenData();
      const { user: u } = await userService.findOneOrCreate(user, faker.internet.ip());
      u.cashAmount = 1000000;
      u.labPlots = [
        {
          plotId: 1,
          lab: {
            product: EProduct.HERB,
            title: "HERB",
            image: "HERB.png",
            capacityLevel: 1,
            productionLevel: 1,
            collectTime: new Date(),
          },
        },
      ];
      await u.save();
    });

    it("should upgrade lab capacity", async () => {
      await service.upgradeLabCapacity(user.id, 1);
      const updatedUser = await userService.findOne(user.id);
      expect(updatedUser.labPlots[0].lab.capacityLevel).toBeGreaterThan(1);
      expect(updatedUser.cashAmount).toBeLessThan(1000000);
    });

    it("should throw error if not enough money", async () => {
      const u = await userService.findOne(user.id);
      u.cashAmount = 100;
      await u.save();
      await expect(service.upgradeLabCapacity(user.id, 1)).rejects.toThrow(
        "Not enough money"
      );
    });

    it("should throw error if plot is empty", async () => {
      const u = await userService.findOne(user.id);
      u.labPlots.push({ plotId: 2 });
      await u.save();
      await expect(service.upgradeLabCapacity(user.id, 2)).rejects.toThrow(
        "Plot is empty"
      );
    });
  });

  describe("upgradeLabProduction", () => {
    let user: AuthTokenData;
    beforeEach(async () => {
      user = mockTokenData();
      const { user: u } = await userService.findOneOrCreate(user, faker.internet.ip());
      u.cashAmount = 1000000;
      u.labPlots = [
        {
          plotId: 1,
          lab: {
            product: EProduct.HERB,
            title: "HERB",
            image: "HERB.png",
            capacityLevel: 1,
            productionLevel: 1,
            collectTime: new Date(),
          },
        },
      ];
      await u.save();
    });

    it("should upgrade lab production", async () => {
      await service.upgradeLabProduction(user.id, 1);
      const updatedUser = await userService.findOne(user.id);
      expect(updatedUser.labPlots[0].lab.productionLevel).toBeGreaterThan(1);
      expect(updatedUser.cashAmount).toBeLessThan(1000000);
    });

    it("should throw error if not enough money", async () => {
      const u = await userService.findOne(user.id);
      u.cashAmount = 100;
      await u.save();
      await expect(service.upgradeLabProduction(user.id, 1)).rejects.toThrow(
        "Not enough money"
      );
    });

    it("should throw error if plot is empty", async () => {
      const u = await userService.findOne(user.id);
      u.labPlots.push({ plotId: 2 });
      await u.save();
      await expect(service.upgradeLabProduction(user.id, 2)).rejects.toThrow(
        "Plot is empty"
      );
    });
  });

  describe("collectLabProduction", () => {
    let user: AuthTokenData;
    beforeEach(async () => {
      user = mockTokenData();
      const { user: u } = await userService.findOneOrCreate(user, faker.internet.ip());
      u.cashAmount = 100;
      u.labPlots = [
        {
          plotId: 1,
          lab: {
            product: EProduct.HERB,
            title: "HERB",
            image: "HERB.png",
            capacityLevel: 1,
            productionLevel: 1,
            collectTime: subHours(new Date(), 1),
          },
        },
      ];
      await u.save();
    });

    it("should collect lab production", async () => {
      await service.collectLabProduction(user.id, 1);
      const updatedUser = await userService.findOne(user.id);
      const lab = updatedUser.labPlots[0].lab;
      expect(lab.produced).toBe(0);
      const product = updatedUser.products.find(
        (p) => p.name === EProduct.HERB
      );
      expect(product.quantity).toBe(160);
    });
  });

  describe("craftItem", () => {
    let user: AuthTokenData;
    beforeEach(async () => {
      user = mockTokenData();
      const { user: u } = await userService.findOneOrCreate(user, faker.internet.ip());
      u.products = [
        {
          name: EProduct.HERB, quantity: 10,
          level: 0
        },
        {
          name: EProduct.MUSHROOM, quantity: 10,
          level: 0
        },
      ];
      await u.save();
    });

    it("should craft an item", async () => {
      await service.craftItem(user.id, ECRAFTABLE_ITEM.BOOSTER_ATTACK_2, 2);
      const updatedUser = await userService.findOne(user.id);
      
      const craftedItem = updatedUser.craftedItems.find(item => item.itemId === ECRAFTABLE_ITEM.BOOSTER_ATTACK_2);
      expect(craftedItem).toBeDefined();
      expect(craftedItem.quantity).toBe(2);

      const herb = updatedUser.products.find(p => p.name === EProduct.HERB);
      expect(herb.quantity).toBe(6); // 10 - (2 * 2)

      const mushroom = updatedUser.products.find(p => p.name === EProduct.MUSHROOM);
      expect(mushroom.quantity).toBe(8); // 10 - (1 * 2)
    });

    it("should stack crafted items", async () => {
      await service.craftItem(user.id, ECRAFTABLE_ITEM.BOOSTER_ATTACK_2, 1);
      await service.craftItem(user.id, ECRAFTABLE_ITEM.BOOSTER_ATTACK_2, 2);

      const updatedUser = await userService.findOne(user.id);
      const craftedItem = updatedUser.craftedItems.find(item => item.itemId === ECRAFTABLE_ITEM.BOOSTER_ATTACK_2);
      expect(craftedItem.quantity).toBe(3);
    });

    it("should throw error if not enough resources", async () => {
      await expect(service.craftItem(user.id, ECRAFTABLE_ITEM.BOOSTER_ATTACK_2, 10)).rejects.toThrow(
        "Not enough Herb"
      );
    });
  });

  afterAll(async () => {
    await module.close();
  });
});

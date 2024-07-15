import { Test, TestingModule } from "@nestjs/testing";
import { MongooseModule } from "@nestjs/mongoose";
import { mongoUrl, mongoDb } from "../config/env";
import { LabService } from "./lab.service";
import { UserModule } from "../user/user.module";
import { User, UserSchema } from "../user/schemas/user.schema";
import { faker } from "@faker-js/faker";
import { AuthTokenData } from "../config/types";
import { UserService } from "../user/user.service";
import { EProduct } from "../product/product.const";
import { subHours, subMinutes } from "date-fns";

describe("LabService", () => {
  let module: TestingModule;
  let service: LabService;
  let userService: UserService;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(mongoUrl, {
          dbName: mongoDb,
          readPreference: "secondaryPreferred",
        }),
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
      user = { id: faker.number.int(), username: faker.internet.userName() };
      const u = await userService.findOneOrCreate(user);
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
      user = { id: faker.number.int(), username: faker.internet.userName() };
      const u = await userService.findOneOrCreate(user);
      u.cashAmount = 1000000;
      u.labPlots = [{ plotId: 1 }];
      await u.save();
    });

    it("should buy a lab", async () => {
      await service.buyLabPlot(user.id);
      await service.buyLab(user.id, { labProduct: EProduct.WEED, plotId: 1 });
      const updatedUser = await userService.findOne(user.id);
      expect(updatedUser.labPlots[0].lab).toBeDefined();
      expect(updatedUser.cashAmount).toBeLessThan(1000000);
    });

    it("should throw error if plot is not empty", async () => {
      await service.buyLab(user.id, { labProduct: EProduct.WEED, plotId: 1 });
      await expect(
        service.buyLab(user.id, { labProduct: EProduct.WEED, plotId: 1 })
      ).rejects.toThrow("Plot is not empty");
    });

    it("should throw error if not enough money", async () => {
      const u = await userService.findOne(user.id);
      u.cashAmount = 100;
      await u.save();
      await expect(
        service.buyLab(user.id, { labProduct: EProduct.WEED, plotId: 1 })
      ).rejects.toThrow("Not enough money");
    });
  });

  describe("upgradeLabCapacity", () => {
    let user: AuthTokenData;
    beforeEach(async () => {
      user = { id: faker.number.int(), username: faker.internet.userName() };
      const u = await userService.findOneOrCreate(user);
      u.cashAmount = 1000000;
      u.labPlots = [
        {
          plotId: 1,
          lab: {
            product: EProduct.WEED,
            title: "Weed",
            image: "weed.png",
            capacityLevel: 1,
            productionLevel: 1,
            collectTime: new Date(),
            leftover: 0,
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
      user = { id: faker.number.int(), username: faker.internet.userName() };
      const u = await userService.findOneOrCreate(user);
      u.cashAmount = 1000000;
      u.labPlots = [
        {
          plotId: 1,
          lab: {
            product: EProduct.WEED,
            title: "Weed",
            image: "weed.png",
            capacityLevel: 1,
            productionLevel: 1,
            collectTime: new Date(),
            leftover: 0,
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
      user = { id: faker.number.int(), username: faker.internet.userName() };
      const u = await userService.findOneOrCreate(user);
      u.cashAmount = 100;
      u.labPlots = [
        {
          plotId: 1,
          lab: {
            product: EProduct.WEED,
            title: "Weed",
            image: "weed.png",
            capacityLevel: 1,
            productionLevel: 1,
            collectTime: subHours(new Date(), 1),
            leftover: 0,
          },
        },
      ];
      await u.save();
    });

    it("should collect lab production", async () => {
      await service.collectLabProduction(user.id, 1);
      const updatedUser = await userService.findOne(user.id);
      const lab = updatedUser.labPlots[0].lab;
      expect(lab.leftover).toBe(0);
      expect(lab.produced).toBe(0);
      expect(updatedUser.carryAmount).toBe(10);
      const product = updatedUser.products.find(
        (p) => p.name === EProduct.WEED
      );
      expect(product.quantity).toBe(10);
    });

    it("should collect lab production and save leftover", async () => {
      const u = await userService.findOne(user.id);
      u.products.push({ name: EProduct.COCAINE, quantity: 96, unlocked: true });
      await u.save();
      await service.collectLabProduction(user.id, 1);
      const updatedUser = await userService.findOne(user.id);
      const lab = updatedUser.labPlots[0].lab;
      expect(lab.leftover).toBe(6);
      expect(lab.produced).toBe(6);
      expect(updatedUser.carryAmount).toBe(100);
      const product = updatedUser.products.find(
        (p) => p.name === EProduct.WEED
      );
      expect(product.quantity).toBe(4);
    });
  });

  afterAll(async () => {
    await module.close();
  });
});

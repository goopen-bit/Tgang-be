import { Test, TestingModule } from "@nestjs/testing";
import { faker } from "@faker-js/faker";
import { UserService } from "./user.service";
import { mongoUrl, mongoDb, mixpanelToken } from "../config/env";
import { User, UserSchema } from "./schemas/user.schema";
import { mockTokenData } from "../../test/utils/user";
import { AnalyticsModule } from "../analytics/analytics.module";
import { MongooseModule, getModelToken } from "@nestjs/mongoose";
import { Model } from "mongoose";

import { EProduct } from "../market/market.const";
import { upgradesData } from "../upgrade/data/upgrades";
import { STARTING_CASH } from "./user.const";

export const createMockUser = (overrides = {}): Partial<User> => {
  const HERB = upgradesData.product[EProduct.HERB];

  return {
    id: 123,
    username: "testuser",
    isPremium: false,
    cashAmount: STARTING_CASH,
    reputation: 1,
    products: [
      {
        name: EProduct.HERB,
        quantity: 100,
        title: HERB.title,
        image: HERB.image,
        level: 1,
      },
    ],
    ...overrides,
  };
};

describe("UserService", () => {
  let module: TestingModule;
  let service: UserService;
  let userModel: Model<User>;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(mongoUrl, {
          dbName: mongoDb,
          readPreference: "secondaryPreferred",
        }),
        AnalyticsModule.register({
          mixpanelToken: mixpanelToken,
          isGlobal: true,
        }),
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
      ],
      providers: [UserService],
    }).compile();

    service = module.get<UserService>(UserService);
    userModel = module.get<Model<User>>(getModelToken(User.name));
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("findOneOrCreate", () => {
    it("should create new user", async () => {
      const params = mockTokenData();
      const { user: res } = await service.findOneOrCreate(
        params,
        faker.internet.ip(),
      );
      expect(res.id).toBe(params.id);
      expect(res.username).toBe(params.username);
      expect(res.cashAmount).toBe(STARTING_CASH);
      expect(res.products.length).toBeGreaterThan(0);
      await service.delete(params.id);
    });

    it("should create new user", async () => {
      const params = mockTokenData();
      const { user } = await service.findOneOrCreate(
        params,
        faker.internet.ip(),
      );
      await user.updateOne({
        $inc: { cashAmount: faker.number.int({ min: 10, max: 100 }) },
      });

      const { user: res } = await service.findOneOrCreate(
        params,
        faker.internet.ip(),
      );
      expect(res.id).toBe(params.id);
      expect(res.username).toBe(params.username);
      expect(res.cashAmount).toBeGreaterThan(STARTING_CASH);
      await service.delete(params.id);
    });

    //@note add a test to check that product and upgrades are initialised properly
  });

  describe("dailyRobbery", () => {
    let user: User;

    beforeEach(async () => {
      const res = await service.findOneOrCreate(
        mockTokenData(),
        faker.internet.ip(),
      );
      user = res.user;
    });
    afterEach(async () => {
      await service.delete(user.id);
    });
    it("should initialize lastRobbery and robberyStrike if no previous robbery", async () => {
      user.lastRobbery = null;
      user.robberyStrike = 0;
      user.cashAmount = 0;
      await service.update(user.id, user);
      const result = await service.dailyRobbery(user.id);

      expect(result.lastRobbery).toBeInstanceOf(Date);
      expect(result.robberyStrike).toBe(1);
      expect(result.cashAmount).toBe(1000);
    });

    it("should throw an error if trying to claim reward again on the same day", async () => {
      user.lastRobbery = new Date();
      user.robberyStrike = 0;
      user.cashAmount = 1000;
      await service.update(user.id, user);

      await expect(service.dailyRobbery(user.id)).rejects.toThrow(
        "You can only claim the reward once per day.",
      );
    });

    it("should increase robberyStrike and cashAmount if robbery within 24 hours but on a different day", async () => {
      const now = new Date();
      const lastRobbery = new Date(now.getTime() - 23 * 60 * 60 * 1000); // 23 hours ago
      user.lastRobbery = lastRobbery;
      user.robberyStrike = 1;
      user.cashAmount = 1000;
      await service.update(user.id, user);

      const result = await service.dailyRobbery(user.id);

      expect(result.robberyStrike).toBe(2);
      expect(result.cashAmount).toBe(3000);
    });

    it("should reset robberyStrike if robbery after 24 hours", async () => {
      const now = new Date();
      const lastRobbery = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
      user.lastRobbery = lastRobbery;
      user.robberyStrike = 1;
      user.cashAmount = 1000;
      await service.update(user.id, user);

      const result = await service.dailyRobbery(user.id);
      expect(result.robberyStrike).toBe(1);
      expect(result.cashAmount).toBe(2000);
    });
  });

  describe("findPvpPlayers", () => {
    it("should return a list of PvP-enabled players who haven't been attacked today", async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const users = [
        createMockUser({
          id: 123,
          username: "player1",
          cashAmount: 1000,
          pvp: { pvpEnabled: true, lastDefend: yesterday },
        }),
        createMockUser({
          id: 456,
          username: "player2",
          cashAmount: 2000,
          pvp: { pvpEnabled: true },
        }),
        createMockUser({
          id: 789,
          username: "player3",
          cashAmount: 3000,
          pvp: { pvpEnabled: true, lastDefend: new Date() },
        }),
        createMockUser({
          id: 101,
          username: "player4",
          cashAmount: 1500,
          pvp: { pvpEnabled: false },
        }),
      ];

      for (const user of users) {
        await userModel.create(user);
      }
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const result = await service.findPvpPlayers(today);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(456);
      expect(result[1].id).toBe(123);
      expect(result.every((player) => player.pvp.pvpEnabled)).toBe(true);
      expect(
        result.every(
          (player) =>
            !player.pvp.lastDefend ||
            player.pvp.lastDefend < new Date().setHours(0, 0, 0, 0),
        ),
      ).toBe(true);
    });
  });

  afterAll(async () => {
    await module.close();
  });
});

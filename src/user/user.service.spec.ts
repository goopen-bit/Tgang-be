import { Test, TestingModule } from "@nestjs/testing";
import { faker } from "@faker-js/faker";
import { UserService } from "./user.service";
import { User, UserSchema } from "./schemas/user.schema";
import { mockTokenData } from "../../test/utils/user";
import { MongooseModule, getModelToken } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { EProduct } from "../market/market.const";
import { upgradesData } from "../upgrade/data/upgrades";
import { STARTING_CASH } from "./user.const";
import { addDays, subDays, subHours } from "date-fns";
import { appConfigImports } from "../config/app";
import { UniqueEnforcer } from "enforce-unique";
import {
  PVP_BASE_HEALTH_POINTS,
  PVP_BASE_PROTECTION,
  PVP_BASE_DAMAGE,
  PVP_BASE_ACCURACY,
  PVP_BASE_EVASION,
  PVP_BASE_CRITICAL_HIT_CHANCE,
} from "./user.const";
import { EAchievement, Achievement } from "./data/achievements";
import { HttpException, HttpStatus } from "@nestjs/common";

const uniqueEnforcerUserId = new UniqueEnforcer();

export const createMockUser = (overrides = {}): Partial<User> => {
  const HERB = upgradesData.product[EProduct.HERB];

  return {
    id: uniqueEnforcerUserId.enforce(faker.number.int()),
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
        ...appConfigImports,
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

    it("should throw if robbery is not within 24h", async () => {
      const now = new Date();
      const lastRobbery = subHours(now, 23);
      user.lastRobbery = lastRobbery;
      user.robberyStrike = 1;
      user.cashAmount = 1000;
      await service.update(user.id, user);

      await expect(service.dailyRobbery(user.id)).rejects.toThrow();
    });

    it("should reset robberyStrike if robbery after 24 hours", async () => {
      const now = new Date();
      const lastRobbery = subDays(now, 2);
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
    const uids: number[] = [];

    it("should return a list of PvP-enabled players who haven't been attacked today", async () => {
      const yesterday = subDays(new Date(), 1);

      const users = [
        createMockUser({
          username: "player1",
          cashAmount: 1000,
          reputation: 10000,
          pvp: { lastDefendDate: yesterday },
        }),
        createMockUser({
          username: "player2",
          cashAmount: 2000,
          reputation: 10000,
        }),
        createMockUser({
          username: "player3",
          cashAmount: 3000,
          reputation: 10000,
          pvp: { lastDefendDate: new Date() },
        }),
        createMockUser({
          username: "player4",
          cashAmount: 1500,
          reputation: 100,
        }),
      ];

      for (const user of users) {
        const userId = faker.number.int({ min: 1000 });
        uids.push(userId);
        await userModel.create({
          ...user,
          id: userId,
        });
      }
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const result = await service.findPvpPlayers(today, 666, []);

      expect(result).toHaveLength(1);
      const player1 = result[0];
      expect(player1).toBeDefined();
      expect(
        result.every(
          (player) =>
            !player.pvp?.lastDefendDate ||
            player.pvp.lastDefendDate < new Date().setHours(0, 0, 0, 0),
        ),
      ).toBe(true);
    });

    it("should return player with all PvP fields", async () => {
      const yesterday = subDays(new Date(), 1);

      const users = [
        createMockUser({
          username: "player1",
          cashAmount: 1000,
          reputation: 10001,
          pvp: { lastDefendDate: yesterday },
        }),
        createMockUser({
          username: "player2",
          cashAmount: 2000,
          reputation: 10000,
        }),
      ];

      for (const user of users) {
        const userId = faker.number.int({ min: 1000 });
        uids.push(userId);
        await userModel.create({
          ...user,
          id: userId,
        });
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const result = await service.findPvpPlayers(today, 666, []);
      expect(result).toHaveLength(1);

      expect(result[0]).toHaveProperty("userLevel");
      expect(result[0].pvp).toBeDefined();
      expect(result[0].pvp).toMatchObject({
        victory: expect.any(Number),
        defeat: expect.any(Number),
        lastAttackDate: expect.any(Date),
        attacksToday: expect.any(Number),
        lastDefendDate: expect.any(Date),
        healthPoints: expect.any(Number),
        protection: expect.any(Number),
        damage: expect.any(Number),
        accuracy: expect.any(Number),
        evasion: expect.any(Number),
        criticalChance: expect.any(Number),
      });

      // Check that default values are used when fields are missing
      if (!result[0].pvp.healthPoints) {
        expect(result[0].pvp.healthPoints).toBe(PVP_BASE_HEALTH_POINTS);
      }
      if (!result[0].pvp.protection) {
        expect(result[0].pvp.protection).toBe(PVP_BASE_PROTECTION);
      }
      if (!result[0].pvp.damage) {
        expect(result[0].pvp.damage).toBe(PVP_BASE_DAMAGE);
      }
      if (!result[0].pvp.accuracy) {
        expect(result[0].pvp.accuracy).toBe(PVP_BASE_ACCURACY);
      }
      if (!result[0].pvp.evasion) {
        expect(result[0].pvp.evasion).toBe(PVP_BASE_EVASION);
      }
      if (!result[0].pvp.criticalChance) {
        expect(result[0].pvp.criticalChance).toBe(PVP_BASE_CRITICAL_HIT_CHANCE);
      }
    });
  });

  afterAll(async () => {
    await module.close();
  });
});

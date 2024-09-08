import { Test, TestingModule } from "@nestjs/testing";
import { faker } from "@faker-js/faker";
import { UserService } from "./user.service";
import { MongooseModule } from "@nestjs/mongoose";
import { mongoUrl, mongoDb, mixpanelToken } from "../config/env";
import { User, UserSchema } from "./schemas/user.schema";
import { BASE_CUSTOMER_LIMIT, BASE_LAB_PLOT_PRICE, STARTING_CASH } from "./user.const";
import { mockTokenData } from "../../test/utils/user";
import { AnalyticsModule } from "../analytics/analytics.module";
import { UserPvp } from "./schemas/userPvp.schema";
import { Model } from 'mongoose';
import { EDealerUpgrade } from "../upgrade/upgrade.interface";

// Add this mock user
export const createMockUser = (overrides = {}): Partial<User> => ({
  id: 123,
  username: 'testuser',
  isPremium: false,
  reputation: 100,
  userLevel: {
    level: 1,
    title: 'Beginner',
    minReputation: 0,
    maxReputation: 1000,
  },
  cashAmount: STARTING_CASH,
  products: [],
  dealerUpgrades: [
    { upgrade: EDealerUpgrade.SOCIAL_MEDIA_CAMPAGIN, level: 0 },
    { upgrade: EDealerUpgrade.STREET_PROMOTION_TEAM, level: 0 },
    { upgrade: EDealerUpgrade.CLUB_PARTNERSHIP, level: 0 },
    { upgrade: EDealerUpgrade.ONLINE_MARKETPLACE, level: 0 },
    { upgrade: EDealerUpgrade.INTERNATIONAL_SHIPPING, level: 0 },
    { upgrade: EDealerUpgrade.QUALITY_CONTROL, level: 0 },
    { upgrade: EDealerUpgrade.RESEARCH_AND_DEVELOPMENT, level: 0 },
  ],
  shipping: [],
  labPlots: [{ plotId: 0 }],
  labPlotPrice: BASE_LAB_PLOT_PRICE,
  lastSell: new Date(),
  customerAmountMax: BASE_CUSTOMER_LIMIT,
  customerAmount: 0,
  customerAmountRemaining: 0,
  referralToken: 'mockReferralToken',
  referredUsers: [],
  socials: [],
  robberyStrike: 0,
  pvp: {
    pvpEnabled: false,
    victory: 0,
    defeat: 0,
    lastAttack: new Date(),
    todayAttackNbr: 0,
    lastDefend: new Date(),
    todayDefendNbr: 0,
    baseHp: 100,
    protection: 0,
    damage: 10,
    accuracy: 50,
    evasion: 5,
    lootPower: 0.1,
  } as UserPvp,
  ...overrides
});

describe("UserService", () => {
  let module: TestingModule;
  let service: UserService;

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
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("findOneOrCreate", () => {
    it("should create new user", async () => {
      const params = mockTokenData();
      const { user: res } = await service.findOneOrCreate(params, faker.internet.ip());
      expect(res.id).toBe(params.id);
      expect(res.username).toBe(params.username);
      expect(res.cashAmount).toBe(STARTING_CASH);
      expect(res.products.length).toBeGreaterThan(0);
      await service.delete(params.id);
    });

    it("should create new user", async () => {
      const params = mockTokenData();
      const { user } = await service.findOneOrCreate(params, faker.internet.ip());
      await user.updateOne({
        $inc: { cashAmount: faker.number.int({ min: 10, max: 100 }) },
      });

      const { user: res } = await service.findOneOrCreate(params, faker.internet.ip());
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
      const res = await service.findOneOrCreate(mockTokenData(), faker.internet.ip());
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
        "You can only claim the reward once per day."
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

  afterAll(async () => {
    await module.close();
  });
});

import { Test, TestingModule } from "@nestjs/testing";
import { MongooseModule, getModelToken } from "@nestjs/mongoose";
import { MultiplayerService } from "./multiplayer.service";
import { User, UserSchema } from "../user/schemas/user.schema";
import { createMockUser } from "../user/user.service.spec";
import { Model } from "mongoose";
import { AnalyticsModule } from "../analytics/analytics.module";
import { mixpanelToken } from "../config/env";
import { UserModule } from "../user/user.module";
import { faker } from "@faker-js/faker";
import { appConfigImports } from '../config/app';

describe("MultiplayerService", () => {
  let service: MultiplayerService;
  let userModel: Model<User>;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ...appConfigImports,
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
        AnalyticsModule.register({
          mixpanelToken: mixpanelToken,
          isGlobal: true,
        }),
        UserModule,
      ],
      providers: [MultiplayerService],
    }).compile();

    service = module.get<MultiplayerService>(MultiplayerService);
    userModel = module.get<Model<User>>(getModelToken(User.name));
  });

  afterAll(async () => {
    await module.close();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("searchPlayer", () => {
    it("should return a list of PvP-enabled players who haven't been attacked today", async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const uids: number[] = [];
      const users = [
        createMockUser({
          username: "current",
          cashAmount: 500,
          pvp: { pvpEnabled: true, lastDefendDate: yesterday },
          products: [{ name: "Herb", quantity: 100, level: 1 }],
        }),
        createMockUser({
          username: "player1",
          cashAmount: 1000,
          pvp: { pvpEnabled: true, lastDefendDate: new Date(0) },
          products: [{ name: "Herb", quantity: 100, level: 1 }],
        }),
        createMockUser({
          username: "player2",
          cashAmount: 2000,
          pvp: { pvpEnabled: true, lastDefendDate: new Date() },
          products: [{ name: "Herb", quantity: 100, level: 1 }],
        }),
        createMockUser({
          username: "player3",
          cashAmount: 3000,
          pvp: { pvpEnabled: false, lastDefendDate: new Date(0) },
          products: [{ name: "Herb", quantity: 100, level: 1 }],
        }),
        createMockUser({
          username: "player4",
          cashAmount: 1500,
          pvp: { pvpEnabled: true, lastDefendDate: yesterday },
          products: [{ name: "Herb", quantity: 100, level: 1 }],
        }),
        createMockUser({
          username: "player5",
          cashAmount: 1500,
          pvp: undefined,
          products: [{ name: "Herb", quantity: 100, level: 1 }],
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

      const result = await service.searchPlayer(uids[0]);
      expect(result).toHaveLength(5);
      const player1 = result.find((player) => player.id === uids[0]);
      const player2 = result.find((player) => player.id === uids[1]);
      const player3 = result.find((player) => player.id === uids[2]);
      const player4 = result.find((player) => player.id === uids[3]);
      expect(player1).not.toBeDefined();
      expect(player2).toBeDefined();
      expect(player3).not.toBeDefined();
      expect(player4).not.toBeDefined();
      expect(result.every((player) => player.pvp.pvpEnabled)).toBe(true);
      expect(
        result.every(
          (player) =>
            !player.pvp.lastDefendDate || player.pvp.lastDefendDate < today,
        ),
      ).toBe(true);
    });
  });

  describe("startFight", () => {
    it("should successfully start a fight between two players and update lastAttackDate and lastDefendDate", async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const attacker = await userModel.create(
        createMockUser({
          id: faker.number.int(),
          username: "attacker",
          cashAmount: 10000,
          pvp: {
            pvpEnabled: true,
            lastAttackDate: yesterday,
            attacksToday: 0,
            baseHp: 100,
            damage: 20,
            protection: 5,
            accuracy: 80,
            evasion: 10,
            lootPower: 0.5,
            victory: 0,
            defeat: 0,
          },
        }),
      );

      const defender = await userModel.create(
        createMockUser({
          id: faker.number.int(),
          username: "defender",
          cashAmount: 20000,
          pvp: {
            pvpEnabled: true,
            lastDefendDate: yesterday,
            baseHp: 100,
            damage: 15,
            protection: 10,
            accuracy: 70,
            evasion: 15,
            victory: 0,
            defeat: 0,
          },
        }),
      );

      const result = await service.startFight(
        attacker.id,
        defender.id,
      );

      expect(result).toHaveProperty("winner");
      expect(result).toHaveProperty("loser");
      expect(result).toHaveProperty("rounds");
      expect(result).toHaveProperty("loot");

      const updatedAttacker = await userModel.findOne({ id: attacker.id });
      const updatedDefender = await userModel.findOne({ id: defender.id });

      expect(updatedAttacker.pvp.lastAttackDate.getDate()).toBe(
        new Date().getDate(),
      );
      expect(updatedDefender.pvp.lastDefendDate.getDate()).toBe(
        new Date().getDate(),
      );
      expect(updatedAttacker.pvp.attacksToday).toBe(1);

      if (result.winner === attacker.username) {
        expect(updatedAttacker.pvp.victory).toBe(1);
        expect(updatedDefender.pvp.defeat).toBe(1);
        expect(updatedAttacker.cashAmount).toBeGreaterThan(10000);
        expect(updatedDefender.cashAmount).toBeLessThan(20000);
        expect(updatedAttacker.reputation).toBe(11); //10 to win the match and 1 base reputation
      } else {
        expect(updatedDefender.pvp.victory).toBe(1);
        expect(updatedAttacker.pvp.defeat).toBe(1);
        expect(updatedAttacker.cashAmount).toBe(10000);
        expect(updatedDefender.cashAmount).toBe(20000);
        expect(updatedAttacker.reputation).toBe(1);
      }
    });

    it("should allow a fight if lastAttackDate is from yesterday", async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const attacker = await userModel.create(
        createMockUser({
          id: faker.number.int(),
          pvp: {
            pvpEnabled: true,
            lastAttackDate: yesterday,
            attacksToday: 0,
          },
        }),
      );

      const defender = await userModel.create(
        createMockUser({
          id: faker.number.int(),
          pvp: { pvpEnabled: true },
        }),
      );

      await expect(
        service.startFight(attacker.id, defender.id),
      ).resolves.not.toThrow();
    });

    it("should allow a fight if defender's lastDefendDate is from yesterday", async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const attacker = await userModel.create(
        createMockUser({
          id: faker.number.int(),
          pvp: { pvpEnabled: true },
        }),
      );

      const defender = await userModel.create(
        createMockUser({
          id: faker.number.int(),
          pvp: {
            pvpEnabled: true,
            lastDefendDate: yesterday,
          },
        }),
      );

      await expect(
        service.startFight(attacker.id, defender.id),
      ).resolves.not.toThrow();
    });

    it("should throw an error if attacker has already attacked twice today", async () => {
      const today = new Date();

      const attacker = await userModel.create(
        createMockUser({
          id: faker.number.int(),
          pvp: { pvpEnabled: true, lastAttackDate: today, attacksToday: 2 },
        }),
      );

      const defender = await userModel.create(
        createMockUser({
          id: faker.number.int(),
          pvp: { pvpEnabled: true },
        }),
      );

      await expect(
        service.startFight(attacker.id, defender.id),
      ).rejects.toThrow(
        "You have reached the maximum number of attacks for today",
      );
    });

    it("should throw an error if defender has already been attacked today", async () => {
      const today = new Date();

      const attacker = await userModel.create(
        createMockUser({
          id: faker.number.int(),
          pvp: { pvpEnabled: true },
        }),
      );

      const defender = await userModel.create(
        createMockUser({
          id: faker.number.int(),
          pvp: { pvpEnabled: true, lastDefendDate: today },
        }),
      );

      await expect(
        service.startFight(attacker.id, defender.id),
      ).rejects.toThrow("This player has already been attacked today");
    });
  });

  describe("enablePvp", () => {
    it("should enable PvP for a user without existing PvP data", async () => {
      const userId = faker.number.int();
      await userModel.create(
        createMockUser({ id: userId, pvp: undefined }),
      );
      const result = await service.enablePvp(userId);
      expect(result.message).toBe("PvP enabled successfully");
      expect(result.pvp.pvpEnabled).toBe(true);
      const updatedUser = await userModel.findOne({ id: userId });
      expect(updatedUser.pvp.pvpEnabled).toBe(true);
      expect(updatedUser.pvp.lastAttackDate).toBeInstanceOf(Date);
      expect(updatedUser.pvp.lastDefendDate).toBeInstanceOf(Date);
      expect(updatedUser.pvp.attacksToday).toBe(0);
    });

    it("should enable PvP for a user with existing PvP data", async () => {
      const userId = faker.number.int();
      await userModel.create(
        createMockUser({ id: userId, pvp: { pvpEnabled: false } }),
      );
      const result = await service.enablePvp(userId);
      expect(result.message).toBe("PvP enabled successfully");
      expect(result.pvp.pvpEnabled).toBe(true);
      const updatedUser = await userModel.findOne({ id: userId });
      expect(updatedUser.pvp.pvpEnabled).toBe(true);
    });
  });
});

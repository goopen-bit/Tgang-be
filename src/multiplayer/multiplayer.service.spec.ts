import { Test, TestingModule } from "@nestjs/testing";
import { MongooseModule, getModelToken } from "@nestjs/mongoose";
import { MultiplayerService } from "./multiplayer.service";
import { UserService } from "../user/user.service";
import { User, UserSchema } from "../user/schemas/user.schema";
import { createMockUser } from "../user/user.service.spec";
import { Model } from "mongoose";
import { mongoUrl, mongoDb } from "../config/env";
import { AnalyticsModule } from "../analytics/analytics.module";
import { mixpanelToken } from "../config/env";

describe("MultiplayerService", () => {
  let service: MultiplayerService;
  let userService: UserService;
  let userModel: Model<User>;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(mongoUrl, {
          dbName: mongoDb,
        }),
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
        AnalyticsModule.register({
          mixpanelToken: mixpanelToken,
          isGlobal: true,
        }),
      ],
      providers: [MultiplayerService, UserService],
    }).compile();

    service = module.get<MultiplayerService>(MultiplayerService);
    userService = module.get<UserService>(UserService);
    userModel = module.get<Model<User>>(getModelToken(User.name));
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(async () => {
    await userModel.deleteMany({});
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("searchPlayer", () => {
    it("should return a list of PvP-enabled players who haven't been attacked today", async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const today = new Date();

      const users = [
        createMockUser({
          id: 123,
          username: "current",
          cashAmount: 500,
          pvp: { pvpEnabled: true, lastDefend: yesterday },
        }),
        createMockUser({
          id: 456,
          username: "player1",
          cashAmount: 1000,
          pvp: { pvpEnabled: true },
        }),
        createMockUser({
          id: 789,
          username: "player2",
          cashAmount: 2000,
          pvp: { pvpEnabled: true, lastDefend: today },
        }),
        createMockUser({
          id: 101,
          username: "player3",
          cashAmount: 3000,
          pvp: { pvpEnabled: false },
        }),
        createMockUser({
          id: 102,
          username: "player4",
          cashAmount: 1500,
          pvp: { pvpEnabled: true, lastDefend: yesterday },
        }),
        createMockUser({
          id: 103,
          username: "player4",
          cashAmount: 1500,
          pvp: undefined,
        }),
      ];

      for (const user of users) {
        await userModel.create(user);
      }

      const result = await service.searchPlayer();
      expect(result).toHaveLength(3);
      expect(result[0].id).toBe(456);
      expect(result[1].id).toBe(102);
      expect(result[2].id).toBe(123);
      expect(result.every((player) => player.pvp.pvpEnabled)).toBe(true);
      expect(result.every((player) => !player.pvp.lastDefend || player.pvp.lastDefend < today.setHours(0,0,0,0))).toBe(true);
    });
  });

  describe("startFight", () => {
    it("should successfully start a fight between two players and update lastAttack and lastDefend", async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const attacker = await userModel.create(createMockUser({
        id: 123,
        username: "attacker",
        cashAmount: 10000,
        pvp: {
          pvpEnabled: true,
          lastAttack: yesterday,
          baseHp: 100,
          damage: 20,
          protection: 5,
          accuracy: 80,
          evasion: 10,
          lootPower: 0.5,
          victory: 0,
          defeat: 0
        }
      }));

      const defender = await userModel.create(createMockUser({
        id: 456,
        username: "defender",
        cashAmount: 20000,
        pvp: {
          pvpEnabled: true,
          lastDefend: yesterday,
          baseHp: 100,
          damage: 15,
          protection: 10,
          accuracy: 70,
          evasion: 15,
          victory: 0,
          defeat: 0
        }
      }));

      const result = await service.startFight(attacker.id.toString(), defender.id.toString());

      expect(result).toHaveProperty('winner');
      expect(result).toHaveProperty('loser');
      expect(result).toHaveProperty('rounds');
      expect(result).toHaveProperty('loot');

      const updatedAttacker = await userModel.findOne({ id: attacker.id });
      const updatedDefender = await userModel.findOne({ id: defender.id });

      expect(updatedAttacker.pvp.lastAttack.getDate()).toBe(new Date().getDate());
      expect(updatedDefender.pvp.lastDefend.getDate()).toBe(new Date().getDate());

      if (result.winner === attacker.username) {
        expect(updatedAttacker.pvp.victory).toBe(1);
        expect(updatedDefender.pvp.defeat).toBe(1);
        expect(updatedAttacker.cashAmount).toBeGreaterThan(10000);
        expect(updatedDefender.cashAmount).toBeLessThan(20000);
        expect(updatedAttacker.reputation).toBe(10);
      } else {
        expect(updatedDefender.pvp.victory).toBe(1);
        expect(updatedAttacker.pvp.defeat).toBe(1);
        expect(updatedAttacker.cashAmount).toBe(10000);
        expect(updatedDefender.cashAmount).toBe(20000);
        expect(updatedAttacker.reputation).toBe(0);
      }
    });

    it("should allow a fight if lastAttack is from yesterday", async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const attacker = await userModel.create(createMockUser({
        id: 123,
        pvp: { 
          pvpEnabled: true, 
          lastAttack: yesterday 
        }
      }));

      const defender = await userModel.create(createMockUser({
        id: 456,
        pvp: { pvpEnabled: true }
      }));

      await expect(service.startFight(attacker.id.toString(), defender.id.toString()))
        .resolves.not.toThrow();
    });

    it("should allow a fight if defender's lastDefend is from yesterday", async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const attacker = await userModel.create(createMockUser({
        id: 123,
        pvp: { pvpEnabled: true }
      }));

      const defender = await userModel.create(createMockUser({
        id: 456,
        pvp: { 
          pvpEnabled: true, 
          lastDefend: yesterday 
        }
      }));

      await expect(service.startFight(attacker.id.toString(), defender.id.toString()))
        .resolves.not.toThrow();
    });

    it("should throw an error if PvP is not enabled for both players", async () => {
      const attacker = await userModel.create(createMockUser({
        id: 123,
        pvp: { pvpEnabled: true }
      }));

      const defender = await userModel.create(createMockUser({
        id: 456,
        pvp: { pvpEnabled: false }
      }));

      await expect(service.startFight(attacker.id.toString(), defender.id.toString()))
        .rejects.toThrow('Both players must have PvP enabled');
    });

    it("should throw an error if attacker has already attacked today", async () => {
      const today = new Date();

      const attacker = await userModel.create(createMockUser({
        id: 123,
        pvp: { pvpEnabled: true, lastAttack: today }
      }));

      const defender = await userModel.create(createMockUser({
        id: 456,
        pvp: { pvpEnabled: true }
      }));

      await expect(service.startFight(attacker.id.toString(), defender.id.toString()))
        .rejects.toThrow('You have reached the maximum number of attacks for today');
    });

    it("should throw an error if defender has already been attacked today", async () => {
      const today = new Date();

      const attacker = await userModel.create(createMockUser({
        id: 123,
        pvp: { pvpEnabled: true }
      }));

      const defender = await userModel.create(createMockUser({
        id: 456,
        pvp: { pvpEnabled: true, lastDefend: today }
      }));

      await expect(service.startFight(attacker.id.toString(), defender.id.toString()))
        .rejects.toThrow('This player has already been attacked today');
    });
  });

  describe("enablePvp", () => {
    it("should enable PvP for a user without existing PvP data", async () => {
      const user = await userModel.create(
        createMockUser({ id: 123, pvp: undefined }),
      );
      const result = await service.enablePvp("123");
      expect(result.message).toBe("PvP enabled successfully");
      expect(result.pvp.pvpEnabled).toBe(true);
      const updatedUser = await userModel.findOne({ id: 123 });
      expect(updatedUser.pvp.pvpEnabled).toBe(true);
    });

    it("should enable PvP for a user with existing PvP data", async () => {
      const user = await userModel.create(
        createMockUser({ id: 123, pvp: { pvpEnabled: false } }),
      );
      const result = await service.enablePvp("123");
      expect(result.message).toBe("PvP enabled successfully");
      expect(result.pvp.pvpEnabled).toBe(true);
      const updatedUser = await userModel.findOne({ id: 123 });
      expect(updatedUser.pvp.pvpEnabled).toBe(true);
    });
  });
});
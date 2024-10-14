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
import { appConfigImports } from "../config/app";
import {
  BattleResult,
  BattleResultSchema,
} from "./schemas/battleResult.schema";
import { SocialChannel } from "../social/social.const";
import { BattleDto, BattleParticipantDto } from "./dto/battle.dto";
import { EProduct } from "../market/market.const";
import { PVP_BASE_DAMAGE } from "../user/user.const";
import { UserPvp } from "../user/schemas/userPvp.schema";
import { ECRAFTABLE_ITEM } from "../lab/craftable_item.const";

function createMockBattle(battle: Partial<BattleDto>): BattleDto {
  return {
    battleId: faker.string.uuid(),
    attacker: {
      id: faker.number.int(),
      username: battle.attacker?.username || "",
      pvp: (battle.attacker?.pvp || {}) as UserPvp,
    },
    defender: {
      id: faker.number.int(),
      username: battle.defender?.username || "",
      pvp: (battle.defender?.pvp || {}) as UserPvp,
    },
    round: 0,
    roundResults: [],
    winner: undefined,
    ...battle,
  };
}

describe("MultiplayerService", () => {
  let service: MultiplayerService;
  let userModel: Model<User>;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ...appConfigImports,
        MongooseModule.forFeature([
          { name: User.name, schema: UserSchema },
          { name: BattleResult.name, schema: BattleResultSchema },
        ]),
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
          reputation: 10000,
          pvp: { lastDefendDate: yesterday },
          products: [{ name: "Herb", quantity: 100, level: 1 }],
        }),
        createMockUser({
          username: "player1",
          cashAmount: 1000,
          reputation: 10000,
          pvp: { lastDefendDate: new Date(0) },
          products: [{ name: "Herb", quantity: 100, level: 1 }],
        }),
        createMockUser({
          username: "player2",
          cashAmount: 2000,
          reputation: 10000,
          pvp: { lastDefendDate: new Date() },
          products: [{ name: "Herb", quantity: 100, level: 1 }],
        }),
        createMockUser({
          username: "player3",
          cashAmount: 3000,
          reputation: 100,
          pvp: { lastDefendDate: new Date(0) },
          products: [{ name: "Herb", quantity: 100, level: 1 }],
        }),
        createMockUser({
          username: "player4",
          cashAmount: 1500,
          reputation: 10000,
          pvp: { lastDefendDate: yesterday },
          products: [{ name: "Herb", quantity: 100, level: 1 }],
        }),
        createMockUser({
          username: "player5",
          cashAmount: 1500,
          reputation: 100,
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
      expect(result).toHaveLength(1);
      const player1 = result[0];
      expect(player1).toBeDefined();
      expect(
        result.every(
          (player) =>
            !player.pvp?.lastDefendDate || player.pvp.lastDefendDate < today,
        ),
      ).toBe(true);
    });
  });

  describe("updatePvpResult", () => {
    let attacker: Partial<User>;
    let defender: Partial<User>;
    beforeEach(async () => {
      attacker = createMockUser({
        username: "attacker",
        cashAmount: 1000,
        reputation: 10000,
        socials: [{ channel: SocialChannel.TELEGRAM_CHANNEL, member: true }],
        pvp: {
          lastDefendDate: new Date(0),
          victory: 0,
          defeat: 0,
          lootPower: 1,
        },
        products: [{ name: "Herb", quantity: 100, level: 1 }],
      });
      defender = createMockUser({
        username: "defender",
        cashAmount: 2000,
        reputation: 10000,
        pvp: { lastDefendDate: new Date(0), victory: 0, defeat: 0 },
        products: [{ name: "Herb", quantity: 100, level: 1 }],
      });

      await userModel.create({
        ...attacker,
      });
      await userModel.create({
        ...defender,
      });
    });

    it("should update PvP stats for the attacker", async () => {
      const battle = createMockBattle({
        attacker: {
          id: attacker.id,
          username: attacker.username,
          pvp: attacker.pvp,
        },
        defender: {
          id: defender.id,
          username: defender.username,
          pvp: defender.pvp,
        },
        winner: "attacker",
      });

      const res = await service["updatePvpResult"](battle);
      expect(res).toBeDefined();
      expect(res.cashLoot).toBeGreaterThan(0);
      expect(res.productLoot).toHaveLength(1);
    });

    it("should update PvP stats for the defender", async () => {
      const battle = createMockBattle({
        attacker: {
          id: attacker.id,
          username: attacker.username,
          pvp: attacker.pvp,
        },
        defender: {
          id: defender.id,
          username: defender.username,
          pvp: defender.pvp,
        },
        winner: "defender",
      });

      const res = await service["updatePvpResult"](battle);
      expect(res).toBeDefined();
      expect(res.cashLoot).toBe(0);
      expect(res.productLoot).toHaveLength(0);
    });
  });

  describe("combatAction", () => {
    let attacker: Partial<User>;
    let defender: Partial<User>;
    beforeEach(async () => {
      attacker = createMockUser({
        username: "attacker",
        cashAmount: 1000,
        reputation: 10000,
        socials: [{ channel: SocialChannel.TELEGRAM_CHANNEL, member: true }],
        pvp: {
          lastDefendDate: new Date(0),
          victory: 0,
          defeat: 0,
          lootPower: 1,
          damage: PVP_BASE_DAMAGE,
          healthPoints: 100,
        },
        products: [{ name: "Herb", quantity: 100, level: 1 }],
        craftedItems: [
          { itemId: ECRAFTABLE_ITEM.BOOSTER_ATTACK_2, quantity: 2 },
        ],
      });
      defender = createMockUser({
        username: "defender",
        cashAmount: 2000,
        reputation: 10000,
        pvp: {
          lastDefendDate: new Date(0),
          victory: 0,
          defeat: 0,
          damage: PVP_BASE_DAMAGE,
          healthPoints: 100,
        },
        products: [{ name: "Herb", quantity: 100, level: 1 }],
      });

      await userModel.create({
        ...attacker,
      });
      await userModel.create({
        ...defender,
      });

      jest
        .spyOn(service as any, "getAttackDamage")
        .mockReturnValue({ damage: 15, critical: false });
    });

    it("should perform an attack and update battle stats", async () => {
      const battle = await service.startBattle(attacker.id, defender.id);

      const result = await service.combatAction(attacker.id, battle.battleId);
      expect(result).toBeDefined();
      expect(result.round).toBe(1);
      expect(result.roundResults).toHaveLength(1);
      expect(result.roundResults[0].attackerDamage).toBe(15);
      expect(result.roundResults[0].defenderDamage).toBe(15);
    });

    it("should apply item effect without attacker dealing damage", async () => {
      const battle = await service.startBattle(attacker.id, defender.id);

      const initialAttackerHealth = battle.attacker.pvp.healthPoints;
      const initialDefenderHealth = battle.defender.pvp.healthPoints;
      const initialDamage = battle.attacker.pvp.damage;

      const result = await service.combatAction(
        attacker.id,
        battle.battleId,
        ECRAFTABLE_ITEM.BOOSTER_ATTACK_2,
      );
      expect(result).toBeDefined();
      expect(result.round).toBe(1);
      expect(result.roundResults).toHaveLength(1);
      expect(result.roundResults[0].attackerDamage).toBe(0);
      expect(result.roundResults[0].usedItem).toBe(
        ECRAFTABLE_ITEM.BOOSTER_ATTACK_2,
      );
      expect(result.attacker.pvp.damage).toBeGreaterThan(initialDamage);
      expect(result.attacker.pvp.healthPoints).toBeLessThan(
        initialAttackerHealth,
      );
      expect(result.defender.pvp.healthPoints).toBe(initialDefenderHealth);
    });

    it("should apply item effect ", async () => {
      const battle = await service.startBattle(attacker.id, defender.id);

      let result = await service.combatAction(
        attacker.id,
        battle.battleId,
        ECRAFTABLE_ITEM.BOOSTER_ATTACK_2,
      );

      const increasedDamage = result.attacker.pvp.damage;
      expect(result.roundResults[0].attackerDamage).toBe(0);
      expect(result.roundResults[0].defenderDamage).toBeGreaterThan(0);
      expect(increasedDamage).toBeGreaterThan(PVP_BASE_DAMAGE);
    });

    it("should not perform an attack if the battle does not exist", async () => {
      await expect(
        service.combatAction(attacker.id, faker.string.uuid()),
      ).rejects.toThrow("Battle not found");
    });

    it("should not perform an attack if the attacker is not in the battle", async () => {
      const battle = await service.startBattle(attacker.id, defender.id);
      await expect(
        service.combatAction(faker.number.int(), battle.battleId),
      ).rejects.toThrow("You are not the attacker");
    });

    it("should perform attacks until there is a winner", async () => {
      let battle = await service.startBattle(attacker.id, defender.id);
      const resultSpy = jest.spyOn(service as any, "updatePvpResult");

      do {
        battle = await service.combatAction(attacker.id, battle.battleId);
      } while (!battle.winner);

      expect(resultSpy).toHaveBeenCalledTimes(1);
      expect(battle.winner).toBeDefined();
      expect(battle.round).toBe(7); // 100 HP / 15 damage per round = 7 rounds
    });

    it("should not allow using an item that the user doesn't have", async () => {
      const battle = await service.startBattle(attacker.id, defender.id);

      await expect(
        service.combatAction(
          attacker.id,
          battle.battleId,
          ECRAFTABLE_ITEM.HEALTH_POTION,
        ),
      ).rejects.toThrow("Item not found or out of stock");
    });
  });

  describe("startBattle", () => {
    let attacker: Partial<User>;
    let defender: Partial<User>;
    beforeEach(async () => {
      attacker = createMockUser({
        username: "attacker",
        cashAmount: 1000,
        reputation: 10000,
        socials: [{ channel: SocialChannel.TELEGRAM_CHANNEL, member: true }],
        pvp: {
          lastDefendDate: new Date(0),
          victory: 0,
          defeat: 0,
          lootPower: 1,
        },
        products: [{ name: "Herb", quantity: 100, level: 1 }],
        craftedItems: [
          { itemId: ECRAFTABLE_ITEM.BOOSTER_ATTACK_2, quantity: 2 },
        ],
      });
      defender = createMockUser({
        username: "defender",
        cashAmount: 2000,
        reputation: 10000,
        pvp: { lastDefendDate: new Date(0), victory: 0, defeat: 0 },
        products: [{ name: "Herb", quantity: 100, level: 1 }],
      });

      await userModel.create({
        ...attacker,
      });
      await userModel.create({
        ...defender,
      });
    });

    it("should start a new battle", async () => {
      const result = await service.startBattle(attacker.id, defender.id);
      expect(result).toBeDefined();
      expect(result.attacker.id).toBe(attacker.id);
      expect(result.defender.id).toBe(defender.id);
      expect(result.round).toBe(0);
      expect(result.roundResults).toHaveLength(0);
    });
  });
});

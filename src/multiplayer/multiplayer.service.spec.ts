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
import { BattleResult, BattleResultSchema } from "./schemas/battleResult.schema";
import { SocialChannel } from "../social/social.const";
import { BattleDto, BattleParticipantDto } from "./dto/battle.dto";
import { EProduct } from "../market/market.const";
import { PVP_BASE_ACCURACY, PVP_BASE_CRITICAL_HIT_CHANCE, PVP_BASE_DAMAGE, PVP_BASE_EVASION, PVP_BASE_HEALTH_POINTS, PVP_BASE_PROTECTION } from "../user/user.const";


function createMockBattle(battle: Partial<BattleDto>): BattleDto {
  return {
    battleId: faker.string.uuid(),
    attacker: {
      id: faker.number.int(),
      ...battle.attacker,
    },
    defender: {
      id: faker.number.int(),
      ...battle.defender,
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

    describe("updatePvpStats", () => {
      let attacker: Partial<User>;
      let defender: Partial<User>;
      beforeEach(async () => {
        attacker = createMockUser({
          username: "attacker",
          cashAmount: 1000,
          reputation: 10000,
          socials: [{ channel: SocialChannel.TELEGRAM_CHANNEL, member: true }],
          pvp: { lastDefendDate: new Date(0), victory: 0, defeat: 0, lootPower: 1 },
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
          attacker: { id: attacker.id, username: attacker.username, ...attacker.pvp },
          defender: { id: defender.id, username: defender.username, ...defender.pvp },
          winner: "attacker",
        });

        const res = await service['updatePvpStats'](battle);
        expect(res).toBeDefined();
        expect(res.cashLoot).toBeGreaterThan(0);
        expect(res.productLoot).toHaveLength(1);
      });

      it("should update PvP stats for the defender", async () => {
        const battle = createMockBattle({
          attacker: { id: attacker.id, username: attacker.username, ...attacker.pvp },
          defender: { id: defender.id, username: defender.username, ...defender.pvp },
          winner: "defender",
        });

        const res = await service['updatePvpStats'](battle);
        expect(res).toBeDefined();
        expect(res.cashLoot).toBe(0);
        expect(res.productLoot).toHaveLength(0);
      });
    });

    describe("performAttack", () => {
      let attacker: Partial<User>;
      let defender: Partial<User>;
      beforeEach(async () => {
        attacker = createMockUser({
          username: "attacker",
          cashAmount: 1000,
          reputation: 10000,
          socials: [{ channel: SocialChannel.TELEGRAM_CHANNEL, member: true }],
          pvp: { lastDefendDate: new Date(0), victory: 0, defeat: 0, lootPower: 1 },
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

      it("should perform an attack and update battle stats", async () => {
        const battle = await service.startBattle(attacker.id, defender.id);

        const result = await service.performAttack(attacker.id, battle.battleId);
        expect(result).toBeDefined();
        expect(result.round).toBe(1);
        expect(result.roundResults).toHaveLength(1);
      });

      it("should not perform an attack if the battle does not exist", async () => {
        await expect(service.performAttack(attacker.id, faker.string.uuid())).rejects.toThrow(
          "Battle not found",
        );
      });

      it("should not perform an attack if the attacker is not in the battle", async () => {
        const battle = await service.startBattle(attacker.id, defender.id);
        await expect(service.performAttack(faker.number.int(), battle.battleId)).rejects.toThrow(
          "You are not the attacker",
        );
      });

      it("should perform attacks until there is a winner", async () => {
        let battle = await service.startBattle(attacker.id, defender.id);
        const statSpy = jest.spyOn(service as any, "updatePvpStats");
        
        do {
          battle = await service.performAttack(attacker.id, battle.battleId);
        } while (!battle.winner)

        expect(statSpy).toHaveBeenCalledTimes(1);
        expect(battle.winner).toBeDefined();
      });

      it("should use product to increase attack power", async () => {
        await userModel.updateOne({
          id: attacker.id,
        }, {
          $set: {
            products: [{ name: EProduct.POWDER, quantity: 100, level: 2 }],
          },
        });

        const battle = await service.startBattle(attacker.id, defender.id);
        const result = await service.performAttack(attacker.id, battle.battleId, { product: EProduct.POWDER });
        expect(result).toBeDefined();
        expect(result.round).toBe(1);
        expect(result.roundResults[0].usedProduct).toBe(EProduct.POWDER);
        expect(result.attacker.damage).toBeGreaterThan(PVP_BASE_DAMAGE);
      });
    });

    describe("useProduct", () => {
      let attacker: BattleParticipantDto;
      beforeEach(async () => {
        const user = await userModel.create({
          ...createMockUser({
            username: "attacker",
            cashAmount: 1000,
            reputation: 10000,
            socials: [{ channel: SocialChannel.TELEGRAM_CHANNEL, member: true }],
            products: [{ name: EProduct.HERB, quantity: 100, level: 1 }],
          }),
        });

        attacker = {
          id: user.id,
          username: user.username,
          ...user.toObject().pvp,
        };
      });

      it("should use product to increase attack power", async () => {
        await userModel.updateOne({
          id: attacker.id,
        }, {
          $set: {
            products: [{ name: EProduct.POWDER, quantity: 100, level: 2 }],
          },
        });

        const result = await service.useProduct(EProduct.POWDER, attacker);
        expect(result).toBeDefined();
        expect(result.damage).toBeGreaterThan(PVP_BASE_DAMAGE);
      });

      it("should use product to increase health points", async () => {
        const result = await service.useProduct(EProduct.HERB, attacker);
        expect(result).toBeDefined();
        expect(result.healthPoints).toBeGreaterThan(PVP_BASE_HEALTH_POINTS);
      });

      it("should use product to increase protection", async () => {
        await userModel.updateOne({
          id: attacker.id,
        }, {
          $set: {
            products: [{ name: EProduct.PILL, quantity: 100, level: 2 }],
          },
        });

        const result = await service.useProduct(EProduct.PILL, attacker);
        expect(result).toBeDefined();
        expect(result.protection).toBeGreaterThan(PVP_BASE_PROTECTION);
      });

      it("should use product to increase evasion", async () => {
        await userModel.updateOne({
          id: attacker.id,
        }, {
          $set: {
            products: [{ name: EProduct.MUSHROOM, quantity: 100, level: 2 }],
          },
        });

        const result = await service.useProduct(EProduct.MUSHROOM, attacker);
        expect(result).toBeDefined();
        expect(result.evasion).toBeGreaterThan(PVP_BASE_EVASION);
      });

      it("should use product to increase critical chance", async () => {
        await userModel.updateOne({
          id: attacker.id,
        }, {
          $set: {
            products: [{ name: EProduct.CRYSTAL, quantity: 100, level: 2 }],
          },
        });

        const result = await service.useProduct(EProduct.CRYSTAL, attacker);
        expect(result).toBeDefined();
        expect(result.criticalChance).toBeGreaterThan(PVP_BASE_CRITICAL_HIT_CHANCE);
      });

      it("should use product to increase accuracy", async () => {
        await userModel.updateOne({
          id: attacker.id,
        }, {
          $set: {
            products: [{ name: EProduct.ACID, quantity: 100, level: 2 }],
          },
        });

        const result = await service.useProduct(EProduct.ACID, attacker);
        expect(result).toBeDefined();
        expect(result.accuracy).toBeGreaterThan(PVP_BASE_ACCURACY);
      });

      it("should not use product if the attacker does not have the product", async () => {
        await expect(service.useProduct(EProduct.POWDER, attacker)).rejects.toThrow(
          "Product not found",
        );
      });

      it("should not use product if the attacker is out of stock", async () => {
        await userModel.updateOne({
          id: attacker.id,
        }, {
          $set: {
            products: [{ name: EProduct.POWDER, quantity: 0, level: 2 }],
          },
        });

        await expect(service.useProduct(EProduct.POWDER, attacker)).rejects.toThrow(
          "Product out of stock",
        );
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
          pvp: { lastDefendDate: new Date(0), victory: 0, defeat: 0, lootPower: 1 },
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

      it("should start a new battle", async () => {
        const result = await service.startBattle(attacker.id, defender.id);
        expect(result).toBeDefined();
        expect(result.attacker.id).toBe(attacker.id);
        expect(result.defender.id).toBe(defender.id);
        expect(result.round).toBe(0);
        expect(result.roundResults).toHaveLength(0);
      });

      it("should not start a new battle if the attacker is already in battle", async () => {
        const newDefender = createMockUser({
          username: "defender",
          cashAmount: 2000,
          reputation: 10000,
          pvp: { lastDefendDate: new Date(0), victory: 0, defeat: 0 },
          products: [{ name: "Herb", quantity: 100, level: 1 }],
        });

        await userModel.create({
          ...newDefender,
        });

        const newBattle = await service.startBattle(attacker.id, newDefender.id);
        const battle = await service.startBattle(attacker.id, newDefender.id);
        expect(battle).toBeDefined();
        expect(battle.battleId).toBe(newBattle.battleId);
      });

      it("should not start a new battle if the defender is already in battle", async () => {
        const newAttacker = createMockUser({
          username: "attacker",
          cashAmount: 2000,
          reputation: 10000,
          socials: [{ channel: SocialChannel.TELEGRAM_CHANNEL, member: true }],
          pvp: { lastDefendDate: new Date(0), victory: 0, defeat: 0 },
          products: [{ name: "Herb", quantity: 100, level: 1 }],
        });

        await userModel.create({
          ...newAttacker,
        });

        await service.startBattle(attacker.id, defender.id);
        await expect(service.startBattle(newAttacker.id, defender.id)).rejects.toThrow(
          "This player is already in a battle",
        );
      });

      it("should not start a new if attacker did not join telegram channel", async () => {
        const newAttacker = createMockUser({
          username: "attacker",
          cashAmount: 2000,
          reputation: 10000,
          pvp: { lastDefendDate: new Date(0), victory: 0, defeat: 0 },
          products: [{ name: "Herb", quantity: 100, level: 1 }],
        });

        await userModel.create({
          ...newAttacker,
        });

        await expect(service.startBattle(newAttacker.id, defender.id)).rejects.toThrow(
          "You must join our Telegram channel to participate in PvP",
        );
      });
    });
  });
});

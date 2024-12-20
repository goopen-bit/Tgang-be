import { HttpException, HttpStatus, Injectable, Logger } from "@nestjs/common";
import { UserService } from "../user/user.service";
import { startOfDay } from "date-fns";
import { User } from "../user/schemas/user.schema";
import { BotUser } from "../user/user.interface";
import { BattleResult } from "./schemas/battleResult.schema";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import {
  BASE_REPUTATION_GAIN,
  MAX_CASH_LOOT,
  MAX_PRODUCT_LOOT,
} from "./multiplayer.const";
import { SocialChannel } from "../social/social.const";
import { InjectRedis } from "@goopen/nestjs-ioredis-provider";
import { InjectMixpanel } from "../analytics/injectMixpanel.decorator";
import { Mixpanel } from "mixpanel";
import Redis from "ioredis";
import {
  BattleDto,
  BattleParticipantDto,
  LootDto,
  RoundResultDto,
} from "./dto/battle.dto";
import { randomUUID } from "crypto";
import { UserPvp } from "../user/schemas/userPvp.schema";
import { CRAFTABLE_ITEMS, ECRAFTABLE_ITEM } from "../lab/craftable_item.const";
import {
  PVP_BASE_ACCURACY,
  PVP_BASE_CRITICAL_HIT_CHANCE,
  PVP_BASE_DAMAGE,
  PVP_BASE_EVASION,
  PVP_BASE_HEALTH_POINTS,
  PVP_BASE_LOOT_POWER,
  PVP_BASE_PROTECTION,
} from "../user/user.const";

@Injectable()
export class MultiplayerService {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    @InjectModel(BattleResult.name)
    private battleResultModel: Model<BattleResult>,
    private readonly userService: UserService,
    @InjectRedis() private readonly redis: Redis,
    @InjectMixpanel() private readonly mixpanel: Mixpanel,
  ) {}
  /*******************************************************************
                                Mixpanel event
  ********************************************************************/

  private trackFailedPvp(userId: number, condition: string) {
    this.mixpanel.track("Pvp", {
      distinct_id: userId,
      type: "DeathMatch",
      value: "failed",
      condition: condition,
    });
  }
  private trackPvpResult(
    attackerId: number,
    defenderId: number,
    result: string,
  ) {
    this.mixpanel.track("Pvp", {
      distinct_id: attackerId,
      opponent_id: defenderId,
      type: "DeathMatch",
      value: result,
    });
  }

  /*******************************************************************
                                Validation
  ********************************************************************/

  private validateTelegramChannel(attacker: User) {
    if (
      !attacker.socials.find(
        (s) => s.channel === SocialChannel.TELEGRAM_CHANNEL,
      )
    ) {
      this.trackFailedPvp(attacker.id, "telegram");
      throw new HttpException(
        "You must join our Telegram channel to participate in PvP",
        HttpStatus.PRECONDITION_REQUIRED,
      );
    }
  }

  private validateAttacksAvailable(attacker: User) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (attacker.pvp.lastAttackDate < today) {
      attacker.pvp.attacksToday = 0;
    }

    if (attacker.pvp.attacksToday >= attacker.pvp.attacksAvailable) {
      this.trackFailedPvp(attacker.id, "maxAttack");
      throw new HttpException(
        "You have reached the maximum number of attacks for today",
        HttpStatus.PRECONDITION_FAILED,
      );
    }
  }

  private validateDefenderAvailability(defender: User | BotUser) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (defender.pvp.lastDefendDate >= today) {
      this.trackFailedPvp(defender.id, "maxDefence");
      throw new HttpException(
        "This player has already been attacked today",
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  private async validateBattleConditions(
    attacker: User,
    defender: User | BotUser,
  ) {
    // this.validateTelegramChannel(attacker);
    this.validateAttacksAvailable(attacker);
    this.validateDefenderAvailability(defender);

    attacker.pvp.attacksToday++;
    attacker.pvp.lastAttackDate = new Date();
    attacker.pvp.defeat++;
    await attacker.save();
  }

  private async getBattleAndValidate(
    userId: number,
    battleId: string,
  ): Promise<BattleDto> {
    const battleString = await this.redis.get(this.getBattleLockKey(battleId));
    if (!battleString) {
      throw new HttpException("Battle not found", HttpStatus.NOT_FOUND);
    }
    const battle: BattleDto = JSON.parse(battleString);

    if (battle.attacker.id !== userId) {
      throw new HttpException("You are not the attacker", HttpStatus.FORBIDDEN);
    }

    return battle;
  }

  private async checkExistingBattles(userId: number, opponentId: number) {
    const [activeAttacker, activeDefender] = await Promise.all([
      this.redis.get(this.getAttackerLockKey(userId)),
      this.redis.get(this.getDefenderLockKey(opponentId)),
    ]);

    if (activeAttacker) {
      const existingBattle = await this.getExistingBattle(
        activeAttacker,
        userId,
      );
      if (existingBattle) return existingBattle;
    }

    if (activeDefender) {
      throw new HttpException(
        "This player is already in a battle",
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  /*******************************************************************
                                GETTER
  ********************************************************************/

  private getBattleLockKey(battleId: string) {
    return `battle:${battleId}`;
  }

  private getAttackerLockKey(userId: number) {
    return `attacking:${userId}`;
  }

  private getDefenderLockKey(userId: number) {
    return `defending:${userId}`;
  }

  private async getExistingBattle(battleId: string, userId: number) {
    const existingBattleString = await this.redis.get(
      this.getBattleLockKey(battleId),
    );
    if (existingBattleString) {
      const existingBattle: BattleDto = JSON.parse(existingBattleString);
      const opponent = await this.userService.findDefender(
        existingBattle.defender.id,
        userId,
      );
      return { ...existingBattle, opponent };
    }
    return null;
  }

  /*******************************************************************
                                SearchPlayer
  ********************************************************************/

  private async getDefendingPlayers() {
    const keys = await this.redis.keys("defending:*");
    return keys.map((key) => Number(key.split(":")[1]));
  }

  async searchPlayer(userId: number) {
    const today = startOfDay(new Date());
    const exIds = await this.getDefendingPlayers();
    const player = await this.userService.findPvpPlayers(today, userId, exIds);
    player.forEach((p) => delete (p as any).isBot);
    return player;
  }

  /*******************************************************************
                                StartBattle
  ********************************************************************/

  private createBattle(attacker: User, defender: User | BotUser): BattleDto {
    const battleId = randomUUID();
    return {
      battleId,
      attacker: {
        id: attacker.id,
        username: attacker.username,
        pvp: {
          ...attacker.pvp,
          healthPoints: attacker.pvp.healthPoints || PVP_BASE_HEALTH_POINTS,
          protection: attacker.pvp.protection || PVP_BASE_PROTECTION,
          damage: attacker.pvp.damage || PVP_BASE_DAMAGE,
          accuracy: attacker.pvp.accuracy || PVP_BASE_ACCURACY,
          evasion: attacker.pvp.evasion || PVP_BASE_EVASION,
          criticalChance:
            attacker.pvp.criticalChance || PVP_BASE_CRITICAL_HIT_CHANCE,
          lootPower: attacker.pvp.lootPower || PVP_BASE_LOOT_POWER,
          attacksAvailable: attacker.pvp.attacksAvailable || 0,
          activeEffects: [],
        },
      },
      defender: {
        id: defender.id,
        username: defender.username,
        pvp: {
          ...defender.pvp,
          healthPoints: defender.pvp.healthPoints || PVP_BASE_HEALTH_POINTS,
          protection: defender.pvp.protection || PVP_BASE_PROTECTION,
          damage: defender.pvp.damage || PVP_BASE_DAMAGE,
          accuracy: defender.pvp.accuracy || PVP_BASE_ACCURACY,
          evasion: defender.pvp.evasion || PVP_BASE_EVASION,
          criticalChance:
            defender.pvp.criticalChance || PVP_BASE_CRITICAL_HIT_CHANCE,
          lootPower: defender.pvp.lootPower || PVP_BASE_LOOT_POWER,
          attacksAvailable: defender.pvp.attacksAvailable || 0,
          activeEffects: [],
        },
      },
      round: 0,
      roundResults: [],
    };
  }

  private async lockBattleParticipants(battle: BattleDto) {
    await Promise.all([
      this.redis.set(
        this.getBattleLockKey(battle.battleId),
        JSON.stringify(battle),
        "EX",
        3600,
      ),
      this.redis.set(
        this.getAttackerLockKey(battle.attacker.id),
        battle.battleId,
        "EX",
        3600,
      ),
      this.redis.set(
        this.getDefenderLockKey(battle.defender.id),
        battle.battleId,
        "EX",
        3600,
      ),
    ]);
  }

  async startBattle(userId: number, opponentId: number) {
    const existingBattle = await this.checkExistingBattles(userId, opponentId);
    if (existingBattle) {
      console.log(existingBattle);
      return existingBattle;
    }

    const [attacker, defender] = await Promise.all([
      this.userService.findOne(userId),
      this.userService.findDefender(opponentId, userId),
    ]);
    await this.validateBattleConditions(attacker, defender);

    const battle = this.createBattle(attacker, defender);
    await this.lockBattleParticipants(battle);

    return battle;
  }

  /*******************************************************************
                                Combat Action
  ********************************************************************/

  private async useCraftedItem(
    itemId: ECRAFTABLE_ITEM,
    player: BattleParticipantDto,
    user: User,
  ) {
    const craftedItem = user.craftedItems.find(
      (item) => item.itemId === itemId,
    );
    if (!craftedItem || craftedItem.quantity <= 0) {
      throw new HttpException(
        "Item not found or out of stock",
        HttpStatus.BAD_REQUEST,
      );
    }
    const item = CRAFTABLE_ITEMS[itemId];
    const existingEffectIndex = player.pvp.activeEffects.findIndex(
      (effect) => effect.itemId === item.itemId,
    );

    if (existingEffectIndex !== -1) {
      player.pvp.activeEffects.splice(existingEffectIndex, 1);
    }

    player.pvp.activeEffects.push({
      itemId: item.itemId,
      effect: item.pvpEffect,
      remainingRounds: item.duration,
    });

    craftedItem.quantity--;
    if (craftedItem.quantity === 0) {
      user.craftedItems = user.craftedItems.filter(
        (item) => item.itemId !== itemId,
      );
    }
    await user.save();

    return player;
  }

  private applyActiveEffects(player: BattleParticipantDto, user?: User) {
    // @TODO be careful to update that when armory is up
    const baseStats = new UserPvp();
    for (const stat in baseStats) {
      if (stat !== "activeEffects") {
        player.pvp[stat] = baseStats[stat];
      }
    }
    if (!Array.isArray(player.pvp.activeEffects)) {
      player.pvp.activeEffects = [];
    }

    for (const activeEffect of player.pvp.activeEffects) {
      for (const [stat, value] of Object.entries(activeEffect.effect)) {
        if (
          activeEffect.itemId === ECRAFTABLE_ITEM.HEALTH_POTION_SMALL &&
          stat === "healthPoints"
        ) {
          // @TODO be careful to update that when armory is up
          const maxHealth = user.pvp.healthPoints;

          player.pvp.healthPoints = Math.min(
            maxHealth,
            player.pvp.healthPoints + value,
          );
        } else {
          player.pvp[stat] += value;
        }
      }
    }
  }

  private getAttackDamage(
    attackerDamage: number,
    attackerAccuracy: number,
    attackerCriticalChance: number,
    defenderProtection: number,
    defenderEvasion: number,
  ) {
    const randomFactor = Math.random() * 0.2 + 0.9;
    const randomDamage = Math.round(attackerDamage * randomFactor);

    let damage = Math.max(0, randomDamage - defenderProtection);
    let critical = false;

    if (Math.random() * 100 < attackerAccuracy - defenderEvasion) {
      if (Math.random() * 100 < attackerCriticalChance) {
        damage *= 2;
        critical = true;
      }
    } else {
      damage = 0;
    }

    return { damage, critical };
  }

  private performAttacks(
    attacker: BattleParticipantDto,
    defender: BattleParticipantDto,
    attackerUsedItem: boolean = false,
  ): {
    attackerAttack: { damage: number; critical: boolean };
    defenderAttack: { damage: number; critical: boolean };
    usedItemId?: ECRAFTABLE_ITEM;
  } {
    let attackerAttack = { damage: 0, critical: false };
    if (!attackerUsedItem) {
      attackerAttack = this.getAttackDamage(
        attacker.pvp.damage,
        attacker.pvp.accuracy,
        attacker.pvp.criticalChance,
        defender.pvp.protection,
        defender.pvp.evasion,
      );
    }

    const defenderAttack = this.getAttackDamage(
      defender.pvp.damage,
      defender.pvp.accuracy,
      defender.pvp.criticalChance,
      attacker.pvp.protection,
      attacker.pvp.evasion,
    );

    attacker.pvp.healthPoints -= defenderAttack.damage;
    defender.pvp.healthPoints -= attackerAttack.damage;

    return { attackerAttack, defenderAttack };
  }

  private clearActiveEffects(player: BattleParticipantDto) {
    player.pvp.activeEffects = [];
  }

  private getBaseStats(): Record<string, number> {
    return {
      healthPoints: PVP_BASE_HEALTH_POINTS,
      protection: PVP_BASE_PROTECTION,
      damage: PVP_BASE_DAMAGE,
      accuracy: PVP_BASE_ACCURACY,
      evasion: PVP_BASE_EVASION,
      criticalChance: PVP_BASE_CRITICAL_HIT_CHANCE,
      lootPower: PVP_BASE_LOOT_POWER,
    };
  }

  private decreaseEffectDuration(player: BattleParticipantDto) {
    if (player.pvp?.activeEffects?.length > 0) {
      const baseStats = this.getBaseStats();
      const expiredEffects = [];

      player.pvp.activeEffects = player.pvp.activeEffects
        .map((effect) => {
          const updatedEffect = {
            ...effect,
            remainingRounds: effect.remainingRounds - 1,
          };

          if (updatedEffect.remainingRounds === 0) {
            expiredEffects.push(effect);
          }

          return updatedEffect;
        })
        .filter((effect) => effect.remainingRounds > 0);
      expiredEffects.forEach((effect) => {
        Object.keys(effect.effect).forEach((skill) => {
          if (player.pvp[skill] !== undefined) {
            player.pvp[skill] = baseStats[skill];
          }
        });
      });
    }
  }

  private updateBattleStatus(
    battle: BattleDto,
    attackResult: {
      attackerAttack: { damage: number; critical: boolean };
      defenderAttack: { damage: number; critical: boolean };
      usedItemId?: ECRAFTABLE_ITEM;
    },
  ) {
    const { attacker, defender } = battle;
    const roundResult: RoundResultDto = {
      attackerDamage: attackResult.attackerAttack.damage,
      defenderDamage: attackResult.defenderAttack.damage,
      attackerCritical: attackResult.attackerAttack.critical,
      defenderCritical: attackResult.defenderAttack.critical,
      usedItem: attackResult.usedItemId,
    };
    battle.roundResults.push(roundResult);

    if (defender.pvp.healthPoints <= 0) {
      battle.winner = "attacker";
      this.trackPvpResult(attacker.id, defender.id, "win");
    } else if (attacker.pvp.healthPoints <= 0) {
      battle.winner = "defender";
      this.trackPvpResult(attacker.id, defender.id, "lost");
    }
  }

  private async clearBattleLocks(battle: BattleDto) {
    await Promise.all([
      this.redis.del(this.getBattleLockKey(battle.battleId)),
      this.redis.del(this.getAttackerLockKey(battle.attacker.id)),
      this.redis.del(this.getDefenderLockKey(battle.defender.id)),
      this.redis.del(this.userService.getBotKey(battle.attacker.id)),
    ]);
  }

  private defenderProductLoss(defender: User | BotUser) {
    const products = defender.products;
    const loss: LootDto[] = [];
    for (const product of products) {
      const quantity = Math.floor(product.quantity * 0.01);
      if (quantity === 0) {
        continue;
      }
      product.quantity -= Math.min(quantity, MAX_PRODUCT_LOOT);
      loss.push({ name: product.name, quantity });
    }
    return loss;
  }

  private attackerProductGain(attacker: User, gain: LootDto[]) {
    for (const product of gain) {
      const userProduct = attacker.products.find(
        (p) => p.name === product.name,
      );
      if (userProduct) {
        userProduct.quantity += product.quantity;
      } else {
        attacker.products.push({
          name: product.name,
          quantity: product.quantity,
          level: 0,
        });
      }
    }
  }

  private async updatePvpResult(battle: BattleDto) {
    const [attacker, defender] = await Promise.all([
      this.userService.findOne(battle.attacker.id),
      this.userService.findDefender(battle.defender.id, battle.attacker.id),
    ]);

    let cashLoot = 0;
    let productLoot: LootDto[] = [];

    if (battle.winner === "attacker") {
      attacker.pvp.victory++;
      // Update attacker defeat since we decreased it before the battle
      attacker.pvp.defeat--;
      defender.pvp.defeat++;

      // Steal 1% of each product from the defender
      productLoot = this.defenderProductLoss(defender);
      this.attackerProductGain(attacker, productLoot);

      // The remaining amount steal in cash, up to 5 % of the defender's cash
      const percentage = (5 - productLoot.length) / 100;
      const maxCashLoot = Math.min(
        defender.cashAmount * percentage,
        MAX_CASH_LOOT,
      );
      cashLoot = Math.floor(maxCashLoot * attacker.pvp.lootPower);

      attacker.cashAmount += cashLoot;
      defender.cashAmount -= cashLoot;

      attacker.reputation += BASE_REPUTATION_GAIN;
    } else {
      defender.pvp.victory++;
    }
    defender.pvp.lastDefendDate = new Date();

    await Promise.all([
      attacker.save(),
      (defender as any).isBot ? Promise.resolve() : (defender as any).save(),
      this.battleResultModel.create({
        battleId: battle.battleId,
        attackerId: attacker.id,
        attackerUsername: attacker.username,
        defenderId: defender.id,
        defenderUsername: defender.username,
        winner: battle.winner,
        rounds: battle.round,
        cashLoot: battle.winner === "attacker" ? cashLoot : 0,
        productLoot: battle.winner === "attacker" ? productLoot : [],
      }),
    ]);

    battle.productLoot = productLoot;
    battle.cashLoot = cashLoot;

    return battle;
  }

  private async handleBattleEnd(battle: BattleDto) {
    if (battle.winner) {
      this.clearActiveEffects(battle.attacker);
      this.clearActiveEffects(battle.defender);
      battle = await this.updatePvpResult(battle);
      await this.clearBattleLocks(battle);
    } else {
      this.trackPvpResult(battle.attacker.id, battle.defender.id, "ongoing");
      await this.redis.set(
        this.getBattleLockKey(battle.battleId),
        JSON.stringify(battle),
        "EX",
        3600,
      );
    }
  }

  async combatAction(
    userId: number,
    battleId: string,
    itemId?: ECRAFTABLE_ITEM,
  ): Promise<BattleDto> {
    const battle = await this.getBattleAndValidate(userId, battleId);
    let { attacker, defender } = battle;

    let attackerUsedItem = false;
    this.decreaseEffectDuration(attacker);
    this.decreaseEffectDuration(defender);
    if (itemId) {
      const user = await this.userService.findOne(userId);

      attacker = await this.useCraftedItem(itemId, attacker, user);
      this.applyActiveEffects(attacker, user);
      this.applyActiveEffects(defender);
      attackerUsedItem = true;
    }

    const attackResult = this.performAttacks(
      attacker,
      defender,
      attackerUsedItem,
    );
    attackResult.usedItemId = itemId;
    battle.round++;
    this.updateBattleStatus(battle, attackResult);

    battle.attacker = attacker;
    battle.defender = defender;

    await this.handleBattleEnd(battle);

    return battle;
  }

  /*******************************************************************
                                Battle History
  ********************************************************************/

  async getBattleResults(userId: number): Promise<BattleDto[]> {
    const battleResults = await this.battleResultModel
      .find({
        $or: [{ attackerId: userId }, { defenderId: userId }],
      })
      .sort({ createdAt: -1 })
      .exec();

    // Use this default value for now as we don't display it in the FE
    // And we don't want to do a BE call for each players
    return battleResults.map((result) => ({
      battleId: result.battleId,
      attacker: {
        id: result.attackerId,
        username: result.attackerUsername,
        pvp: {
          healthPoints: PVP_BASE_HEALTH_POINTS,
          protection: PVP_BASE_PROTECTION,
          damage: PVP_BASE_DAMAGE,
          accuracy: PVP_BASE_ACCURACY,
          evasion: PVP_BASE_EVASION,
          criticalChance: PVP_BASE_CRITICAL_HIT_CHANCE,
          lootPower: PVP_BASE_LOOT_POWER,
          activeEffects: [],
          attacksAvailable: 0,
          attacksToday: 0,
          lastAttackDate: new Date(),
          lastDefendDate: new Date(),
          victory: 0,
          defeat: 0,
        },
      },
      defender: {
        id: result.defenderId,
        username: result.defenderUsername,
        pvp: {
          healthPoints: PVP_BASE_HEALTH_POINTS,
          protection: PVP_BASE_PROTECTION,
          damage: PVP_BASE_DAMAGE,
          accuracy: PVP_BASE_ACCURACY,
          evasion: PVP_BASE_EVASION,
          criticalChance: PVP_BASE_CRITICAL_HIT_CHANCE,
          lootPower: PVP_BASE_LOOT_POWER,
          activeEffects: [],
          attacksAvailable: 0,
          attacksToday: 0,
          lastAttackDate: new Date(),
          lastDefendDate: new Date(),
          victory: 0,
          defeat: 0,
        },
      },
      round: result.rounds,
      roundResults: [],
      winner: result.winner === "attacker" ? "attacker" : "defender",
      cashLoot: result.cashLoot,
      productLoot: result.productLoot,
    }));
  }
}

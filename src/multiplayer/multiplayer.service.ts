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
import { CRAFTABLE_ITEMS, ECRAFTABLE_ITEM, PvpEffect } from "../lab/craftable_item.const";
import { AttackDto } from './dto/attack.dto';

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

  private async updatePvpStats(batle: BattleDto) {
    const [attacker, defender] = await Promise.all([
      this.userService.findOne(batle.attacker.id),
      this.userService.findDefender(batle.defender.id, batle.attacker.id),
    ]);

    let cashLoot = 0;
    let productLoot: LootDto[] = [];

    if (batle.winner === "attacker") {
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
        battleId: batle.battleId,
        attackerId: attacker.id,
        attackerUsername: attacker.username,
        defenderId: defender.id,
        defenderUsername: defender.username,
        winner: batle.winner,
        rounds: batle.round,
        cashLoot: batle.winner === "attacker" ? cashLoot : 0,
        productLoot: batle.winner === "attacker" ? productLoot : [],
      }),
    ]);

    batle.productLoot = productLoot;
    batle.cashLoot = cashLoot;

    return batle;
  }

  private getBattleLockKey(battleId: string) {
    return `battle:${battleId}`;
  }

  private getAttackerLockKey(userId: number) {
    return `attacking:${userId}`;
  }

  private getDefenderLockKey(userId: number) {
    return `defending:${userId}`;
  }

  private getAttackDamage(
    attackerDamage: number,
    attackerAccuracy: number,
    attackerCriticalChance: number,
    defenderProtection: number,
    defenderEvasion: number,
  ) {
    const randomFactor = Math.random() * 0.2 + 0.9; // Random factor between 0.9 and 1.1
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


  // TODO check if we lock the item before the fight maybe we don't fetch the user object
  private async useCraftedItem(userId: number, itemId: ECRAFTABLE_ITEM, player: BattleParticipantDto) {
    const user = await this.userService.findOne(userId);

    const craftedItem = user.craftedItems.find(item => item.itemId === itemId);
    if (!craftedItem || craftedItem.quantity <= 0) {
      throw new HttpException("Item not found or out of stock", HttpStatus.BAD_REQUEST);
    }

    const item = CRAFTABLE_ITEMS[itemId];
    if (!item) {
      throw new HttpException("Invalid item", HttpStatus.BAD_REQUEST);
    }

    player.pvp.activeEffects.push({
      itemId: item.itemId,
      effect: item.pvpEffect,
      remainingRounds: item.duration,
    });

    // Decrease item quantity
    craftedItem.quantity--;
    if (craftedItem.quantity === 0) {
      user.craftedItems = user.craftedItems.filter(item => item.itemId !== itemId);
    }
    await user.save();

    return player;
  }

  private applyActiveEffects(player: BattleParticipantDto) {
    for (const activeEffect of player.pvp.activeEffects) {
      for (const [stat, value] of Object.entries(activeEffect.effect)) {
        player.pvp[stat] += value;
      }
    }
  }

  private decreaseEffectDuration(player: BattleParticipantDto) {
    player.pvp.activeEffects = player.pvp.activeEffects
      .map(effect => ({ ...effect, remainingRounds: effect.remainingRounds - 1 }))
      .filter(effect => effect.remainingRounds > 0);
  }

  private clearActiveEffects(player: BattleParticipantDto) {
    player.pvp.activeEffects = [];
  }


  async performAttack(userId: number, battleId: string, body: AttackDto): Promise<BattleDto> {
    const battleString = await this.redis.get(this.getBattleLockKey(battleId));
    if (!battleString) {
      throw new HttpException("Battle not found", HttpStatus.NOT_FOUND);
    }
    let battle: BattleDto = JSON.parse(battleString);
    const { attacker, defender } = battle;

    if (attacker.id !== userId) {
      throw new HttpException("You are not the attacker", HttpStatus.FORBIDDEN);
    }


    if (body.itemId) {
      await this.useCraftedItem(userId, body.itemId, attacker);
    }

    this.applyActiveEffects(attacker);
    this.applyActiveEffects(defender);

    let attackerAttack = { damage: 0, critical: false };

    attackerAttack = this.getAttackDamage(
      attacker.pvp.damage,
      attacker.pvp.accuracy,
      attacker.pvp.criticalChance,
      defender.pvp.protection,
      defender.pvp.evasion,
    );

    const defenderAttack = this.getAttackDamage(
      defender.pvp.damage,
      defender.pvp.accuracy,
      defender.pvp.criticalChance,
      attacker.pvp.protection,
      attacker.pvp.evasion,
    );

    const roundResult: RoundResultDto = {
      attackerDamage: attackerAttack.damage,
      defenderDamage: defenderAttack.damage,
      attackerCritical: attackerAttack.critical,
      defenderCritical: defenderAttack.critical,
      usedItem: body.itemId,
    };
    battle.round++;
    battle.attacker.pvp.healthPoints -= defenderAttack.damage;
    battle.defender.pvp.healthPoints -= attackerAttack.damage;
    battle.roundResults.push(roundResult);

    if (battle.defender.pvp.healthPoints <= 0) {
      battle.winner = "attacker";

      this.mixpanel.track("Pvp", {
        distinct_id: userId,
        opponent_id: defender.id,
        type: "DeathMatch",
        value: "win",
      });
    } else if (battle.attacker.pvp.healthPoints <= 0) {
      battle.winner = "defender";

      this.mixpanel.track("Pvp", {
        distinct_id: userId,
        opponent_id: defender.id,
        type: 'Raid',
        value: 'lost',
      });
    }

    this.decreaseEffectDuration(attacker);
    this.decreaseEffectDuration(defender);

    if (battle.winner) {
      this.clearActiveEffects(attacker);
      this.clearActiveEffects(defender);
      battle = await this.updatePvpStats(battle);
      await Promise.all([
        this.redis.del(this.getBattleLockKey(battleId)),
        this.redis.del(this.getAttackerLockKey(battle.attacker.id)),
        this.redis.del(this.getDefenderLockKey(battle.defender.id)),
        this.redis.del(this.userService.getBotKey(battle.attacker.id)),
      ]);
    } else {
      this.mixpanel.track("Pvp", {
        distinct_id: userId,
        opponent_id: defender.id,
        type: "DeathMatch",
        value: "lost",
      });
      await this.redis.set(
        this.getBattleLockKey(battleId),
        JSON.stringify(battle),
        "EX",
        3600,
      );
    }
    return battle;
  }

  async startBattle(userId: number, opponentId: number) {
    const [activeAttacker, activeDefender] = await Promise.all([
      this.redis.get(this.getAttackerLockKey(userId)),
      this.redis.get(this.getDefenderLockKey(opponentId)),
    ]);

    // Check if the attacker is already in a battle
    if (activeAttacker) {
      const existingBattleString = await this.redis.get(
        this.getBattleLockKey(activeAttacker),
      );
      if (existingBattleString) {
        const existingBattle: BattleDto = JSON.parse(existingBattleString);
        const opponent = await this.userService.findDefender(
          existingBattle.defender.id,
          userId,
        );
        return {
          ...existingBattle,
          opponent: opponent,
        };
      }
    }

    if (activeDefender) {
      throw new HttpException(
        "This player is already in a battle",
        HttpStatus.UNAUTHORIZED,
      );
    }

    const [attacker, defender] = await Promise.all([
      this.userService.findOne(userId),
      this.userService.findDefender(opponentId, userId),
    ]);

    if (
      !attacker.socials.find(
        (s) => s.channel === SocialChannel.TELEGRAM_CHANNEL,
      )
    ) {
      this.mixpanel.track("Pvp", {
        distinct_id: userId,
        opponent_id: opponentId,
        type: "DeathMatch",
        value: "failed",
        condition: "telegram",
      });
      throw new HttpException(
        "You must join our Telegram channel to participate in PvP",
        HttpStatus.PRECONDITION_REQUIRED,
      );
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (attacker.pvp.lastAttackDate < today) {
      attacker.pvp.attacksToday = 0;
    }

    if (attacker.pvp.attacksToday >= attacker.pvp.attacksAvailable) {
      this.mixpanel.track("Pvp", {
        distinct_id: userId,
        opponent_id: opponentId,
        type: "DeathMatch",
        value: "failed",
        condition: "maxAttack",
      });
      throw new HttpException(
        "You have reached the maximum number of attacks for today",
        HttpStatus.PRECONDITION_FAILED,
      );
    }

    if (defender.pvp.lastDefendDate >= today) {
      this.mixpanel.track("Pvp", {
        distinct_id: userId,
        opponent_id: opponentId,
        type: "DeathMatch",
        value: "failed",
        condition: "maxDefence",
      });
      throw new HttpException(
        "This player has already been attacked today",
        HttpStatus.UNAUTHORIZED,
      );
    }
    this.mixpanel.track("Pvp", {
      distinct_id: userId,
      opponent_id: opponentId,
      type: "DeathMatch",
      value: "start",
    });
    attacker.pvp.attacksToday++;
    attacker.pvp.lastAttackDate = now;
    // We set the attacker as defeated, if he wins, we will update the stats
    attacker.pvp.defeat++;

    // Lock attacker and defender and generate battle id
    const battleId = randomUUID();
    const battle: BattleDto = {
      battleId,
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
      round: 0,
      roundResults: [],
    };
    await Promise.all([
      attacker.save(),
      this.redis.set(
        this.getBattleLockKey(battleId),
        JSON.stringify(battle),
        "EX",
        3600,
      ),
      this.redis.set(
        this.getAttackerLockKey(attacker.id),
        battleId,
        "EX",
        3600,
      ),
      this.redis.set(
        this.getDefenderLockKey(defender.id),
        battleId,
        "EX",
        3600,
      ),
    ]);

    return battle;
  }

  async getBattleResults(userId: number): Promise<BattleDto[]> {
    const battleResults = await this.battleResultModel
      .find({
        $or: [{ attackerId: userId }, { defenderId: userId }],
      })
      .sort({ createdAt: -1 })
      .exec();

    return battleResults.map((result) => ({
      battleId: result.battleId,
      attacker: this.createBattleParticipant(
        result.attackerId,
        result.attackerUsername,
      ),
      defender: this.createBattleParticipant(
        result.defenderId,
        result.defenderUsername,
      ),
      round: result.rounds,
      roundResults: [],
      winner:
        result.winner === "attacker"
          ? result.attackerId.toString()
          : result.defenderId.toString(),
      cashLoot: result.cashLoot,
      productLoot: result.productLoot,
    }));
  }

  private createBattleParticipant(
    attackerId: number,
    username: string,
  ): BattleParticipantDto {
    return {
      id: attackerId,
      username,
      pvp: new UserPvp(), // You might want to initialize this with default values
    };
  }
}
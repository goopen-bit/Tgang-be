import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { UserService } from "../user/user.service";
import { startOfDay } from "date-fns";
import { User } from "../user/schemas/user.schema";
import { BotUser } from "../user/user.interface";
import { Loot } from "./multiplayer.interface";
import { BattleResult } from "./schemas/battleResult.schema";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { MAX_CASH_LOOT, MAX_PRODUCT_LOOT } from "./multiplayer.const";
import { SocialChannel } from "src/social/social.const";

@Injectable()
export class MultiplayerService {
  constructor(
    @InjectModel(BattleResult.name)
    private battleResultModel: Model<BattleResult>,

    private readonly userService: UserService
  ) {}

  async searchPlayer(userId: number) {
    const today = startOfDay(new Date());
    return this.userService.findPvpPlayers(today, userId);
  }

  // Loop through the user list of products and steal 1% of the product from the defender
  private defenderProductLoss(defender: User | BotUser) {
    const products = defender.products;
    const loss: Loot[] = [];
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

  private attackerProductGain(attacker: User, gain: Loot[]) {
    for (const product of gain) {
      const userProduct = attacker.products.find((p) => p.name === product.name);
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

  private async determineWinner(attacker: User, defender: User | BotUser) {
    const attackerDamage = Math.max(
      0,
      attacker.pvp.damage - defender.pvp.protection,
    );
    const defenderDamage = Math.max(
      0,
      defender.pvp.damage - attacker.pvp.protection,
    );

    let attackerHp = attacker.pvp.baseHp;
    let defenderHp = defender.pvp.baseHp;

    let rounds = 0;
    let winner: "attacker" | "defender" | null = null;

    const roundResults = [];
    while (attackerHp > 0 && defenderHp > 0 && rounds < 100) {
      rounds++;
      const roundResult = {
        attackerHp,
        defenderHp,
        attackerDamage: 0,
        defenderDamage: 0,
      };

      if (Math.random() * 100 < attacker.pvp.accuracy - defender.pvp.evasion) {
        defenderHp -= attackerDamage;
        roundResult.attackerDamage = attackerDamage;
      }

      if (defenderHp <= 0) {
        winner = "attacker";
        roundResults.push(roundResult);
        break;
      }

      if (Math.random() * 100 < defender.pvp.accuracy - attacker.pvp.evasion) {
        attackerHp -= defenderDamage;
        roundResult.defenderDamage = defenderDamage;
      }

      if (attackerHp <= 0) {
        winner = "defender";
        roundResults.push(roundResult);
        break;
      }

      roundResults.push(roundResult);
    }

    if (!winner) {
      winner = attackerHp > defenderHp ? "attacker" : "defender";
    }

    return { winner, rounds, roundResults };
  }

  // Hell of a function need to be refactor to be more readable and maintainable size ^^
  async startFight(userId: number, opponentId: number) {
    const [attacker, defender] = await Promise.all([
      this.userService.findOne(userId),
      this.userService.findDefender(opponentId, userId),
    ]);

    if (!attacker.socials.find((s) => s.channel === SocialChannel.TELEGRAM_CHANNEL)) {
      throw new HttpException(
        "You must join our Telegram channel to participate in PvP",
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!attacker.pvp) {
      this.setupPvp(attacker);
    }
    if (defender instanceof User && !defender.pvp) {
      this.setupPvp(defender);
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (attacker.pvp.lastAttackDate < today) {
      attacker.pvp.attacksToday = 0;
    }

    if (attacker.pvp.attacksToday >= attacker.pvp.attacksAvailable) {
      throw new HttpException(
        "You have reached the maximum number of attacks for today",
        HttpStatus.BAD_REQUEST,
      );
    }

    if (defender.pvp.lastDefendDate >= today) {
      throw new HttpException("This player has already been attacked today", HttpStatus.BAD_REQUEST);
    }

    const { winner, rounds, roundResults } = await this.determineWinner(attacker, defender);

    attacker.pvp.attacksToday++;
    attacker.pvp.lastAttackDate = now;
    defender.pvp.lastDefendDate = now;
    let loot = 0;
    let productLoot: Loot[] = [];
    if (winner === "attacker") {
      attacker.pvp.victory++;
      defender.pvp.defeat++;

      // Steal 1% of each product from the defender
      productLoot = this.defenderProductLoss(defender);
      this.attackerProductGain(attacker, productLoot);

      // The remaining amount steal in cash, up to 5 % of the defender's cash
      const percentage = (5 - productLoot.length) / 100;
      const maxCashLoot = Math.min(defender.cashAmount * percentage, MAX_CASH_LOOT);
      loot = Math.floor(maxCashLoot * attacker.pvp.lootPower);

      attacker.cashAmount += loot;
      defender.cashAmount -= loot;

      attacker.reputation += 1000;
    } else {
      defender.pvp.victory++;
      attacker.pvp.defeat++;
    }

    await Promise.all([
      attacker.save(),
      (defender as any).isBot ? Promise.resolve() : (defender as any).save(),
      this.battleResultModel.create({
        attackerId: attacker.id,
        defenderId: defender.id,
        winner,
        rounds,
        cashLoot: winner === "attacker" ? loot : 0,
        productLoot: winner === "attacker" ? productLoot : [],
      }),
    ]);

    return {
      winner: winner === "attacker" ? attacker.username : defender.username,
      loser: winner === "attacker" ? defender.username : attacker.username,
      rounds,
      roundResults,
      loot: winner === "attacker" ? loot : 0,
    };
  }

  setupPvp(user: User) {
    if (!user.pvp) {
      user.pvp = {
        victory: 0,
        defeat: 0,
        lastAttackDate: new Date(0),
        attacksToday: 0,
        lastDefendDate: new Date(0),
      };
    }

    return user;
  }
}

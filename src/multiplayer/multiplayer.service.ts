import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { UserService } from "../user/user.service";
import { startOfDay } from "date-fns";
import { User } from "../user/schemas/user.schema";

@Injectable()
export class MultiplayerService {
  constructor(private readonly userService: UserService) {}

  async searchPlayer(userId: number) {
    const today = startOfDay(new Date());
    return this.userService.findPvpPlayers(today, userId);
  }

  // Hell of a function need to be refactor to be more readable and maintainable size ^^
  async startFight(userId: number, opponentId: number) {
    const [attacker, defender] = await Promise.all([
      this.userService.findOne(userId),
      this.userService.findDefender(opponentId, userId),
    ]);

    if (!attacker.pvp?.pvpEnabled || !defender.pvp?.pvpEnabled) {
      throw new HttpException("Both players must have PvP enabled", HttpStatus.BAD_REQUEST);
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (attacker.pvp.lastAttackDate < today) {
      attacker.pvp.attacksToday = 0;
    }

    if (attacker.pvp.attacksToday >= 2) {
      throw new HttpException(
        "You have reached the maximum number of attacks for today",
        HttpStatus.BAD_REQUEST,
      );
    }

    if (defender.pvp.lastDefendDate >= today) {
      throw new HttpException("This player has already been attacked today", HttpStatus.BAD_REQUEST);
    }

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

    while (attackerHp > 0 && defenderHp > 0 && rounds < 100) {
      rounds++;

      if (Math.random() * 100 < attacker.pvp.accuracy - defender.pvp.evasion) {
        defenderHp -= attackerDamage;
      }

      if (defenderHp <= 0) {
        winner = "attacker";
        break;
      }

      if (Math.random() * 100 < defender.pvp.accuracy - attacker.pvp.evasion) {
        attackerHp -= defenderDamage;
      }

      if (attackerHp <= 0) {
        winner = "defender";
        break;
      }
    }

    if (!winner) {
      winner = attackerHp > defenderHp ? "attacker" : "defender";
    }

    attacker.pvp.attacksToday++;
    attacker.pvp.lastAttackDate = now;
    defender.pvp.lastDefendDate = now;
    let loot = 0;
    if (winner === "attacker") {
      attacker.pvp.victory++;
      defender.pvp.defeat++;

      // improve that right now 10% of cash, max 10,000 but it's bad we need to loot product too
      const maxLoot = Math.min(defender.cashAmount * 0.1, 10000);
      loot = Math.floor(maxLoot * attacker.pvp.lootPower);

      attacker.cashAmount += loot;
      defender.cashAmount -= loot;

      attacker.reputation += 10;
    } else {
      defender.pvp.victory++;
      attacker.pvp.defeat++;
    }

    await Promise.all([
      attacker.save(),
      (defender as any).isBot ? Promise.resolve() : (defender as any).save(),
    ]);

    return {
      winner: winner === "attacker" ? attacker.username : defender.username,
      loser: winner === "attacker" ? defender.username : attacker.username,
      rounds,
      loot: winner === "attacker" ? loot : 0,
    };
  }

  async enablePvp(userId: number): Promise<{ message: string; pvp: any }> {
    const user = await this.userService.findOne(userId);

    if (!user.pvp) {
      user.pvp = {
        pvpEnabled: true,
        victory: 0,
        defeat: 0,
        lastAttackDate: new Date(0),
        attacksToday: 0,
        lastDefendDate: new Date(0),
        baseHp: 100,
        protection: 0,
        damage: 10,
        accuracy: 50,
        evasion: 5,
        lootPower: 0.1,
      };
    } else {
      user.pvp.pvpEnabled = true;
    }

    await user.save();
    return { message: "PvP enabled successfully", pvp: user.pvp };
  }
}

import { Injectable, NotFoundException } from "@nestjs/common";
import { UserService } from "../user/user.service";

@Injectable()
export class MultiplayerService {
  constructor(private readonly userService: UserService) {}

  private isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }

  async searchPlayer() {
    const players = await this.userService.findPvpPlayers();
    return players;
  }

  // Hell of a function need to be refactor to be more readable and maintainable size ^^
  async startFight(userId: string, opponentId: string) {
    const attacker = await this.userService.findOne(parseInt(userId));
    const defender = await this.userService.findOne(parseInt(opponentId));

    if (!attacker || !defender) {
      throw new NotFoundException("User not found");
    }

    if (!attacker.pvp?.pvpEnabled || !defender.pvp?.pvpEnabled) {
      throw new Error("Both players must have PvP enabled");
    }

    const now = new Date();
    const resetAttackCount =
      !attacker.pvp.lastAttack || !this.isSameDay(attacker.pvp.lastAttack, now);
    const resetDefendCount =
      !defender.pvp.lastDefend || !this.isSameDay(defender.pvp.lastDefend, now);

    if (resetAttackCount) {
      attacker.pvp.todayAttackNbr = 0;
    }
    if (resetDefendCount) {
      defender.pvp.todayDefendNbr = 0;
    }

    if (attacker.pvp.todayAttackNbr >= 3) {
      throw new Error(
        "You have reached the maximum number of attacks for today",
      );
    }

    if (defender.pvp.todayDefendNbr >= 1) {
      throw new Error("This player has already been attacked today");
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

    attacker.pvp.todayAttackNbr++;
    defender.pvp.todayDefendNbr++;
    attacker.pvp.lastAttack = now;
    defender.pvp.lastDefend = now;
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
      attacker.pvp.victory = (attacker.pvp.victory || 0) + 1;
    } else {
      defender.pvp.victory++;
      attacker.pvp.defeat++;
    }

    await this.userService.update(attacker.id, {
      pvp: attacker.pvp,
      cashAmount: attacker.cashAmount,
      reputation: attacker.reputation,
    });
    await this.userService.update(defender.id, {
      pvp: defender.pvp,
      cashAmount: defender.cashAmount,
    });

    return {
      winner: winner === "attacker" ? attacker.username : defender.username,
      loser: winner === "attacker" ? defender.username : attacker.username,
      rounds,
      loot: winner === "attacker" ? loot : 0,
    };
  }

  async enablePvp(userId: string): Promise<{ message: string; pvp: any }> {
    const user = await this.userService.findOne(parseInt(userId));

    if (!user.pvp) {
      user.pvp = {
        pvpEnabled: true,
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
      };
    } else {
      user.pvp.pvpEnabled = true;
    }

    await this.userService.update(user.id, { pvp: user.pvp });
    return { message: "PvP enabled successfully", pvp: user.pvp };
  }
}

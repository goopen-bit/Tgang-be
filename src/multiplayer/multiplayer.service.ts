import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';

@Injectable()
export class MultiplayerService {
  constructor(private readonly userService: UserService) {}

  async searchPlayer(userId: string) {
    const players = await this.userService.findPvpPlayers(userId);
    return players;
  }

  async startFight(userId: string, opponentId: string) {
    // TODO: Implement fight logic
    return { message: 'Fight not implemented yet' };
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
        lootPower: 0.1
      };
    } else {
      user.pvp.pvpEnabled = true;
    }

    await this.userService.update(user.id, { pvp: user.pvp });
    return { message: 'PvP enabled successfully', pvp: user.pvp };
  }
}
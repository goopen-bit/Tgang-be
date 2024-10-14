import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { gear } from './data/gear';
import { GearName } from './arsenal.interface';
import { UserService } from '../user/user.service';

@Injectable()
export class ArsenalService {
  constructor(
    private userService: UserService,
  ) {}

  getGear() {
    return gear;
  }

  async buyGear(userId: number, gearName: GearName) {
    const g = gear[gearName];
    if (!g) {
      throw new HttpException('Gear not found', HttpStatus.NOT_FOUND);
    }

    const user = await this.userService.findOne(userId);
    if (user.cashAmount < g.price) {
      throw new HttpException('Not enough money', HttpStatus.BAD_REQUEST);
    }

    user.cashAmount -= g.price;
    user.pvp.purchasedGear.push(g);
    await user.save();
  }

  async equipGear(userId: number, gearName: GearName) {
    const user = await this.userService.findOne(userId);
    const gearToEquip = user.pvp.purchasedGear.find((g) => g.name === gearName);
    if (!gearToEquip) {
      throw new HttpException('Gear not found', HttpStatus.NOT_FOUND);
    }

    // Unequip previous gear of the same type
    user.pvp.equippedGear = user.pvp.equippedGear.filter((g) => g.type !== gearToEquip.type);

    user.pvp.equippedGear.push(gearToEquip);
    await user.save();
  }

  async unequipGear(userId: number, gearName: GearName) {
    const user = await this.userService.findOne(userId);
    const gearToUnequip = user.pvp.equippedGear.find((g) => g.name === gearName);
    if (!gearToUnequip) {
      throw new HttpException('Gear not found', HttpStatus.NOT_FOUND);
    }

    user.pvp.equippedGear = user.pvp.equippedGear.filter((g) => g.name !== gearName);
    await user.save();
  }
}

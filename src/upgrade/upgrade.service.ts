import { Injectable, HttpException } from "@nestjs/common";
import { BuyUpgradeDto } from "./dto/buy-upgrade.dto";
import { UserService } from "../user/user.service";
import { upgradesData } from "./data/upgrades";
import { Upgrade, UpgradesCategory } from "./upgrade.interface";

@Injectable()
export class UpgradeService {
  private upgrades: UpgradesCategory[] = upgradesData;

  constructor(private userService: UserService) {}

  async buyUpgrade(userId: number, params: BuyUpgradeDto) {
    const { id } = params;
    const user = await this.userService.findOne(userId);
    const upgrade = this.findOne(id);
    if (!user || !upgrade) {
      throw new HttpException("User or Upgrade not found", 404);
    }

    if (upgrade && upgrade.locked) {
      throw new HttpException("Upgrade not unlocked", 400);
    }

    let userUpgrade = user.upgrades.find((u) => u.id === id);
    let upgradePrice: number;

    if (!userUpgrade) {
      // If the user doesn't have this upgrade yet, initialize it
      upgradePrice = upgrade.levelPrices[0];
      if (user.cashAmount < upgradePrice) {
        throw new HttpException("Not enough cash", 400);
      }
      user.upgrades.push({ ...upgrade, level: 0 });
    } else {
      // If the user already has this upgrade, get the price for the next level
      if (userUpgrade.level + 1 >= upgrade.maxLevel) {
        throw new HttpException("Upgrade already at max level", 400);
      }
      upgradePrice = upgrade.levelPrices[userUpgrade.level + 1];
      if (user.cashAmount < upgradePrice) {
        throw new HttpException("Not enough cash", 400);
      }

      userUpgrade.level += 1;
    }

    user.cashAmount -= upgradePrice;

    await user.save();
    return user;
  }

  findAll(): UpgradesCategory[] {
    return this.upgrades;
  }

  findOne(id: number): Upgrade | undefined {
    for (const category of this.upgrades) {
      const upgrade = category.upgrades.find((u) => u.id === id);
      if (upgrade) {
        return upgrade;
      }
    }
    return undefined;
  }
}

import { Injectable, HttpException } from "@nestjs/common";
import { BuyUpgradeDto } from "./dto/buy-upgrade.dto";
import { UserService } from "../user/user.service";
import { upgradesData } from "./data/upgrades";
import { Upgrade, UpgradesCategory } from "./upgrade.interface";
import { User } from "../user/user.schema";

@Injectable()
export class UpgradeService {
  private upgrades: UpgradesCategory[] = upgradesData;

  constructor(private userService: UserService) {}

  private async unlockDependentUpgrades(user: User, upgrade: Upgrade) {
    const allCategories = await this.findAll();

    allCategories.forEach((category) => {
      category.upgrades.forEach((upg) => {
        if (this.shouldUnlockUpgrade(upg, upgrade, user)) {
          const userUpg = user.upgrades.find((u) => u.id === upg.id);
          if (userUpg) {
            userUpg.locked = false;
          } else {
            user.upgrades.push({ ...upg, level: 0, locked: false });
          }
        }
      });
    });
  }

  shouldUnlockUpgrade(
    upg: Upgrade,
    purchasedUpgrade: Upgrade,
    user: User
  ): boolean {
    return (
      upg.requirement &&
      upg.requirement.title === purchasedUpgrade.title &&
      upg.requirement.level ===
        user.upgrades.find((u) => u.id === purchasedUpgrade.id)?.level
    );
  }

  private processUpgradePurchase(
    user: User,
    upgrade: Upgrade
  ): { price: number; level: number } {
    let userUpgrade = user.upgrades.find((u) => u.id === upgrade.id);
    let upgradePrice: number;

    if (!userUpgrade) {
      upgradePrice = upgrade.levelPrices[0];
      if (user.cashAmount < upgradePrice) {
        throw new HttpException("Not enough cash", 400);
      }
      user.upgrades.push({ ...upgrade, level: 0 });
      userUpgrade = user.upgrades.find((u) => u.id === upgrade.id);
    } else {
      if (userUpgrade.level + 1 >= upgrade.maxLevel) {
        throw new HttpException("Upgrade already at max level", 400);
      }
      upgradePrice = upgrade.levelPrices[userUpgrade.level + 1];
      if (user.cashAmount < upgradePrice) {
        throw new HttpException("Not enough cash", 400);
      }
      userUpgrade.level += 1;
    }

    return { price: upgradePrice, level: userUpgrade.level };
  }

  async buyUpgrade(userId: number, params: BuyUpgradeDto) {
    const { id } = params;
    const user = await this.userService.findOne(userId);
    const upgrade = await this.findOne(id);
    if (!user || !upgrade) {
      throw new HttpException("User or Upgrade not found", 404);
    }

    if (this.isProductLockedForUser(user, upgrade)) {
      throw new HttpException("Upgrade not unlocked", 400);
    }

    const userUpgrade = this.processUpgradePurchase(user, upgrade);
    user.cashAmount -= userUpgrade.price;

    this.unlockDependentUpgrades(user, upgrade);

    await user.save();
    return user;
  }

  isProductLockedForUser(user: User, upgrade: Upgrade): boolean {
    const userUpgrade = user.upgrades.find((p) => p.title === upgrade.title);
    return userUpgrade ? userUpgrade.locked : upgrade.locked;
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

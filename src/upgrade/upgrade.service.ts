import { Injectable, HttpException } from "@nestjs/common";
import { BuyUpgradeDto } from "./dto/buy-upgrade.dto";
import { UserService } from "../user/user.service";
import { upgradesData } from "./data/upgrades";
import { Upgrade, UpgradesCategory } from "./upgrade.interface";
import { User } from "../user/user.schema";
import { EProduct } from "../product/product.const";

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

  private addProductToUser(user: User, upgrade: Upgrade) {
    if (Object.values(EProduct).includes(upgrade.title as EProduct)) {
      const productExists = user.products.some((p) => p.name === upgrade.title);
      if (!productExists) {
        user.products.push({
          name: upgrade.title as EProduct,
          quantity: 0,
          unlocked: true,
        });
      }
    }
    return user;
  }

  private addCarryingGear(user: User, upgrade: Upgrade) {
    user.cashAmount -= upgrade.levelPrices[0];
    user.carryingGear.push({
      id: upgrade.id,
      title: upgrade.title,
      capacity: upgrade.value[0],
    });
    return user;
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

    return { price: upgradePrice, level: userUpgrade?.level || 0 };
  }

  async buyUpgrade(userId: number, params: BuyUpgradeDto) {
    const { id } = params;
    let user = await this.userService.findOne(userId);
    const upgrade = await this.findOne(id);
    if (!user || !upgrade) {
      throw new HttpException("User or Upgrade not found", 404);
    }
    if (this.isProductLockedForUser(user, upgrade)) {
      throw new HttpException("Upgrade not unlocked", 400);
    }
    const userUpgrade = this.processUpgradePurchase(user, upgrade);
    user.cashAmount -= userUpgrade.price;
    switch (upgrade.group) {
      case "product":
        this.addProductToUser(user, upgrade);
        break;
      case "gear":
        this.addCarryingGear(user, upgrade);
        break;
      default:
        () => {};
    }
    await this.unlockDependentUpgrades(user, upgrade);
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

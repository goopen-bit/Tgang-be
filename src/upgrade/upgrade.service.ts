import { Injectable, HttpException } from '@nestjs/common';
import { BuyUpgradeDto } from './dto/buy-upgrade.dto';
import { UserService } from '../user/user.service';
import { upgradesData } from './data/upgrades';
import {
  DealerUpgrade,
  EDealerUpgrade,
  EShippingUpgrade,
  EUpgradeCategory,
  ProductUpgrade,
  ShippingUpgrade,
  Upgrade,
} from './upgrade.interface';
import { EProduct } from '../product/product.const';
import { productUpgrades } from './data/dealerUpgrades';
import { User } from '../user/schemas/user.schema';
import { shippingUpgrades } from './data/shippingUpgrades';

@Injectable()
export class UpgradeService {
  constructor(private userService: UserService) {}

  findAll(): Upgrade {
    return upgradesData;
  }

  checkProductRequirements(user: User, upgrade: ProductUpgrade) {
    const { requirement } = upgrade;
    if (!requirement) {
      return;
    }

    const userProduct = user.products.find((p) => p.name === requirement.product);
    if (!userProduct || userProduct.level < requirement.level) {
      throw new HttpException('Upgrade not unlocked', 400);
    }
  }

  async buyProductUpgrade(userId: number, product: EProduct) {
    const user = await this.userService.findOne(userId);
    const upgrade = productUpgrades[product];
    this.checkProductRequirements(user, upgrade);
    let price = upgrade.basePrice;

    const p = user.products.find((p) => p.name === product);
    if (!p) {
      user.products.push({
        name: product,
        quantity: 0,
        image: upgrade.image,
        level: 1,
      });
    } else {
      price = p.upgradePrice;
      p.level += 1;
    }

    if (user.cashAmount < price) {
      throw new HttpException('Not enough cash', 400);
    }
    user.cashAmount -= price;

    await user.save();
    return user;
  }

  async buyDealerUpgrade(userId: number, upgrade: EDealerUpgrade) {
    const user = await this.userService.findOne(userId);
    const dealerUpgrade = upgradesData.dealer[upgrade] as DealerUpgrade;
    const du = user.dealerUpgrades.find((u) => u.title === dealerUpgrade.title);
    let price = dealerUpgrade.basePrice;
    if (!du) {
      user.dealerUpgrades.push({
        product: upgrade,
        title: dealerUpgrade.title,
        image: dealerUpgrade.image,
        level: 1,
      });
    } else {
      price = du.upgradePrice;
      du.level += 1;
    }

    if (user.cashAmount < price) {
      throw new HttpException('Not enough cash', 400);
    }
    user.cashAmount -= price;

    await user.save();
    return user;
  }

  checkShippingRequirements(user: User, upgrade: EShippingUpgrade) {
    if (upgrade === EShippingUpgrade.SHIPPING_CONTAINERS) {
      // Shipping containers scale with user referrals
      const referrals = user.referredUsers.length;

      const shippingUpgrade = user.shippingUpgrades.find((u) => u.product === upgrade);
      if (shippingUpgrade && shippingUpgrade.level - 1 >= referrals) {
        throw new HttpException(`Invite ${shippingUpgrade.level} users to unlock next level`, 400);
      }
    }
  }

  async buyShippingUpgrade(userId: number, upgrade: EShippingUpgrade) {
    const user = await this.userService.findOne(userId);
    this.checkShippingRequirements(user, upgrade);

    const shippingUpgrade = shippingUpgrades[upgrade];
    const su = user.shippingUpgrades.find((u) => u.product === upgrade);
    let price = shippingUpgrade.basePrice;
    if (!su) {
      user.shippingUpgrades.push({
        product: upgrade,
        title: shippingUpgrade.title,
        image: shippingUpgrade.image,
        level: 1,
      });
    } else {
      price = su.upgradePrice;
      su.level += 1;
    }

    if (user.cashAmount < price) {
      throw new HttpException('Not enough cash', 400);
    }
    user.cashAmount -= price;

    await user.save();
    return user;
  }

  buyUpgrade(userId: number, params: BuyUpgradeDto) {
    switch (params.category) {
      case EUpgradeCategory.PRODUCT:
        return this.buyProductUpgrade(userId, params.upgrade as EProduct);
      case EUpgradeCategory.DEALER:
        return this.buyDealerUpgrade(userId, params.upgrade as EDealerUpgrade);
      case EUpgradeCategory.SHIPPING:
        return this.buyShippingUpgrade(userId, params.upgrade as EShippingUpgrade);
      default:
        throw new HttpException('Invalid upgrade category', 400);
    }
  }
}

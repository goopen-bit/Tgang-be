import { Injectable, HttpException } from '@nestjs/common';
import { BuyUpgradeDto } from './dto/buy-upgrade.dto';
import { UserService } from '../user/user.service';
import { upgradesData } from './data/upgrades';
import {
  DealerUpgrade,
  EDealerUpgrade,
  EUpgradeCategory,
  ProductUpgrade,
  Upgrade,
} from './upgrade.interface';
import { EProduct } from '../product/product.const';

@Injectable()
export class UpgradeService {
  constructor(private userService: UserService) {}

  findAll(): Upgrade {
    return upgradesData;
  }

  async buyProductUpgrade(userId: number, product: EProduct) {
    const user = await this.userService.findOne(userId);
    const upgrade = upgradesData.product[product] as ProductUpgrade;
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

  buyUpgrade(userId: number, params: BuyUpgradeDto) {
    console.log(params);
    switch (params.category) {
      case EUpgradeCategory.PRODUCT:
        return this.buyProductUpgrade(userId, params.upgrade as EProduct);
      case EUpgradeCategory.DEALER:
        return this.buyDealerUpgrade(userId, params.upgrade as EDealerUpgrade);
      default:
        throw new HttpException('Invalid upgrade category', 400);
    }
  }
}

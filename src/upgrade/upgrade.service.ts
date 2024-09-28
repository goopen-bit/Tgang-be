import { Injectable, HttpException } from "@nestjs/common";
import { BuyUpgradeDto } from "./dto/buy-upgrade.dto";
import { UserService } from "../user/user.service";
import { MarketService } from "../market/market.service";
import { upgradesData } from "./data/upgrades";
import {
  DealerUpgrade,
  EDealerUpgrade,
  EUpgradeCategory,
  Upgrade,
} from "./upgrade.interface";
import { EProduct } from "../market/market.const";
import { productUpgrades } from "./data/dealerUpgrades";
import { Mixpanel } from "mixpanel";
import { InjectMixpanel } from "../analytics/injectMixpanel.decorator";
import { checkRequirements } from "./upgrade.util";

@Injectable()
export class UpgradeService {
  constructor(
    private userService: UserService,
    private marketService: MarketService,
    @InjectMixpanel() private readonly mixpanel: Mixpanel,
  ) {}

  findAll(): Upgrade {
    return upgradesData;
  }

  async buyProductUpgrade(userId: number, product: EProduct) {
    const user = await this.userService.findOne(userId);
    const upgrade = productUpgrades[product];
    checkRequirements(user, upgrade.requirements);
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
      if (p.nextUpgrade > new Date()) {
        throw new HttpException("Upgrade not available yet", 400);
      }

      price = p.upgradePrice;
      p.level += 1;
      p.lastUpgrade = new Date();
    }

    if (user.cashAmount < price) {
      throw new HttpException("Not enough cash", 400);
    }
    user.cashAmount -= price;

    await user.save();
    this.mixpanel.track("Upgrade Bought", {
      distinct_id: user.id,
      type: "Product",
      value: product,
    });
    return user;
  }

  async buyDealerUpgrade(userId: number, upgrade: EDealerUpgrade) {
    const user = await this.userService.findOne(userId);
    const dealerUpgrade = upgradesData.dealer[upgrade] as DealerUpgrade;
    checkRequirements(user, dealerUpgrade.requirements);
    const du = user.dealerUpgrades.find((u) => u.title === dealerUpgrade.title);
    let price = dealerUpgrade.basePrice;
    if (!du) {
      user.dealerUpgrades.push({
        upgrade: upgrade,
        title: dealerUpgrade.title,
        image: dealerUpgrade.image,
        level: 1,
      });
    } else {
      if (du.nextUpgrade > new Date()) {
        throw new HttpException("Upgrade not available yet", 400);
      }

      price = du.upgradePrice;
      du.level += 1;
      du.lastUpgrade = new Date();
    }

    if (user.cashAmount < price) {
      throw new HttpException("Not enough cash", 400);
    }
    user.cashAmount -= price;

    await user.save();
    this.mixpanel.track("Upgrade Bought", {
      distinct_id: user.id,
      type: "Dealer",
      value: upgrade,
    });
    return user;
  }

  async buyUpgrade(userId: number, params: BuyUpgradeDto) {
    let updatedUser;
    switch (params.category) {
      case EUpgradeCategory.PRODUCT:
        updatedUser = await this.buyProductUpgrade(
          userId,
          params.upgrade as EProduct,
        );
        break;
      case EUpgradeCategory.DEALER:
        updatedUser = await this.buyDealerUpgrade(
          userId,
          params.upgrade as EDealerUpgrade,
        );
        break;
      default:
        throw new HttpException("Invalid upgrade category", 400);
    }

    // @note todo add current market id to user
    const userMarketId = "NY";
    const updatedMarket = await this.marketService.getMarketWithReputation(
      userMarketId,
      userId,
    );

    return { user: updatedUser, market: updatedMarket };
  }
}

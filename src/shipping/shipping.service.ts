import { HttpException, Injectable, Logger } from "@nestjs/common";
import { UserService } from "../user/user.service";
import { MarketService } from "../market/market.service";
import { ShipProductDto } from "./dto/ship-product.dto";
import { EShippingMethod } from "./shipping.const";
import { shippingMethods } from "./data/shipping";
import { ShippingMethod } from "./shipping.interface";
import { User } from "../user/schemas/user.schema";
import { Mixpanel } from "mixpanel";
import { InjectMixpanel } from "../analytics/injectMixpanel.decorator";

@Injectable()
export class ShippingService {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    private userService: UserService,
    private marketService: MarketService,
    @InjectMixpanel() private readonly mixpanel: Mixpanel,
  ) {}

  getShippingMethods() {
    return shippingMethods;
  }

  checkShippingRequirements(user: User, upgrade: EShippingMethod) {
    const shippingUpgrade = shippingMethods[upgrade] as ShippingMethod;
    if (!shippingUpgrade.requirement) {
      return;
    }

    if (shippingUpgrade.requirement.type === "fixed") {
      if (
        user.referredUsers.length <= shippingUpgrade.requirement.referredUsers
      ) {
        throw new HttpException(
          `Invite ${shippingUpgrade.requirement.referredUsers} users to upgrade`,
          400
        );
      } else {
        return;
      }
    }

    const userUpgrade = user.shipping.find((u) => u.method === upgrade);
    if (!userUpgrade) {
      if (
        user.referredUsers.length <= shippingUpgrade.requirement.referredUsers
      ) {
        throw new HttpException(
          `Invite ${shippingUpgrade.requirement.referredUsers} users to upgrade`,
          400
        );
      } else {
        return;
      }
    }

    if (
      userUpgrade.capacityLevel + shippingUpgrade.requirement.referredUsers <=
      shippingUpgrade.requirement.referredUsers
    ) {
      throw new HttpException(
        `Invite ${
          userUpgrade.capacityLevel + shippingUpgrade.requirement.referredUsers
        } users to upgrade`,
        400
      );
    }
  }

  async buyShippingUpgrade(userId: number, upgrade: EShippingMethod) {
    this.logger.debug(`User ${userId} is buying shipping upgrade ${upgrade}`);

    const user = await this.userService.findOne(userId);
    this.checkShippingRequirements(user, upgrade);

    const userShipping = user.shipping.find((u) => u.method === upgrade);
    if (userShipping) {
      throw new HttpException("Upgrade already bought", 400);
    }

    const shippingUpgrade = shippingMethods[upgrade] as ShippingMethod;
    if (user.cashAmount < shippingUpgrade.basePrice) {
      throw new HttpException("Not enough cash", 400);
    }

    user.cashAmount -= shippingUpgrade.basePrice;
    user.shipping.push({
      method: upgrade,
      title: shippingUpgrade.title,
      image: shippingUpgrade.image,
      capacityLevel: 1,
      shippingTimeLevel: 1,
    });
    await user.save();
    this.mixpanel.track("Shipping Upgrade Bought", {
      distinct_id: user.id,
      upgrade,
    });
    return user;
  }

  async upgradeShippingCapacity(userId: number, upgrade: EShippingMethod) {
    this.logger.debug(
      `User ${userId} is upgrading shipping capacity ${upgrade}`
    );

    const user = await this.userService.findOne(userId);
    this.checkShippingRequirements(user, upgrade);

    const userShipping = user.shipping.find((u) => u.method === upgrade);
    if (!userShipping) {
      throw new HttpException("Upgrade not bought", 400);
    }

    if (user.cashAmount < userShipping.upgradeCapacityPrice) {
      throw new HttpException("Not enough cash", 400);
    }

    user.cashAmount -= userShipping.upgradeCapacityPrice;
    userShipping.capacityLevel += 1;
    await user.save();
    this.mixpanel.track("Shipping Capacity Upgraded", {
      distinct_id: user.id,
      upgrade,
      capacity: userShipping.capacityLevel,
    });
    return user;
  }

  async upgradeShippingTime(userId: number, upgrade: EShippingMethod) {
    this.logger.debug(`User ${userId} is upgrading shipping time ${upgrade}`);

    const user = await this.userService.findOne(userId);
    this.checkShippingRequirements(user, upgrade);

    const userShipping = user.shipping.find((u) => u.method === upgrade);
    if (!userShipping) {
      throw new HttpException("Upgrade not bought", 400);
    }

    if (user.cashAmount < userShipping.upgradeShippingTimePrice) {
      throw new HttpException("Not enough cash", 400);
    }

    user.cashAmount -= userShipping.upgradeShippingTimePrice;
    userShipping.shippingTimeLevel += 1;
    await user.save();
    this.mixpanel.track("Shipping Time Upgraded", {
      distinct_id: user.id,
      upgrade,
      time: userShipping.shippingTimeLevel,
    });
    return user;
  }

  async shipProduct(userId: number, marketId: string, ship: ShipProductDto) {
    this.logger.debug(
      `User ${userId} is shipping products ${JSON.stringify(ship.product)}`
    );

    const user = await this.userService.findOne(userId);
    const method = user.shipping.find((s) => s.method === ship.shippingMethod);
    if (!method) {
      this.logger.error("Shipping method not found");
      throw new HttpException(
        `You can not ship using ${ship.shippingMethod}`,
        400
      );
    }

    if (method.nextShipment > new Date()) {
      this.logger.error("You can ship products yet");
      throw new HttpException("You can ship products yet", 400);
    }

    if (method.capacity < ship.amount) {
      this.logger.error("Not enough shipping capacity");
      throw new HttpException("Not enough shipping capacity", 400);
    }

    const market = await this.marketService.getMarket(marketId);
    const marketProduct = market.products.find((p) => p.name === ship.product);
    const product = user.products.find((p) => p.name === ship.product);
    if (product.quantity < ship.amount) {
      this.logger.error(`Not enough quantity of product ${ship.product}`);
      throw new HttpException(
        `Not enough quantity of product ${ship.product}`,
        400
      );
    }

    product.quantity -= ship.amount;
    user.cashAmount += marketProduct.price * ship.amount;
    method.lastShipment = new Date();
    user.reputation += ship.amount;

    await user.save();
    this.mixpanel.track("Product Shipped", {
      distinct_id: user.id,
      product: ship.product,
      amount: ship.amount,
      shippingMethod: ship.shippingMethod,
    });
    return user;
  }
}

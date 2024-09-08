import {
  HttpException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { UserService } from "../user/user.service";
import { markets } from "./data/market";
import { events } from "./data/event";
import { cloneDeep } from "lodash";
import { createHash } from "crypto";
import { Market } from "./market.interface";
import { BuyProductDto } from "./dto/buy-product.dto";
import { SellProductDto } from "./dto/sell-product.dto";
import { Mixpanel } from "mixpanel";
import { InjectMixpanel } from "../analytics/injectMixpanel.decorator";
import { productUpgrades } from "../upgrade/data/dealerUpgrades";
import { startOfDay, getUnixTime, subDays, subSeconds } from "date-fns";

@Injectable()
export class MarketService {
  private readonly logger = new Logger(this.constructor.name);
  private readonly secretKey = "STcHRUjgRaXK3fFn5Pi4rvAMAhKRZGCfqzexFAEiTzU=";

  constructor(
    private userService: UserService,

    // @InjectRedis() private readonly redis: Redis, // Enable this when we get a proper Redis instance

    @InjectMixpanel() private readonly mixpanel: Mixpanel,
  ) {}

  getHistoricalEvents() {
    const currentTime = Math.floor(Date.now() / 1000);
    const eventsList = [];
    for (let i = 0; i < 5; i++) {
      const secondsSinceEpochStartOfHour = currentTime - i * 3600;
      const hash = createHash("sha256")
        .update(this.secretKey + secondsSinceEpochStartOfHour.toString())
        .digest("hex");

      const hashInteger = parseInt(hash, 16);

      eventsList.push(events[hashInteger % events.length]);
    }

    return eventsList;
  }

  private getDailyHash(date: Date): string {
    const specificTime = startOfDay(date);
    const secondsSinceEpoch = getUnixTime(specificTime);
    return createHash("sha256")
      .update(this.secretKey + secondsSinceEpoch.toString())
      .digest("hex");
  }

  getMarket(id: string, date = new Date()) {
    const originalMarket = markets.find((market) => market.id === id);
    if (!originalMarket) {
      throw new NotFoundException(`Market with id ${id} not found`);
    }

    const market = cloneDeep(originalMarket) as Market;
    const today = date;
    const yesterday = subDays(today, 1);

    const todayHash = this.getDailyHash(today);
    const yesterdayHash = this.getDailyHash(yesterday);

    const todayHashInteger = parseInt(todayHash.slice(0, 8), 16);
    const yesterdayHashInteger = parseInt(yesterdayHash.slice(0, 8), 16);

    market.products.forEach((product, index) => {
      let effectToday, effectYesterday;

      if (index === 0) {
        // For the first product (Herb) which should vary only within ±5%
        effectToday = ((todayHashInteger >> (index * 4)) % 11) / 100; // 0% to +10%
        effectYesterday = ((yesterdayHashInteger >> (index * 4)) % 11) / 100; // 0% to +10%
      } else {
        // For other products, vary within ±5% to ±30%
        effectToday = (5 + ((todayHashInteger >> (index * 4)) % 26)) / 100;
        effectYesterday =
          (5 + ((yesterdayHashInteger >> (index * 4)) % 26)) / 100;
      }

      // Determine the direction of the price change
      const priceChangeDirectionToday =
        (todayHashInteger >> (index * 4 + 1)) % 2 === 0 ? 1 : -1;
      const priceChangeDirectionYesterday =
        (yesterdayHashInteger >> (index * 4 + 1)) % 2 === 0 ? 1 : -1;

      effectToday *= priceChangeDirectionToday;
      effectYesterday *= priceChangeDirectionYesterday;

      product.previousPrice = Number(
        (product.price * (1 + effectYesterday)).toFixed(2),
      );
      product.price = Number((product.price * (1 + effectToday)).toFixed(2));
    });
    return market;
  }

  async getMarketWithReputation(marketId: string, userId: number) {
    const originalMarket = await this.getMarket(marketId);

    // Create a deep copy of the market to avoid modifying the original data
    const market = cloneDeep(originalMarket) as Market;
    const user = await this.userService.findOne(userId);

    market.products.forEach((product) => {
      const productUpgrade = user.products.find((p) => p.name === product.name);
      if (productUpgrade) {
        const discount = productUpgrade.marketDiscount;
        product.discountPrice = Number(
          ((product.price * (100 - discount)) / 100).toFixed(2),
        );
      } else {
        const baseProduct = productUpgrades[product.name];
        product.discountPrice = Number(
          ((product.price * (100 - baseProduct.baseDiscount)) / 100).toFixed(2),
        );
      }
    });
    return market;
  }

  async buyProduct(userId: number, marketId: string, params: BuyProductDto) {
    const { product, quantity } = params;
    const user = await this.userService.findOne(userId);
    const market = await this.getMarketWithReputation(marketId, userId);
    if (!user || !market) {
      throw new HttpException("User or market not found", 404);
    }

    const marketProduct = market.products.find((p) => p.name === product);
    if (user.cashAmount < marketProduct.discountPrice * quantity) {
      throw new HttpException("Not enough cash", 400);
    }

    const userProduct = user.products.find((p) => p.name === product);
    if (userProduct) {
      user.cashAmount = Number(
        (user.cashAmount - marketProduct.discountPrice * quantity).toFixed(2),
      );
      userProduct.quantity += quantity;
    } else {
      throw new HttpException("Product not unlocked", 400);
    }
    await user.save();
    this.mixpanel.track("Product Bought", {
      distinct_id: user.id,
      product,
      quantity,
    });
    return user;
  }

  async sellProduct(
    userId: number,
    marketId: string,
    sellList: SellProductDto,
  ) {
    this.logger.debug(`Selling products for user ${userId}`);

    // const lockKey = `sellProduct:${marketId}:${userId}`;

    // while (!await this.redis.set(lockKey, 'locked', 'EX', 2, 'NX')) {
    //   await new Promise((resolve) => setTimeout(resolve, 100));
    // }

    const user = await this.userService.findOne(userId);
    const market = this.getMarket(marketId);
    // try {
    let reputation = 0;
    for (const item of sellList.batch) {
      const product = user.products.find((p) => p.name === item.product);
      if (!product) {
        throw new HttpException(`Product ${item.product} not found`, 404);
      }

      const dealerUpgrade = user.dealerUpgrades.find(
        (u) => u.product === item.product,
      );
      const quantity = dealerUpgrade ? dealerUpgrade.level + 1 : 1;

      let customers = item.customers;
      if (user.customerAmount < item.customers) {
        customers = user.customerAmount;
      }
      if (customers === 0) {
        continue;
      }

      let amountToSell = customers * quantity;
      if (product.quantity < amountToSell) {
        amountToSell = product.quantity;
      }
      if (amountToSell === 0) {
        continue;
      }

      const customerAmountRemaining = user.customerAmount - customers;
      user.customerAmountRemaining =
        customerAmountRemaining < 0 ? 0 : customerAmountRemaining;

      product.quantity -= amountToSell;
      reputation += amountToSell;
      const marketPrice = market.products.find(
        (p) => p.name === item.product,
      ).price;
      user.cashAmount = Number(
        (user.cashAmount + marketPrice * amountToSell).toFixed(2),
      );
    }

    user.lastSell = subSeconds(new Date(), 1);
    user.reputation += reputation;
    await user.save();
    this.mixpanel.track("Product Sold", {
      distinct_id: user.id,
      products: sellList.batch,
      reputation,
    });
    // } catch (error) {
    //   this.logger.error(error);
    //   throw error;
    // } finally {
    //   await this.redis.del(lockKey);
    // }
    return user;
  }
}

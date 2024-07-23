import { Injectable } from "@nestjs/common";
import { UserService } from "../user/user.service";
import { markets } from "./data/market";
import { events } from "./data/event";
import { cloneDeep } from "lodash";
import { createHash } from "crypto";
import { Market } from "./market.interface";

@Injectable()
export class MarketService {
  constructor(private userService: UserService) {}

  getHistoricalEvents() {
    const currentTime = Math.floor(Date.now() / 1000);
    const eventsList = [];
    for (let i = 0; i < 5; i++) {
      const secondsSinceEpochStartOfHour = currentTime - i * 3600;
      const hash = createHash("sha256")
        .update(secondsSinceEpochStartOfHour.toString())
        .digest("hex");

      const hashInteger = parseInt(hash, 16);

      eventsList.push(events[hashInteger % events.length]);
    }

    return eventsList;
  }

  private getDailyHash(date: Date): string {
    const specificTime = new Date(date.setHours(22, 42, 0, 0));
    const secondsSinceEpoch = Math.floor(specificTime.getTime() / 1000);
    return createHash("sha256")
      .update(secondsSinceEpoch.toString())
      .digest("hex");
  }

  getMarket(id: string) {
    const originalMarket = markets.find((market) => market.id === id);
    if (!originalMarket) {
      throw new Error(`Market with id ${id} not found`);
    }

    const market = cloneDeep(originalMarket) as Market;
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const todayHash = this.getDailyHash(today);
    const yesterdayHash = this.getDailyHash(yesterday);

    const todayHashInteger = parseInt(todayHash.slice(0, 8), 16);
    const yesterdayHashInteger = parseInt(yesterdayHash.slice(0, 8), 16);

    market.products.forEach((product, index) => {
      let effectToday, effectYesterday;
      let priceChangeDirectionToday, priceChangeDirectionYesterday;

      if (index === 0) {
        // For the first product (Weed) which should vary only within ±5%
        effectToday = ((todayHashInteger >> (index * 4)) % 11) / 100; // 0% to +10%
        effectYesterday = ((yesterdayHashInteger >> (index * 4)) % 11) / 100; // 0% to +10%
      } else {
        // For other products, vary within ±5% to ±30%
        effectToday = (5 + ((todayHashInteger >> (index * 4)) % 26)) / 100;
        effectYesterday =
          (5 + ((yesterdayHashInteger >> (index * 4)) % 26)) / 100;
      }

      // Determine the direction of the price change
      priceChangeDirectionToday =
        (todayHashInteger >> (index * 4 + 1)) % 2 === 0 ? 1 : -1;
      priceChangeDirectionYesterday =
        (yesterdayHashInteger >> (index * 4 + 1)) % 2 === 0 ? 1 : -1;

      effectToday *= priceChangeDirectionToday;
      effectYesterday *= priceChangeDirectionYesterday;

      product.previousPrice = Math.floor(product.price * (1 + effectYesterday));
      product.price = Math.floor(product.price * (1 + effectToday));
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
        product.discountPrice = Math.floor(
          (product.price * (100 - discount)) / 100
        );
      } else {
        product.discountPrice = product.price;
      }
    });
    return market;
  }
}

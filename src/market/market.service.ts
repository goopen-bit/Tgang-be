import { Injectable } from "@nestjs/common";
import { UserService } from "../user/user.service";
import { markets } from "./data/market";
import { cloneDeep } from "lodash";

@Injectable()
export class MarketService {
  constructor(private userService: UserService) {}

  getMarket(id: string) {
    return markets.find((market) => market.id === id);
  }

  async getMarketWithReputation(marketId: string, userId: number) {
    const originalMarket = await this.getMarket(marketId);
    if (!originalMarket) {
      throw new Error(`Market with id ${marketId} not found`);
    }

    // Create a deep copy of the market to avoid modifying the original data
    const market = cloneDeep(originalMarket);
    const user = await this.userService.findOne(userId);

    market.products.forEach((product) => {
      // @note remove reputation for now
      // product.price = product.price * (1 - user.reputation / 100);
      const dealerUpgrade = user.upgrades.find(
        (upgrade) =>
          upgrade.group === "product" && upgrade.title === product.name
      );
      if (dealerUpgrade) {
        const discount = dealerUpgrade.value[dealerUpgrade.level];
        product.price = product.price * discount;
      }
    });
    return market;
  }
}

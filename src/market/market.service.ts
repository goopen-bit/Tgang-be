import { Injectable } from "@nestjs/common";
import { UserService } from "../user/user.service";
import { markets } from "./data/market";

@Injectable()
export class MarketService {
  constructor(
    private userService: UserService
  ) {}

  getMarket(id: string) {
    return markets.find((market) => market.id === id);
  }

  async getMarketWithReputation(marketId: string, userId: number) {
    const market = await this.getMarket(marketId);
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

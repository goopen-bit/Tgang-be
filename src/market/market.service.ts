import { Injectable } from "@nestjs/common";
import { UserService } from "../user/user.service";
import { Market } from "./market.schema";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

@Injectable()
export class MarketService {
  constructor(
    @InjectModel(Market.name)
    private marketModel: Model<Market>,

    private userService: UserService
  ) {}

  getMarket(id: string) {
    return this.marketModel.findOne({ id });
  }

  async getMarketWithReputation(marketId: string, userId: number) {
    const market = await this.getMarket(marketId);
    const user = await this.userService.findOne(userId);
    market.products.forEach((product) => {
      product.price = Math.floor(product.price * (1 - user.reputation / 100));
      const dealerUpgrade = user.upgrades.find(
        (upgrade) =>
          upgrade.group === "product" && upgrade.title === product.name
      );
      if (dealerUpgrade) {
        const discount = dealerUpgrade.value[dealerUpgrade.level];
        product.price = Math.floor(product.price * discount);
      }
    });

    return market;
  }
}

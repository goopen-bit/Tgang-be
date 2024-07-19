import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { markets } from './data/market';
import { cloneDeep } from 'lodash';

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
      const productUpgrade = user.products.find((p) => p.name === product.name);
      if (productUpgrade) {
        const discount = productUpgrade.marketDiscount;
        product.discountPrice = Math.floor((product.price * (100 - discount)) / 100);
      } else {
        product.discountPrice = product.price;
      }
    });
    return market;
  }
}

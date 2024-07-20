import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { markets } from './data/market';
import { events } from './data/event';
import { cloneDeep } from 'lodash';
import { createHash } from 'crypto';
import { Market } from './market.interface';

@Injectable()
export class MarketService {
  constructor(private userService: UserService) {}

  private getHourlyRandomNumber() {
      const currentTime = Math.floor(Date.now() / 1000);
      const secondsSinceEpochStartOfHour = currentTime - (currentTime % 3600);
      const hash = createHash('sha256').update(secondsSinceEpochStartOfHour.toString()).digest('hex');
      const hashInteger = parseInt(hash, 16);

      return events[hashInteger % events.length];
  }

  getHistoricalEvents() {
    const currentTime = Math.floor(Date.now() / 1000);
    const eventsList = [];
    for (let i = 0; i < 5; i++) {
      const secondsSinceEpochStartOfHour = currentTime - (i * 3600);
      const hash = createHash('sha256').update(secondsSinceEpochStartOfHour.toString()).digest('hex');
      const hashInteger = parseInt(hash, 16);
      eventsList.push(events[hashInteger % events.length]);
    }
    return eventsList;
  }

  getMarket(id: string) {
    const originalMarket = markets.find((market) => market.id === id);
    if (!originalMarket) {
      throw new Error(`Market with id ${id} not found`);
    }

    const event = this.getHourlyRandomNumber();
    const market = cloneDeep(originalMarket) as Market;

    const product = market.products.find((product) => product.name === event.product);
    product.price = Math.floor(product.price * event.effect);
    market.event = event;
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
        product.discountPrice = Math.floor((product.price * (100 - discount)) / 100);
      } else {
        product.discountPrice = product.price;
      }
    });
    return market;
  }
}

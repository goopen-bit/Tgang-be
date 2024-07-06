import { InjectRedis } from '@goopen/nestjs-ioredis-provider';
import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { UserService } from '../user/user.service';
import { AuthTokenData } from '../config/types';
import { CUSTOMER_LIMIT, PRICE_MULTIPLIER } from '../user/user.const';
import { MarketService } from '../market/market.service';
import { faker } from '@faker-js/faker';
import { Customer } from './customer.interface';

@Injectable()
export class CustomerService {
  constructor(
    @InjectRedis() private readonly redisClient: Redis,

    private userService: UserService,
    private marketService: MarketService,
  ) {}

  private getCustomerKey(userId: number, marketId: string) {
    return `${marketId}:${userId}`;
  }

  private async generateCustomerList(userId: number, marketId: string): Promise<Customer[]> {
    const user = await this.userService.findOne(userId);
    const market = await this.marketService.getMarket(marketId);

    const limit = CUSTOMER_LIMIT + Math.log1p(user.reputation);
    const priceMultiplier = PRICE_MULTIPLIER + Math.log1p(user.reputation) / 10;
    // Generate a list of buyers from the market for random products
    const customerList = [];
    for (let i = 0; i < limit; i++) {
      const product = market.products[Math.floor(Math.random() * market.products.length)];
      const quantity = Math.floor(Math.random() * 10) + 1;
      customerList.push({
        name: faker.person.fullName(),
        product: product.name,
        quantity,
        price: Math.floor(product.price * priceMultiplier).toFixed(2)
      });
    }

    return customerList;
  }

  async findOneOrCreate(userId: number, marketId: string) {
    const key = this.getCustomerKey(userId, marketId);
    const customerList = await this.redisClient.get(key);
    if (customerList) {
      return JSON.parse(customerList);
    }
    const customers = await this.generateCustomerList(userId, marketId);
    await this.redisClient.set(key, JSON.stringify(customers), 'EX', 60);
    return customers;
  }

  async updateQuantity(userId: number, marketId: string, name: string, quantity: number) {
    const key = this.getCustomerKey(userId, marketId);
    const customerList = await this.redisClient.get(key);
    if (!customerList) {
      return;
    }
    const customers = JSON.parse(customerList);
    const customer = customers.find((c) => c.name === name);
    if (!customer) {
      return;
    }
    customer.quantity = quantity;
    await this.redisClient.set(key, JSON.stringify(customers));
  }
}

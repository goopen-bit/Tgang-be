import { InjectRedis } from "@goopen/nestjs-ioredis-provider";
import { Injectable, Logger } from "@nestjs/common";
import Redis from "ioredis";
import { MarketService } from "../market/market.service";
import { Market } from "../market/market.schema";
import { CustomerBatchDto } from "./dto/customer-batch.dto";

@Injectable()
export class CustomerService {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    @InjectRedis() private readonly redisClient: Redis,
    private marketService: MarketService
  ) {}

  getIndexFromTimeStamp(timestamp: Date) {
    return Math.floor(timestamp.getTime() / 60000);
  }

  getTimeStampFromIndex(index: number) {
    return new Date(index * 60000);
  }

  getBatchIndexKey(marketId: string) {
    return `customers:${marketId}:batchIndex`;
  }

  getBatchKey(marketId: string, batchIndex: number) {
    return `customers:${marketId}:${batchIndex}`;
  }

  async generateCustomers(market: Market, index: number) {
    const customers = [];
    for (let i = 0; i < 100; i++) {
      customers.push({
        // @note use only weed to test for now as it make it hard to play otherwise
        // product: market.products[Math.floor(Math.random() * market.products.length)],
        product: market.products[0],
        quantity: Math.floor(Math.random() * 3) + 1,
        customerIndex: index * 100 + i,
      });
    }

    const batchKey = this.getBatchKey(market.id, index);
    const expireTime = this.getTimeStampFromIndex(index + 60);
    const ttl = expireTime.getTime() - Date.now();
    await this.redisClient.set(batchKey, JSON.stringify(customers), "PX", ttl);
    const batchIndexKey = this.getBatchIndexKey(market.id);
    await this.redisClient.set(batchIndexKey, index);
  }

  async generateCustomerBatches(marketId: string, targetTimestamp: Date) {
    const market = await this.marketService.getMarket(marketId);
    const batchIndexKey = this.getBatchIndexKey(marketId);
    const batchIndex = await this.redisClient.get(batchIndexKey);

    let index = batchIndex
      ? parseInt(batchIndex)
      : this.getIndexFromTimeStamp(new Date());
    while (this.getTimeStampFromIndex(index) < targetTimestamp) {
      await this.generateCustomers(market, index);
      index++;
    }
  }

  getBatchIndexFromCustomerIndex(customerIndex: number) {
    return Math.floor(customerIndex / 100);
  }

  async getCustomerBatch(
    marketId: string,
    customerBatchIndex: number
  ): Promise<CustomerBatchDto[]> {
    // Don't return batches older or newer than one hour
    if (
      this.getTimeStampFromIndex(customerBatchIndex).getTime() <
        new Date().getTime() - 3600000 ||
      this.getTimeStampFromIndex(customerBatchIndex).getTime() >
        new Date().getTime() + 3600000
    ) {
      throw new Error("Invalid customer batch index");
    }

    const batchIndexKey = this.getBatchIndexKey(marketId);
    const batchIndex = await this.redisClient.get(batchIndexKey);
    const index = batchIndex
      ? parseInt(batchIndex)
      : this.getIndexFromTimeStamp(new Date());

    const customerBatchTimestamp = this.getTimeStampFromIndex(
      customerBatchIndex + 60
    );

    if (this.getTimeStampFromIndex(index) < customerBatchTimestamp) {
      this.logger.debug(
        `Generating customer batches for ${marketId} up to ${customerBatchTimestamp}`
      );
      await this.generateCustomerBatches(marketId, customerBatchTimestamp);
    }

    const batchKey = this.getBatchKey(marketId, customerBatchIndex);
    const batch = await this.redisClient.get(batchKey);
    return JSON.parse(batch);
  }
}

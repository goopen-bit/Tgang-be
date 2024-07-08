import { InjectRedis } from "@goopen/nestjs-ioredis-provider";
import { Injectable, Logger } from "@nestjs/common";
import Redis from "ioredis";
import { MarketService } from "../market/market.service";
import { Market } from "../market/market.schema";
import { CustomerBatchDto } from "./dto/customer-batch.dto";
import { fromUnixTime, getUnixTime, startOfMinute } from "date-fns";
import { CUSTOMER_BATCH_SIZE } from "./customer.const";

@Injectable()
export class CustomerService {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    @InjectRedis() private readonly redisClient: Redis,
    private marketService: MarketService
  ) {}

  getIndexFromTimeStamp(timestamp: Date) {
    const roundedTimestamp = startOfMinute(timestamp);
    return getUnixTime(roundedTimestamp) / 60;
  }

  getTimeStampFromIndex(index: number) {
    return fromUnixTime(index * 60);
  }

  getBatchIndexKey(marketId: string) {
    return `customers:${marketId}:batchIndex`;
  }

  getBatchKey(marketId: string, batchIndex: number) {
    return `customers:${marketId}:${batchIndex}`;
  }

  async generateCustomers(market: Market, index: number) {
    const customers = [];
    for (let i = 0; i < CUSTOMER_BATCH_SIZE; i++) {
      customers.push({
        product: market.products[Math.floor(Math.random() * market.products.length)].name,
        quantity: Math.floor(Math.random() * 3) + 1,
        customerIndex: index * CUSTOMER_BATCH_SIZE + i,
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
    const lastBatchIndexTimestamp = this.getTimeStampFromIndex(index);
    // If last batch index is older than one hour, start from the current time
    if (getUnixTime(lastBatchIndexTimestamp) < getUnixTime(new Date()) - 3600) {
      index = this.getIndexFromTimeStamp(new Date());
    }

    while (this.getTimeStampFromIndex(index) <= targetTimestamp) {
      await this.generateCustomers(market, index);
      index++;
    }
  }

  getBatchIndexFromCustomerIndex(customerIndex: number) {
    return Math.floor(customerIndex / CUSTOMER_BATCH_SIZE);
  }

  async getCustomerBatch(
    marketId: string,
    customerBatchIndex: number
  ): Promise<CustomerBatchDto[]> {
    // Don't return batches older or newer than one hour
    const batchTimestamp = this.getTimeStampFromIndex(customerBatchIndex);
    if (
      getUnixTime(batchTimestamp) < getUnixTime(new Date()) - 3600 ||
      getUnixTime(batchTimestamp) > getUnixTime(new Date()) + 3600
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

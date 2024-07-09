import { HttpException, Injectable, Logger } from "@nestjs/common";
import { UserService } from "../user/user.service";
import { BuyProductDto } from "./dto/buy-product.dto";
import { MarketService } from "../market/market.service";
import { CustomerService } from "../customer/customer.service";
import { getUnixTime } from "date-fns";

@Injectable()
export class ProductService {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    private userService: UserService,
    private marketService: MarketService,
    private customerService: CustomerService
  ) {}

  async buyProduct(userId: number, marketId: string, params: BuyProductDto) {
    const { product, quantity } = params;
    const user = await this.userService.findOne(userId);
    const market = await this.marketService.getMarketWithReputation(
      marketId,
      userId
    );
    if (!user || !market) {
      throw new HttpException("User or market not found", 404);
    }

    const marketProduct = market.products.find((p) => p.name === product);
    if (user.cashAmount < marketProduct.price * quantity) {
      throw new HttpException("Not enough cash", 400);
    }

    if (user.carryAmount + quantity > user.carryCapacity) {
      throw new HttpException("Not enough carry capacity", 400);
    }

    const userProduct = user.products.find((p) => p.name === product);
    if (userProduct && userProduct.unlocked) {
      user.cashAmount -= marketProduct.price * quantity;
      userProduct.quantity += quantity;
    } else {
      throw new HttpException("Product not unlocked", 400);
    }
    await user.save();
    return user;
  }

  async validateUserDeals(userId: number, marketId: string, deals: number[]) {
    const user = await this.userService.findOne(userId);
    const market = await this.marketService.getMarket(marketId);

    let batchIndex: number;
    let customerBatch;

    for (const deal of deals) {
      const currentBatchIndex =
        this.customerService.getBatchIndexFromCustomerIndex(deal);
      const customerBatchTimestamp =
        this.customerService.getTimeStampFromIndex(currentBatchIndex);
      // If the deal is olden than one hour or newer than one hour, continue
      if (
        getUnixTime(customerBatchTimestamp) < getUnixTime(new Date()) - 3600 ||
        getUnixTime(customerBatchTimestamp) > getUnixTime(new Date()) + 3600
      ) {
        continue;
      }

      if (!customerBatch || batchIndex !== currentBatchIndex) {
        const batchIndex =
          this.customerService.getBatchIndexFromCustomerIndex(deal);
        customerBatch = await this.customerService.getCustomerBatch(
          marketId,
          batchIndex,
          user.id
        );
      }

      // If the deal is not found in the batch, continue
      const customer = customerBatch.find((c) => c.customerIndex === deal);
      if (!customer) {
        continue;
      }

      // If the user doesn't have the product or the product is not unlocked, continue
      const userProduct = user.products.find(
        (p) => p.name === customer.product
      );
      if (!userProduct || !userProduct.unlocked) {
        continue;
      }

      // If the user doesn't have enough quantity, continue
      if (userProduct.quantity < customer.quantity) {
        continue;
      }

      this.logger.debug(`User ${userId} has a deal with customer ${deal}`);
      const marketPrice = market.products.find(
        (p) => p.name === customer.product
      ).price;
      userProduct.quantity -= customer.quantity;
      const amount = marketPrice * customer.quantity;
      user.cashAmount += amount;
    }

    await user.save();
    return user;
  }
}

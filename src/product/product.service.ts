import { HttpException, Injectable } from "@nestjs/common";
import { UserService } from "../user/user.service";
import { BuyProductDto } from "./dto/buy-product.dto";
import { MarketService } from "../market/market.service";
import { CustomerService } from "../customer/customer.service";
import { CustomerBatchDto } from "../customer/dto/customer-batch.dto";

@Injectable()
export class ProductService {
  constructor(
    private userService: UserService,
    private marketService: MarketService,
    private customerService: CustomerService
  ) {}

  async buyProduct(userId: number, marketId: string, params: BuyProductDto) {
    const { product, quantity } = params;
    const user = await this.userService.findOne(userId);
    const market = await this.marketService.getMarket(marketId);
    if (!user || !market) {
      throw new HttpException("User or market not found", 404);
    }

    const marketProduct = market.products.find((p) => p.name === product);
    if (user.cashAmount < marketProduct.price * quantity) {
      throw new HttpException("Not enough cash", 400);
    }

    const carry = this.userService.getCarryAmountAndCapacity(user);
    if (carry.carryAmount + quantity > carry.carryCapacity) {
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

  async validateUserDeals(
    userId: number,
    marketId: string,
    deals: CustomerBatchDto[]
  ) {
    const user = await this.userService.findOne(userId);

    let batchIndex: number;
    let customerBatch;

    for (const deal of deals) {
      const currentBatchIndex = this.customerService.getBatchIndexFromCustomerIndex(deal.customerIndex);
      const customerBatchTimestamp = this.customerService.getTimeStampFromIndex(currentBatchIndex);
      // If the deal is olden than one hour or newer than one hour, continue
      if (
        customerBatchTimestamp.getTime() < new Date().getTime() - 3600000 ||
        customerBatchTimestamp.getTime() > new Date().getTime() + 3600000
      ) {
        continue;
      }

      if (!customerBatch || batchIndex !== currentBatchIndex) {
        const batchIndex = this.customerService.getBatchIndexFromCustomerIndex(deal.customerIndex);
        customerBatch = await this.customerService.getCustomerBatch(marketId, batchIndex);
      }

      const customer = customerBatch.find((c) => c.product === deal.product);
      if (!customer) {
        continue;
      }

      if (customer.quantity < deal.quantity) {
        deal.quantity = customer.quantity;
      }

      const userProduct = user.products.find((p) => p.name === deal.product);
      if (userProduct.quantity < deal.quantity) {
        deal.quantity = userProduct.quantity;
      }

      userProduct.quantity -= deal.quantity;
      user.cashAmount += customer.price * deal.quantity;
    }

    await user.save();
    return user;
  }
}

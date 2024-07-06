import { HttpException, Injectable } from "@nestjs/common";
import { UserService } from "../user/user.service";
import { Market } from "./market.schema";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { BuyProductDto } from "../product/dto/buy-product.dto";

@Injectable()
export class MarketService {
  constructor(
    @InjectModel(Market.name)
    private marketModel: Model<Market>,

    private userService: UserService
  ) {}

  async getMarket(id: string) {
    return this.marketModel.findOne({ id });
  }

  async buyProduct(userId: number, marketId: string, params: BuyProductDto) {
    const { product, quantity } = params;
    const user = await this.userService.findOne(userId);
    const market = await this.getMarket(marketId);
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
    return userProduct;
  }
}

import { HttpException, Injectable, Logger } from "@nestjs/common";
import { UserService } from "../user/user.service";
import { BuyProductDto } from "./dto/buy-product.dto";
import { MarketService } from "../market/market.service";
import { getUnixTime } from "date-fns";
import { SellProductDto } from "./dto/sell-product.dto";

@Injectable()
export class ProductService {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    private userService: UserService,
    private marketService: MarketService
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

  async sellProduct(
    userId: number,
    marketId: string,
    sellList: SellProductDto
  ) {
    const user = await this.userService.findOne(userId);
    const market = await this.marketService.getMarket(marketId);
    if (!user) {
      throw new HttpException("User not found", 404);
    }

    sellList.batch.forEach((item) => {
      const product = user.products.find((p) => p.name === item.product);

      if (!product) {
        // @note if a batch fail here should we update a cheating indicator in the user object ?
        throw new HttpException(`Product ${item.product} not found`, 404);
      }

      if (product.quantity < item.amountToSell) {
        // @note if a batch fail here should we update a cheating indicator in the user object ?
        throw new HttpException(
          `Insufficient quantity of ${item.product}`,
          400
        );
      }

      product.quantity -= item.amountToSell;
      const marketPrice = market.products.find(
        (p) => p.name === item.product
      ).price;

      user.cashAmount += marketPrice * item.amountToSell;
    });

    await user.save();
    return user;
  }
}

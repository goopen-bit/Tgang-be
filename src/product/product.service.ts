import { HttpException, Injectable } from "@nestjs/common";
import { UserService } from "../user/user.service";
import { BuyProductDto } from "./dto/buy-product.dto";
import { MarketService } from "../market/market.service";
import { CustomerService } from "../customer/customer.service";
import { SellProductDto } from "./dto/sell-product.dto";

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

  async sellProduct(userId: number, marketId: string, params: SellProductDto) {
    const { name, product } = params;
    const customers = await this.customerService.findOneOrCreate(
      userId,
      marketId
    );
    const customer = customers.find((c) => c.name === name);
    if (!customer) {
      throw new HttpException("Customer not found", 404);
    }

    const user = await this.userService.findOne(userId);
    const userProduct = user.products.find((p) => p.name === product);

    if (!userProduct) {
      throw new HttpException("User does not own this product", 400);
    }

    if (userProduct.quantity < params.quantity) {
      params.quantity = userProduct.quantity;
    }

    if (customer.quantity < params.quantity) {
      params.quantity = customer.quantity;
    }

    userProduct.quantity -= params.quantity;
    user.cashAmount += customer.price * params.quantity;
    await this.customerService.updateQuantity(
      userId,
      marketId,
      name,
      customer.quantity - params.quantity
    );
    await user.save();
    return userProduct;
  }
}

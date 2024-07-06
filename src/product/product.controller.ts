import { Body, Controller, Param, Post } from "@nestjs/common";
import { ProductService } from "./product.service";
import { Auth } from "../decorators/auth.decorator";
import { AuthTokenData } from "../config/types";
import { GetAuthToken } from "../decorators/get-auth-token.decorator";
import { BuyProductDto } from "./dto/buy-product.dto";
import { CustomerBatchDto } from "src/customer/dto/customer-batch.dto";

@Auth()
@Controller("products")
export class ProductController {
  constructor(private productService: ProductService) {}

  @Post(":marketId/buy")
  buy(
    @Param("marketId") id: string,
    @GetAuthToken() user: AuthTokenData,
    @Body() body: BuyProductDto
  ) {
    return this.productService.buyProduct(user.id, id, body);
  }

  @Post(":marketId/sell")
  sell(
    @Param("marketId") id: string,
    @GetAuthToken() user: AuthTokenData,
    @Body() body: CustomerBatchDto[]
  ) {
    return this.productService.validateUserDeals(user.id, id, body);
  }
}

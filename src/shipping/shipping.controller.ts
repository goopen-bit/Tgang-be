import { Body, Controller, Get, Param, Post, Put } from "@nestjs/common";
import { ShippingService } from "./shipping.service";
import { AuthTokenData } from "../config/types";
import { GetAuthToken } from "../decorators/get-auth-token.decorator";
import { Auth } from "../decorators/auth.decorator";
import { ShipProductDto } from "./dto/ship-product.dto";
import { EShippingMethod } from "./shipping.const";

@Auth()
@Controller("shipping")
export class ShippingController {
  constructor(private shippingService: ShippingService) {}

  @Get()
  getShippingMethods() {
    return this.shippingService.getShippingMethods();
  }

  @Post("/:method/buy")
  buy(
    @GetAuthToken() user: AuthTokenData,
    @Param("method") method: EShippingMethod
  ) {
    return this.shippingService.buyShippingUpgrade(user.id, method);
  }

  @Put("/:method/capacity")
  upgradeCapacity(
    @GetAuthToken() user: AuthTokenData,
    @Param("method") method: EShippingMethod
  ) {
    return this.shippingService.upgradeShippingCapacity(user.id, method);
  }

  @Put("/:method/time")
  upgradeProduction(
    @GetAuthToken() user: AuthTokenData,
    @Param("method") method: EShippingMethod
  ) {
    return this.shippingService.upgradeShippingTime(user.id, method);
  }

  @Post(":marketId/ship")
  ship(
    @Param("marketId") marketId: string,
    @GetAuthToken() user: AuthTokenData,
    @Body() body: ShipProductDto
  ) {
    return this.shippingService.shipProduct(user.id, marketId, body);
  }
}

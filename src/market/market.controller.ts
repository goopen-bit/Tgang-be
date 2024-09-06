import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Headers,
  UnauthorizedException,
} from "@nestjs/common";
import { MarketService } from "./market.service";
import { Auth } from "../decorators/auth.decorator";
import { AuthTokenData } from "../config/types";
import { GetAuthToken } from "../decorators/get-auth-token.decorator";
import { BuyProductDto } from "./dto/buy-product.dto";
import { SellProductDto } from "./dto/sell-product.dto";
import { internalApiKey } from "../config/env";

@Controller("markets")
export class MarketController {
  constructor(private marketService: MarketService) {}

  @Get("internal/:marketId")
  internalGetMarket(
    @Param("marketId") marketId: string,
    @Headers("x-api-key") apiKey: string,
  ) {
    if (apiKey !== internalApiKey) {
      throw new UnauthorizedException("Invalid API key");
    }
    return this.marketService.getMarket(marketId);
  }

  @Auth()
  @Get(":marketId/events")
  getEvents() {
    return this.marketService.getHistoricalEvents();
  }

  @Auth()
  @Get(":marketId")
  getMarket(
    @GetAuthToken() user: AuthTokenData,
    @Param("marketId") marketId: string,
  ) {
    return this.marketService.getMarketWithReputation(marketId, user.id);
  }

  @Auth()
  @Post(":marketId/buy")
  buy(
    @Param("marketId") id: string,
    @GetAuthToken() user: AuthTokenData,
    @Body() body: BuyProductDto,
  ) {
    return this.marketService.buyProduct(user.id, id, body);
  }

  @Auth()
  @Post(":marketId/sell")
  sell(
    @Param("marketId") id: string,
    @GetAuthToken() user: AuthTokenData,
    @Body() body: SellProductDto,
  ) {
    return this.marketService.sellProduct(user.id, id, body);
  }
}

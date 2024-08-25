import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { MarketService } from "./market.service";
import { Auth } from "../decorators/auth.decorator";
import { AuthTokenData } from "../config/types";
import { GetAuthToken } from "../decorators/get-auth-token.decorator";
import { BuyProductDto } from "./dto/buy-product.dto";
import { SellProductDto } from "./dto/sell-product.dto";

@Auth()
@Controller("markets")
export class MarketController {
  constructor(private marketService: MarketService) {}

  @Get(":marketId/events")
  getEvents() {
    return this.marketService.getHistoricalEvents();
  }

  @Get(":marketId")
  getMarket(
    @GetAuthToken() user: AuthTokenData,
    @Param("marketId") marketId: string
  ) {
    return this.marketService.getMarketWithReputation(marketId, user.id);
  }

  @Post(':marketId/buy')
  buy(
    @Param('marketId') id: string,
    @GetAuthToken() user: AuthTokenData,
    @Body() body: BuyProductDto,
  ) {
    return this.marketService.buyProduct(user.id, id, body);
  }

  @Post(':marketId/sell')
  sell(
    @Param('marketId') id: string,
    @GetAuthToken() user: AuthTokenData,
    @Body() body: SellProductDto,
  ) {
    return this.marketService.sellProduct(user.id, id, body);
  }
}

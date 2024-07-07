import { Controller, Get, Param } from "@nestjs/common";
import { MarketService } from "./market.service";
import { Auth } from "../decorators/auth.decorator";
import { AuthTokenData } from "../config/types";
import { GetAuthToken } from "../decorators/get-auth-token.decorator";

@Auth()
@Controller("markets")
export class MarketController {
  constructor(private marketService: MarketService) {}

  @Get(":marketId")
  getMarket(
    @GetAuthToken() user: AuthTokenData,
    @Param("marketId") marketId: string
  ) {
    return this.marketService.getMarketWithReputation(marketId, user.id);
  }
}

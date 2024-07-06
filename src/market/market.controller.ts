import { Controller, Get, Param } from '@nestjs/common';
import { MarketService } from './market.service';
import { Auth } from '../decorators/auth.decorator';

@Auth()
@Controller('markets')
export class MarketController {
  constructor(private marketService: MarketService) {}

  @Get(':marketId')
  getMarket(@Param('marketId') marketId: string) {
    return this.marketService.getMarket(marketId);
  }
}

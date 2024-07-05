import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { MarketService } from './market.service';
import { Auth } from '../decorators/auth.decorator';
import { AuthTokenData } from 'src/config/types';
import { GetAuthToken } from 'src/decorators/get-auth-token.decorator';
import { BuyProductDto } from './dto/buy-product.dto';

@Auth()
@Controller('markets')
export class MarketController {
  constructor(private marketService: MarketService) {}

  @Get(':id')
  getMarket(@Param('id') id: string) {
    return this.marketService.getMarket(id);
  }

  @Post(':id/buy')
  buy(
    @Param('id') id: string,
    @GetAuthToken() user: AuthTokenData,
    @Body() body: BuyProductDto
  ) {
    return this.marketService.buyProduct(user.id, id, body);
  }
}

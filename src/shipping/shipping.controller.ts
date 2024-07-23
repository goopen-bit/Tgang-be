import { Body, Controller, Param, Post, Put } from '@nestjs/common';
import { ShippingService } from './shipping.service';
import { AuthTokenData } from '../config/types';
import { GetAuthToken } from '../decorators/get-auth-token.decorator';
import { Auth } from '../decorators/auth.decorator';
import { ShipProductDto } from './dto/ship-product.dto';
import { EShipping } from './shipping.const';
import { IsEnum } from 'class-validator';

@Auth()
@Controller('shipping')
export class ShippingController {
  constructor(private shippingService: ShippingService) {}

  @Post('/:method/buy')
  buy(
    @GetAuthToken() user: AuthTokenData,
    @Param('method') method: EShipping
  ) {
    return this.shippingService.buyShippingUpgrade(user.id, method);
  }

  @Put('/:method/capacity')
  upgradeCapacity(
    @GetAuthToken() user: AuthTokenData,
    @Param('method') method: EShipping,
  ) {
    return this.shippingService.upgradeShippingCapacity(user.id, method);
  }

  @Put('/:method/shipping-time')
  upgradeProduction(
    @GetAuthToken() user: AuthTokenData,
    @Param('method') method: EShipping,
  ) {
    return this.shippingService.upgradeShippingTime(user.id, method);
  }

  @Post(':marketId/ship')
  ship(
    @Param('marketId') marketId: string,
    @GetAuthToken() user: AuthTokenData,
    @Body() body: ShipProductDto,
  ) {
    return this.shippingService.shipProduct(
      user.id,
      marketId,
      body
    );
  }
}

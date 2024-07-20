import { Body, Controller, Param, Post } from '@nestjs/common';
import { ShippingService } from './shipping.service';
import { AuthTokenData } from '../config/types';
import { GetAuthToken } from '../decorators/get-auth-token.decorator';
import { SellProductDto } from '../product/dto/sell-product.dto';
import { Auth } from '../decorators/auth.decorator';

@Auth()
@Controller('shipping')
export class ShippingController {
  constructor(private shippingService: ShippingService) {}

  @Post(':marketId/ship')
  ship(
    @Param('marketId') marketId: string,
    @GetAuthToken() user: AuthTokenData,
    @Body() body: SellProductDto,
  ) {
    return this.shippingService.shipProduct(
      user.id,
      marketId,
      body
    );
  }
}

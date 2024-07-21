import { Module } from '@nestjs/common';
import { ShippingService } from './shipping.service';
import { ShippingController } from './shipping.controller';
import { UserModule } from '../user/user.module';
import { MarketModule } from '../market/market.module';

@Module({
  imports: [
    UserModule,
    MarketModule,
  ],
  providers: [ShippingService],
  controllers: [ShippingController]
})
export class ShippingModule {}

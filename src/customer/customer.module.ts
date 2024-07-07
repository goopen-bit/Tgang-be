import { Module } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CustomerController } from './customer.controller';
import { UserModule } from '../user/user.module';
import { MarketModule } from '../market/market.module';

@Module({
  imports: [
    MarketModule,
  ],
  providers: [CustomerService],
  exports: [CustomerService],
  controllers: [CustomerController]
})
export class CustomerModule {}

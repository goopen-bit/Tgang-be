import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { UserModule } from '../user/user.module';
import { MarketModule } from '../market/market.module';
import { CustomerModule } from '../customer/customer.module';

@Module({
  imports: [
    UserModule,
    MarketModule,
    CustomerModule,
  ],
  providers: [ProductService],
  controllers: [ProductController],
})
export class ProductModule {}

import { Module } from "@nestjs/common";
import { ProductService } from "./product.service";
import { ProductController } from "./product.controller";
import { UserModule } from "../user/user.module";
import { MarketModule } from "../market/market.module";

@Module({
  imports: [UserModule, MarketModule],
  providers: [ProductService],
  controllers: [ProductController],
})
export class ProductModule {}

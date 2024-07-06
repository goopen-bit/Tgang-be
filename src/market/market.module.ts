import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MarketService } from './market.service';
import { MarketController } from './market.controller';
import { Market, MarketSchema } from './market.schema';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Market.name, schema: MarketSchema },
    ]),
    UserModule,
  ],
  providers: [MarketService],
  exports: [MarketService],
  controllers: [MarketController],
})
export class MarketModule {}

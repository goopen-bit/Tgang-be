import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MarketService } from './market.service';
import { MarketController } from './market.controller';
import { UserModule } from '../user/user.module';

@Module({
  imports: [UserModule],
  providers: [MarketService],
  exports: [MarketService],
  controllers: [MarketController],
})
export class MarketModule {}

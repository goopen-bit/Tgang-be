import { HttpException, Injectable, Logger } from '@nestjs/common';
import { SellProductDto } from '../product/dto/sell-product.dto';
import { UserService } from '../user/user.service';
import { MarketService } from '../market/market.service';
import { SHIPPING_CONTAINER_CAPACITY } from '../user/user.const';
import { EShippingUpgrade } from '../upgrade/upgrade.interface';

@Injectable()
export class ShippingService {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    private userService: UserService,
    private marketService: MarketService,
  ) {}

  async shipProduct(userId: number, marketId: string, batch: SellProductDto) {
    this.logger.debug(`User ${userId} is shipping products ${JSON.stringify(batch)}`);

    const user = await this.userService.findOne(userId);
    if (user.nextShipment > new Date()) {
      this.logger.error('You can ship products yet');
      throw new HttpException('You can ship products yet', 400);
    }

    const market = await this.marketService.getMarket(marketId);

    const containers = user.shippingUpgrades.find((s) => s.product === EShippingUpgrade.SHIPPING_CONTAINERS);
    if (!containers) {
      this.logger.error('No shipping containers');
      throw new HttpException('No shipping containers', 400);
    }
    if (containers.amount < batch.batch.length) {
      this.logger.error('Not enough shipping containers');
      throw new HttpException('Not enough shipping containers', 400);
    }

    batch.batch.forEach((b) => {
      const product = user.products.find((p) => p.name === b.product);
      if (b.amountToSell > SHIPPING_CONTAINER_CAPACITY) {
        this.logger.error('Batch size is too big');
        throw new HttpException('Batch size is too big', 400);
      }

      if (product.quantity < b.amountToSell) {
        this.logger.error(`Not enough quantity of product ${b.product}`);
        throw new HttpException(`Not enough quantity of product ${b.product}`, 400);
      }
      const marketProduct = market.products.find((p) => p.name === b.product);

      product.quantity -= b.amountToSell;
      user.cashAmount += marketProduct.price * b.amountToSell;
      user.lastShipment = new Date();
    });

    await user.save();
    return user;
  }
}

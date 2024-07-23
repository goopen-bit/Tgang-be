import { Prop, Schema } from '@nestjs/mongoose';
import { addSeconds } from 'date-fns';
import { shipping } from 'src/shipping/data/shipping';
import { EShipping } from 'src/shipping/shipping.const';
import { SHIPPING_CAPACITY_PRICE_MULTIPLIER, SHIPPING_TIME_MULTIPLIER, SHIPPING_TIME_PRICE_MULTIPLIER } from '../user.const';
import { Shipping } from 'src/shipping/shipping.interface';

@Schema({ _id: false })
export class UserShipping {
  @Prop({ required: true })
  method: EShipping;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  image: string;

  @Prop({ required: true, default: 1 })
  capacityLevel: number;

  @Prop({ required: true, default: 1 })
  shippingTimeLevel: number;

  @Prop({
    virtual: true,
    get: function () {
      const ship = shipping[this.product] as Shipping;
      return this.capacityLevel * ship.baseCapacity;
    },
  })
  capacity?: number;

  @Prop({
    virtual: true,
    get: function () {
      const ship = shipping[this.product] as Shipping;
      return Math.floor(ship.baseShippingTime * Math.pow(SHIPPING_TIME_MULTIPLIER, -this.level))
    },
  })
  shippingTime?: number;

  @Prop({
    virtual: true,
    get: function () {
      const ship = shipping[this.product] as Shipping;
      return Math.floor(
        Math.pow(this.capacityLevel + 1, SHIPPING_CAPACITY_PRICE_MULTIPLIER) * ship.baseCapacityUpgradePrice,
      );
    },
  })
  upgradeCapacityPrice?: number;

  @Prop({
    virtual: true,
    get: function () {
      const ship = shipping[this.product] as Shipping;
      return Math.floor(
        Math.pow(this.productionLevel + 1, SHIPPING_TIME_PRICE_MULTIPLIER) * ship.baseShippingTimeUpgradePrice,
      );
    },
  })
  upgradeShippingTimePrice?: number;

  @Prop()
  lastShipment?: Date;

  @Prop({
    virtual: true,
    get: function () {
      if (!this.lastShipment) {
        return new Date();
      }

      return addSeconds(this.lastShipment, this.shippingTime);
    },
  })
  nextShipment?: Date;
}

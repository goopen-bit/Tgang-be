import { Prop, Schema } from "@nestjs/mongoose";
import { addSeconds } from "date-fns";
import { shippingMethods } from "../../shipping/data/shipping";
import { EShippingMethod } from "../../shipping/shipping.const";
import {
  SHIPPING_CAPACITY_PRICE_MULTIPLIER,
  SHIPPING_TIME_MULTIPLIER,
  SHIPPING_TIME_PRICE_MULTIPLIER,
} from "../user.const";
import { ShippingMethod } from "../../shipping/shipping.interface";
import { Requirement } from "../../upgrade/upgrade.interface";
import { setUserRequirements } from "../../upgrade/upgrade.util";

@Schema({ _id: false })
export class UserShipping {
  @Prop({ required: true })
  method: EShippingMethod;

  @Prop({
    virtual: true,
    get: function () {
      const upgrade = shippingMethods[this.method];
      return upgrade.title;
    },
  })
  title?: string;

  @Prop({
    virtual: true,
    get: function () {
      const upgrade = shippingMethods[this.method];
      return upgrade.description;
    },
  })
  description?: string;

  @Prop({
    virtual: true,
    get: function () {
      const product = shippingMethods[this.method];
      return product.image;
    },
  })
  image?: string;

  @Prop({ required: true, default: 1 })
  capacityLevel: number;

  @Prop({ required: true, default: 1 })
  shippingTimeLevel: number;

  @Prop({
    virtual: true,
    get: function () {
      const ship = shippingMethods[this.method] as ShippingMethod;
      return this.capacityLevel * ship.baseCapacity;
    },
  })
  capacity?: number;

  @Prop({
    virtual: true,
    get: function () {
      const ship = shippingMethods[this.method] as ShippingMethod;
      return Math.floor(
        ship.baseShippingTime *
          Math.pow(SHIPPING_TIME_MULTIPLIER, -(this.shippingTimeLevel - 1))
      );
    },
  })
  shippingTime?: number;

  @Prop({
    virtual: true,
    get: function () {
      const ship = shippingMethods[this.method] as ShippingMethod;
      return Math.floor(
        Math.pow(this.capacityLevel + 1, SHIPPING_CAPACITY_PRICE_MULTIPLIER) *
          ship.baseCapacityUpgradePrice
      );
    },
  })
  upgradeCapacityPrice?: number;

  @Prop({
    virtual: true,
    get: function () {
      const ship = shippingMethods[this.method] as ShippingMethod;
      return (this.capacityLevel + 1) * ship.baseCapacity;
    },
  })
  upgradeCapacity?: number;

  @Prop({
    virtual: true,
    get: function () {
      const ship = shippingMethods[this.method] as ShippingMethod;
      return Math.floor(
        Math.pow(this.shippingTimeLevel + 1, SHIPPING_TIME_PRICE_MULTIPLIER) *
          ship.baseShippingTimeUpgradePrice
      );
    },
  })
  upgradeShippingTimePrice?: number;

  @Prop({
    virtual: true,
    get: function () {
      const ship = shippingMethods[this.method] as ShippingMethod;
      return Math.floor(
        ship.baseShippingTime *
          Math.pow(SHIPPING_TIME_MULTIPLIER, -(this.shippingTimeLevel))
      );
    },
  })
  upgradeShippingTime?: number;

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

  @Prop({
    type: Object,
    virtual: true,
    get: function () {
      const ship = shippingMethods[this.method] as ShippingMethod;
      return setUserRequirements(ship.requirements, this.capacityLevel);
    },
  })
  requirements?: Requirement[];
}

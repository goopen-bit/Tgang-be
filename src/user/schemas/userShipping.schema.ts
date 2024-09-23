import { Prop, Schema } from "@nestjs/mongoose";
import { addSeconds } from "date-fns";
import { shippingMethods } from "../../shipping/data/shipping";
import { EShippingMethod } from "../../shipping/shipping.const";
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
      if (this.shippingTimeLevel === 1) {
        return ship.baseShippingTime;
      }
      return Math.floor(
        ship.baseShippingTime *
          Math.pow(
            ship.shippingTimeMultiplier,
            -Math.log(this.shippingTimeLevel)
          ),
      );
    },
  })
  shippingTime?: number;

  @Prop({
    virtual: true,
    get: function () {
      const ship = shippingMethods[this.method] as ShippingMethod;
      return Math.floor(
        Math.pow(this.capacityLevel + 1, ship.capacityPriceMultiplier) *
          ship.baseCapacityUpgradePrice,
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
      // Algorithm explanation:
      // 1. Start with the base shipping time
      // 2. Multiply it by SHIPPING_TIME_MULTIPLIER raised to the power of negative log(level + 1)
      // 3. This calculates the shipping time for the next upgrade level
      // 4. The formula is similar to shippingTime, but uses (level + 1) to preview the next level
      // 5. Floor the result to get an integer value
      return Math.floor(
        ship.baseShippingTime *
          Math.pow(
            ship.shippingTimeMultiplier,
            -Math.log(this.shippingTimeLevel + 1),
          ),
      );
    },
  })
  upgradeShippingTime?: number;

  @Prop({
    virtual: true,
    get: function () {
      const ship = shippingMethods[this.method] as ShippingMethod;
      return Math.floor(
        Math.pow(this.shippingTimeLevel + 1, ship.shippingTimePriceMultiplier) *
          ship.baseShippingTimeUpgradePrice,
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

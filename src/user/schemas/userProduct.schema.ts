import { Prop, Schema } from "@nestjs/mongoose";
import { productUpgrades } from "../../upgrade/data/dealerUpgrades";
import { EProduct } from "../../market/market.const";
import { addSeconds } from "date-fns";
import { BASE_UPGRADE_TIME_SECONDS } from "../user.const";

@Schema({ _id: false })
export class UserProduct {
  @Prop({ required: true })
  name: EProduct;

  @Prop({ required: true })
  quantity: number;

  @Prop({
    virtual: true,
    get: function () {
      const upgrade = productUpgrades[this.name];
      return upgrade.title;
    },
  })
  title?: string;

  @Prop({
    virtual: true,
    get: function () {
      const upgrade = productUpgrades[this.name];
      return upgrade.description;
    },
  })
  description?: string;

  @Prop({
    virtual: true,
    get: function () {
      const product = productUpgrades[this.name];
      return product.image;
    },
  })
  image?: string;

  @Prop({ required: true })
  level: number;

  @Prop({
    virtual: true,
    get: function () {
      const upgrade = productUpgrades[this.name];
      return Math.floor(
        Math.pow(this.level + 1, upgrade.upgradeMultiplier) * upgrade.basePrice,
      );
    },
  })
  upgradePrice?: number;

  @Prop({ default: new Date(0) })
  lastUpgrade?: Date;

  @Prop({
    virtual: true,
    get: function () {
      const upgrade = productUpgrades[this.name];
      if (!upgrade.upgradeTimeMultiplier) {
        return new Date(0);
      }
      const nextUpgrade =  Math.floor(
        BASE_UPGRADE_TIME_SECONDS * Math.pow(this.level, upgrade.upgradeTimeMultiplier),
      );
      return addSeconds(this.lastUpgrade, nextUpgrade);
    },
  })
  nextUpgrade?: Date;

  @Prop({
    virtual: true,
    get: function () {
      const upgrade = productUpgrades[this.name];
      return (
        upgrade.baseDiscount +
        (60 - upgrade.baseDiscount) *
          (Math.log(this.level + 1) / Math.log(100000))
      );
    },
  })
  marketDiscount?: number;

  @Prop({
    virtual: true,
    get: function () {
      const upgrade = productUpgrades[this.name];
      return (
        upgrade.baseDiscount +
        (60 - upgrade.baseDiscount) *
          (Math.log(this.level + 2) / Math.log(100000))
      );
    },
  })
  upgradeMarketDiscount?: number;
}

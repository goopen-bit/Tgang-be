import { Prop, Schema } from '@nestjs/mongoose';
import { productUpgrades } from '../../upgrade/data/dealerUpgrades';
import { EProduct } from '../../market/market.const';

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

  @Prop({
    virtual: true,
    get: function () {
      const upgrade = productUpgrades[this.name];
      return (
        (upgrade.baseDiscount + (60 - upgrade.baseDiscount)) *
        (Math.log(this.level + 1) / Math.log(1000))
      );
    },
  })
  marketDiscount?: number;

  @Prop({
    virtual: true,
    get: function () {
      const upgrade = productUpgrades[this.name];
      return (
        (upgrade.baseDiscount + (60 - upgrade.baseDiscount)) *
        (Math.log(this.level + 2) / Math.log(1000))
      );
    },
  })
  upgradeMarketDiscount?: number;
}

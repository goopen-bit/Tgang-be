import { Prop, Schema } from '@nestjs/mongoose';
import { EProduct } from 'src/product/product.const';
import { dealerUpgrades } from 'src/upgrade/data/dealerUpgrades';
import { EDealerUpgrade } from 'src/upgrade/upgrade.interface';

@Schema({ _id: false })
export class UserUpgrade {
  @Prop({ required: true })
  id: number;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  level: number;

  @Prop({ required: true })
  maxLevel: number;

  @Prop({ required: true })
  levelPrices: number[];

  @Prop({ required: true })
  value: number[];

  @Prop({ required: true })
  image: string;

  @Prop({ required: true })
  locked: boolean;

  @Prop({ required: true })
  group: string;
}

@Schema({ _id: false })
export class UserProductUpgrade {
  @Prop({ required: true })
  product: EProduct;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  image: string;

  @Prop({ required: true })
  level: number;

  @Prop({
    virtual: true,
    get: function () {
      const upgrade = dealerUpgrades[this.product];
      return Math.floor(
        Math.pow(this.level + 1, upgrade.upgradeMultiplier) * upgrade.basePrice,
      );
    },
  })
  upgradePrice?: number;

  @Prop({
    virtual: true,
    get: function () {
      const maxLog = Math.log(10000 + 1);
      return Math.floor((Math.log(this.upgradePrice + 1) / maxLog) * 100);
    },
  })
  marketDiscount?: number;
}

@Schema({ _id: false })
export class UserDealerUpgrade {
  @Prop({ required: true })
  product: EDealerUpgrade;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  image: string;

  @Prop({ required: true })
  level: number;

  @Prop({
    virtual: true,
    get: function () {
      const upgrade = dealerUpgrades[this.product];
      return Math.floor(
        Math.pow(this.level + 1, upgrade.upgradeMultiplier) * upgrade.basePrice,
      );
    },
  })
  upgradePrice?: number;

  @Prop({
    virtual: true,
    get: function () {
      const upgrade = dealerUpgrades[this.product];
      return this.level * upgrade.value;
    },
  })
  amount?: number;
}

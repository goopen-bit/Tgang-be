import { Prop, Schema } from '@nestjs/mongoose';
import { dealerUpgrades } from '../../upgrade/data/dealerUpgrades';
import { DealerUpgrade, EDealerUpgrade } from '../../upgrade/upgrade.interface';
import { EProduct } from '../../market/market.const';

@Schema({ _id: false })
export class UserDealerUpgrade {
  @Prop({ required: true })
  upgrade: EDealerUpgrade;

  @Prop({
    virtual: true,
    get: function () {
      const upgrade = dealerUpgrades[this.upgrade];
      return upgrade.product;
    },
  })
  product?: EProduct;

  @Prop({
    virtual: true,
    get: function () {
      const upgrade = dealerUpgrades[this.upgrade];
      return upgrade.title;
    },
  })
  title?: string;

  @Prop({
    virtual: true,
    get: function () {
      const upgrade = dealerUpgrades[this.upgrade];
      return upgrade.description;
    },
  })
  description?: string;

  @Prop({
    virtual: true,
    get: function () {
      const upgrade = dealerUpgrades[this.upgrade];
      return upgrade.image;
    },
  })
  image?: string;

  @Prop({ required: true })
  level: number;

  @Prop({
    virtual: true,
    get: function () {
      const upgrade = dealerUpgrades[this.upgrade] as DealerUpgrade;;
      return Math.floor(
        Math.pow(this.level + 1, upgrade.upgradeMultiplier) * upgrade.basePrice,
      );
    },
  })
  upgradePrice?: number;

  @Prop({
    virtual: true,
    get: function () {
      const upgrade = dealerUpgrades[this.upgrade] as DealerUpgrade;
      return  this.level * upgrade.amountMultiplier;
    },
  })
  amount?: number;

  @Prop({
    virtual: true,
    get: function () {
      const upgrade = dealerUpgrades[this.upgrade] as DealerUpgrade;
      return  (this.level + 1) * upgrade.amountMultiplier;
    },
  })
  upgradeAmount?: number;
}

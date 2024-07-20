import { Prop, Schema } from '@nestjs/mongoose';
import { shippingUpgrades } from '../../upgrade/data/shippingUpgrades';
import { EShippingUpgrade } from '../../upgrade/upgrade.interface';

@Schema({ _id: false })
export class UserShippingUpgrade {
  @Prop({ required: true })
  product: EShippingUpgrade;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  image: string;

  @Prop({ required: true })
  level: number;

  @Prop({
    virtual: true,
    get: function () {
      const upgrade = shippingUpgrades[this.product];
      return Math.floor(
        Math.pow(this.level + 1, upgrade.upgradeMultiplier) * upgrade.basePrice,
      );
    },
  })
  upgradePrice?: number;

  @Prop({
    virtual: true,
    get: function () {
      const upgrade = shippingUpgrades[this.product];
      if (this.product === EShippingUpgrade.SHIPPING_TIME) {
        return Math.floor(upgrade.baseAmount * Math.pow(upgrade.amountMultiplier, -this.level));
      } else {
        return Math.floor(upgrade.baseAmount + this.level * upgrade.amountMultiplier - 1);
      };
    },
  })
  amount?: number;
}

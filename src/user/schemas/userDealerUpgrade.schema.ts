import { Prop, Schema } from '@nestjs/mongoose';
import { dealerUpgrades } from '../../upgrade/data/dealerUpgrades';
import { EDealerUpgrade } from '../../upgrade/upgrade.interface';

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
      return upgrade.baseAmount + this.level * upgrade.amountMultiplier;
    },
  })
  amount?: number;
}

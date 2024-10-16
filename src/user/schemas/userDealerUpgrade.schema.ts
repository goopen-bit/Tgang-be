import { Prop, Schema } from '@nestjs/mongoose';
import { dealerUpgrades } from '../../upgrade/data/dealerUpgrades';
import { DealerUpgrade, EDealerUpgrade, Requirement } from '../../upgrade/upgrade.interface';
import { EProduct } from '../../market/market.const';
import { setUserRequirements } from '../../upgrade/upgrade.util';
import { BASE_UPGRADE_TIME_SECONDS } from '../user.const';
import { addSeconds } from 'date-fns';

@Schema({
  _id: false,
  toObject: {
    getters: true,
  },
  toJSON: {
    getters: true,
  },
})
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

  @Prop({ default: new Date(0) })
  lastUpgrade?: Date;

  @Prop({
    virtual: true,
    get: function () {
      const upgrade = dealerUpgrades[this.upgrade] as DealerUpgrade;
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

  @Prop({
    type: Object,
    virtual: true,
    get: function () {
      const upgrade = dealerUpgrades[this.upgrade] as DealerUpgrade;
      return setUserRequirements(upgrade.requirements, this.level);
    },
  })
  requirements?: Requirement[];
}

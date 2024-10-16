import { Prop, Schema } from '@nestjs/mongoose';
import {
  BASE_UPGRADE_TIME_SECONDS,
  LAB_CAPACITY_MULTIPLIER,
  LAB_PRODUCTION_MULTIPLIER,
} from '../user.const';
import { EProduct } from '../../market/market.const';
import { labs } from '../../lab/data/labs';
import { addSeconds, getUnixTime } from 'date-fns';
import { Lab } from '../../lab/lab.interface';

@Schema({
  _id: false,
  toObject: {
    getters: true,
  },
  toJSON: {
    getters: true,
  },
})
export class UserLab {
  @Prop({ required: true })
  product: EProduct;

  @Prop({
    virtual: true,
    get: function () {
      const upgrade = labs[this.product];
      return upgrade.title;
    },
  })
  title?: string;

  @Prop({
    virtual: true,
    get: function () {
      const upgrade = labs[this.product];
      return upgrade.description;
    },
  })
  description?: string;

  @Prop({
    virtual: true,
    get: function () {
      const lab = labs[this.product];
      return lab.image;
    },
  })
  image?: string;

  @Prop({ required: true, default: 1 })
  capacityLevel: number;

  @Prop({ required: true, default: 1 })
  productionLevel: number;

  @Prop({ required: true, default: new Date() })
  collectTime: Date;

  @Prop({
    virtual: true,
    get: function () {
      const lab = labs[this.product];
      return this.capacityLevel * lab.baseCapacity;
    },
  })
  capacity?: number;

  @Prop({
    virtual: true,
    get: function () {
      const lab = labs[this.product];
      return this.productionLevel * lab.baseProduction;
    },
  })
  production?: number;

  @Prop({
    virtual: true,
    get: function () {
      const now = new Date();
      const diff = getUnixTime(now) - getUnixTime(this.collectTime);
      const productionPerSecond = this.production / 3600;
      const produced = Math.floor(productionPerSecond * diff);
      return produced < this.capacity ? produced : this.capacity;
    },
  })
  produced?: number;

  @Prop({
    virtual: true,
    get: function () {
      const lab = labs[this.product];
      return Math.floor(
        Math.pow(this.capacityLevel + 1, LAB_CAPACITY_MULTIPLIER) *
          lab.baseCapacityUpgradePrice,
      );
    },
  })
  upgradeCapacityPrice?: number;

  @Prop({ default: new Date(0) })
  lastCapacityUpgrade?: Date;

  @Prop({
    virtual: true,
    get: function () {
      const lab = labs[this.product] as Lab;
      if (!lab.capacityUpgradeTimeMultiplier) {
        return new Date(0);
      }
      const nextUpgrade =  Math.floor(
        BASE_UPGRADE_TIME_SECONDS * Math.pow(this.capacityLevel, lab.capacityUpgradeTimeMultiplier),
      );
      return addSeconds(this.lastCapacityUpgrade, nextUpgrade);
    },
  })
  nextCapacityUpgrade?: Date;

  @Prop({
    virtual: true,
    get: function () {
      const lab = labs[this.product];
      return (this.capacityLevel + 1) * lab.baseCapacity;
    },
  })
  upgradeCapacity?: number;

  @Prop({
    virtual: true,
    get: function () {
      const lab = labs[this.product];
      return Math.floor(
        Math.pow(this.productionLevel + 1, LAB_PRODUCTION_MULTIPLIER) *
          lab.baseProductionUpgradePrice,
      );
    },
  })
  upgradeProductionPrice?: number;

  @Prop({ default: new Date(0) })
  lastProductionUpgrade?: Date;

  @Prop({
    virtual: true,
    get: function () {
      const lab = labs[this.product] as Lab;
      if (!lab.productionUpgradeTimeMultiplier) {
        return new Date(0);
      }
      const nextUpgrade =  Math.floor(
        BASE_UPGRADE_TIME_SECONDS * Math.pow(this.productionLevel, lab.productionUpgradeTimeMultiplier),
      );
      return addSeconds(this.lastProductionUpgrade, nextUpgrade);
    },
  })
  nextProductionUpgrade?: Date;

  @Prop({
    virtual: true,
    get: function () {
      const lab = labs[this.product];
      return (this.productionLevel + 1) * lab.baseProduction;
    },
  })
  upgradeProduction?: number;
}

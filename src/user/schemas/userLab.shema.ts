import { Prop, Schema } from '@nestjs/mongoose';
import {
  LAB_CAPACITY_MULTIPLIER,
  LAB_PRODUCTION_MULTIPLIER,
} from '../user.const';
import { EProduct } from '../../product/product.const';
import { labs } from '../../lab/data/labs';
import { getUnixTime } from 'date-fns';

@Schema({ _id: false })
export class UserLab {
  @Prop({ required: true })
  product: EProduct;

  @Prop({ required: true })
  title: string;

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
}

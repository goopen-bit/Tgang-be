import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { Product } from "../../product/product.schema";
import {
  BASE_LAB_PLOT_PRICE,
  LAB_CAPACITY_MULTIPLIER,
  LAB_PLOT_PRICE_MULTIPLIER,
  LAB_PRODUCTION_MULTIPLIER,
} from "../user.const";
import { EProduct } from "../../product/product.const";
import { labs } from "../../lab/data/labs";
import { getUnixTime } from "date-fns";
import { UserUpgrade } from "./userUpgrade.schema";
import { EDealerUpgrade } from "../../upgrade/data/dealerUpgrades";

@Schema({ _id: false })
export class UserProduct extends Product {
  @Prop({ required: true })
  quantity: number;

  @Prop({ required: true, default: false })
  unlocked: boolean;
}

@Schema({ _id: false })
export class UserLab {
  @Prop({ required: true })
  product: EProduct;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  image: string;

  @Prop({ required: true, default: 1 })
  capacityLevel: number;

  @Prop({ required: true, default: 1 })
  productionLevel: number;

  @Prop({ required: true, default: new Date() })
  collectTime: Date;

  @Prop({ required: true, default: 0 })
  leftover: number;

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
      const produced = Math.floor(productionPerSecond * diff + this.leftover);
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
          lab.baseCapacityUpgradePrice
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
          lab.baseProductionUpgradePrice
      );
    },
  })
  upgradeProductionPrice?: number;
}

@Schema({ _id: false })
export class LabPlot {
  @Prop({ required: true })
  plotId: number;

  @Prop({ type: UserLab, required: false })
  lab?: UserLab;
}

@Schema({
  toObject: {
    getters: true,
  },
  toJSON: {
    getters: true,
  },
})
export class User extends Document {
  @Prop({ required: true, unique: true })
  id: number;

  @Prop({ required: true })
  username: string;

  @Prop({ required: true })
  reputation: number;

  @Prop({ required: true })
  cashAmount: number;

  @Prop({ type: [UserProduct], default: [] })
  products: UserProduct[];

  @Prop({ type: [UserUpgrade], default: [] })
  upgrades: UserUpgrade[];

  // @Prop({ type: [EProduct], required: true })
  // unlockedLabs: EProduct[];

  @Prop({ type: [LabPlot], default: [{ plotId: 0 }] })
  labPlots: LabPlot[];

  @Prop({
    virtual: true,
    get: function () {
      return Math.floor(
        Math.pow(this.labPlots.length + 1, LAB_PLOT_PRICE_MULTIPLIER) *
          BASE_LAB_PLOT_PRICE
      );
    },
  })
  labPlotPrice: number;

  @Prop({ required: true, default: new Date() })
  lastSell: Date;

  @Prop({
    virtual: true,
    get: function () {
      const now = new Date();
      const diff = getUnixTime(now) - getUnixTime(this.lastSell);
      const customerAmountUpgrade = this.upgrades.find(
        (e) => e.id === EDealerUpgrade.CUSTOMER_AMOUNT
      );
      const currentCustomerAmount =
        customerAmountUpgrade.value[customerAmountUpgrade.level];
      if (diff > 3600000) {
        return currentCustomerAmount;
      }
      return currentCustomerAmount / diff;
    },
  })
  customerAmount?: number;

  @Prop({ required: true, default: 0 })
  amountOfSells: number;

  @Prop({
    virtual: true,
    get: function () {
      return Buffer.from(this.id.toString()).toString("base64");
    },
  })
  referralToken: string;

  @Prop()
  referredBy?: string;

  @Prop({ type: [String], default: [] })
  referredUsers: string[];
}

export const UserSchema = SchemaFactory.createForClass(User);

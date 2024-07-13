import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { Product } from "../product/product.schema";
import { BASE_LAB_PLOT_PRICE, CARRYING_CAPACITY, LAB_CAPACITY_MULTIPLIER, LAB_PLOT_PRICE_MULTIPLIER, LAB_PRODUCTION_MULTIPLIER } from "./user.const";
import { EProduct } from "../product/product.const";
import { labs } from "../lab/data/labs";

@Schema({ _id: false })
class UserUpgrade {
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
class CarryingGear {
  @Prop()
  id: number;

  @Prop()
  title: string;

  @Prop()
  capacity: number;
}

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

  @Prop({ required: true })
  capacityLevel: number;

  @Prop({ required: true })
  productionLevel: number;

  @Prop({
    virtual: true,
    get: function () {
      const lab = labs[this.product];
      return  this.capacityLevel * lab.baseCapacity;
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
      const lab = labs[this.product];
      return Math.floor(Math.pow(this.capacityLevel + 1, LAB_CAPACITY_MULTIPLIER) * lab.baseCapacityUpgradePrice);
    },
  })
  upgradeCapacityPrice?: number;

  @Prop({
    virtual: true,
    get: function () {
      const lab = labs[this.product];
      return Math.floor(Math.pow(this.productionLevel + 1, LAB_PRODUCTION_MULTIPLIER) * lab.baseProductionUpgradePrice);
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

  @Prop({ type: [CarryingGear] })
  carryingGear: CarryingGear[];

  @Prop({ type: [LabPlot], default: [] })
  labPlots: LabPlot[];

  @Prop({
    virtual: true,
    get: function () {
      let capacity = CARRYING_CAPACITY;
      this.carryingGear.forEach((gear) => {
        capacity += gear.capacity;
      });
      return capacity;
    },
  })
  carryCapacity: number;

  @Prop({
    virtual: true,
    get: function () {
      let amount = 0;
      this.products.forEach((product) => {
        amount += product.quantity;
      });
      return amount;
    },
  })
  carryAmount: number;

  @Prop({
    virtual: true,
    get: function () {
      return Math.floor(Math.pow(this.labPlots.length + 1, LAB_PLOT_PRICE_MULTIPLIER) * BASE_LAB_PLOT_PRICE);
    },
  })
  labPlotPrice: number;

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

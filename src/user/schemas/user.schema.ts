import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { Product } from "../../product/product.schema";
import { BASE_LAB_PLOT_PRICE, LAB_PLOT_PRICE_MULTIPLIER } from "../user.const";
import { getUnixTime } from "date-fns";
import { UserUpgrade } from "./userUpgrade.schema";
import { EDealerUpgrade } from "../../upgrade/data/dealerUpgrades";
import { UserLab } from "./userLab.shema";

@Schema({ _id: false })
export class UserProduct extends Product {
  @Prop({ required: true })
  quantity: number;

  @Prop({ required: true, default: false })
  unlocked: boolean;
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

  @Prop({ required: true, default: () => new Date().toISOString() })
  lastSell: Date;

  @Prop({
    virtual: true,
    get: function () {
      const now = new Date();
      const diff = getUnixTime(now) - getUnixTime(new Date(this.lastSell));
      const customerAmountUpgrade = this.upgrades.find(
        (e) => e.id === EDealerUpgrade.CUSTOMER_AMOUNT
      );

      if (!customerAmountUpgrade) {
        return 0;
      }

      const customerAmountMax =
        customerAmountUpgrade.value[customerAmountUpgrade.level];

      if (diff > 3600) {
        return Math.floor(customerAmountMax);
      }

      const newCustomers = Math.floor((diff / 3600) * customerAmountMax);
      return Math.min(
        this.customerAmountRemaining + newCustomers,
        customerAmountMax
      );
    },
  })
  customerAmount?: number;

  @Prop({ required: true, default: 0 })
  customerAmountRemaining: number;

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

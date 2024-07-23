import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { BASE_LAB_PLOT_PRICE, LAB_PLOT_PRICE_MULTIPLIER } from "../user.const";
import { getUnixTime } from "date-fns";
import { UserDealerUpgrade } from "./userDealerUpgrade.schema";
import { UserLab } from "./userLab.shema";
import {
  EDealerUpgrade,
} from "../../upgrade/upgrade.interface";
import { UserProduct } from "./userProduct.schema";
import { UserShipping } from "./userShipping.schema";
import { reputationLevels } from "../data/reputationLevel";
import { IReputationLevel } from "../user.interface";

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

  @Prop({
    type: Object,
    virtual: true,
    get: function (this: User) {
      return reputationLevels.find(
        (level) =>
          this.reputation >= level.minReputation &&
          this.reputation <= level.maxReputation
      );
    },
  })
  userLevel: IReputationLevel;

  @Prop({ required: true })
  cashAmount: number;

  @Prop({ type: [UserProduct], default: [] })
  products: UserProduct[];

  @Prop({ type: [UserDealerUpgrade], default: [] })
  dealerUpgrades: UserDealerUpgrade[];

  @Prop({ type: [UserShipping], default: [] })
  shipping: UserShipping[];

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
      const diff = getUnixTime(now) - getUnixTime(new Date(this.lastSell));
      const customerAmountUpgrade = this.dealerUpgrades.find(
        (u) => u.product === EDealerUpgrade.CUSTOMER_AMOUNT
      );
      const customerAmountMax = customerAmountUpgrade.amount;

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

  @Prop({ required: true, default: 0 })
  robberyStrike: number;

  @Prop()
  lastRobbery?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

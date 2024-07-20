import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { BASE_LAB_PLOT_PRICE, LAB_PLOT_PRICE_MULTIPLIER } from "../user.const";
import { addSeconds, getUnixTime } from "date-fns";
import { UserDealerUpgrade } from "./userDealerUpgrade.schema";
import { UserLab } from "./userLab.shema";
import { EDealerUpgrade, EShippingUpgrade } from "../../upgrade/upgrade.interface";
import { UserProduct } from "./userProduct.schema";
import { UserShippingUpgrade } from "./userShippingUpgrade.schema";
import { shippingUpgrades } from "src/upgrade/data/shippingUpgrades";

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

  @Prop({ type: [UserDealerUpgrade], default: [] })
  dealerUpgrades: UserDealerUpgrade[];

  @Prop({ type: [UserShippingUpgrade], default: [] })
  shippingUpgrades: UserShippingUpgrade[];

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

  @Prop()
  lastShipment?: Date;

  @Prop({
    virtual: true,
    get: function () {
      if (!this.lastShipment) {
        return new Date();
      }

      const shippingDelayUpgrade = this.shippingUpgrades.find(
        (u) => u.product === EShippingUpgrade.SHIPPING_TIME
      );
      let shippingDelay = shippingDelayUpgrade.amount;
      if (!shippingDelayUpgrade) {
        shippingDelay = shippingUpgrades[EShippingUpgrade.SHIPPING_TIME];
      }
      
      return addSeconds(this.lastShipment, shippingDelay);
    },
  })
  nextShipment?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

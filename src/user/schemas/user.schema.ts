import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { BASE_CUSTOMER_LIMIT, BASE_CUSTOMER_NEEDS, BASE_LAB_PLOT_PRICE, LAB_PLOT_PRICE_MULTIPLIER } from "../user.const";
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
import { dealerUpgrades } from "src/upgrade/data/dealerUpgrades";

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

  @Prop({
    type: [UserDealerUpgrade],
    default: [],
    set: function (upgrades: UserDealerUpgrade[]) {
      return Object.entries(dealerUpgrades).map(([key, du]) => {
        const userUpgrade = upgrades.find((u) => u.product === key);
        return userUpgrade || {
          product: key,
          title: du.title,
          image: du.image,
          level: 0,
          upgradePrice: du.basePrice,
          amount: 0,
        };
      });
    },
  })
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
      const productQuality = this.dealerUpgrades.find(
        (u) => u.product === EDealerUpgrade.PRODUCT_QUALITY
      );
      const luxuryPackaging = this.dealerUpgrades.find(
        (u) => u.product === EDealerUpgrade.LUXURY_PACKAGING
      );
      const highValueCustomers = this.dealerUpgrades.find(
        (u) => u.product === EDealerUpgrade.HIGH_VALUE_CUSTOMERS
      );

      const customerAmountMax = BASE_CUSTOMER_NEEDS +
        (productQuality?.amount || 0) +
        (luxuryPackaging?.amount || 0) +
        (highValueCustomers?.amount || 0);

      const newCustomers = Math.floor((diff / 3600) * customerAmountMax);
      return Math.min(
        this.customerAmountRemaining + newCustomers,
        customerAmountMax
      );
    },
  })
  customerNeeds?: number;

  @Prop({
    virtual: true,
    get: function () {
      const now = new Date();
      const diff = getUnixTime(now) - getUnixTime(new Date(this.lastSell));
      const socialMediaCampaign = this.dealerUpgrades.find(
        (u) => u.product === EDealerUpgrade.SOCIAL_MEDIA_CAMPAGIN
      );
      const streetPromotionTeam = this.dealerUpgrades.find(
        (u) => u.product === EDealerUpgrade.STREET_PROMOTION_TEAM
      );
      const clubPartnership = this.dealerUpgrades.find(
        (u) => u.product === EDealerUpgrade.CLUB_PARTNERSHIP
      );

      const customerAmountMax = BASE_CUSTOMER_LIMIT +
        (socialMediaCampaign?.amount || 0) +
        (streetPromotionTeam?.amount || 0) +
        (clubPartnership?.amount || 0);

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

import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { User, UserProduct } from "./schemas/user.schema";
import { AuthTokenData } from "../config/types";
import { EProduct } from "../product/product.const";
import { REFERRAL_CASH, STARTING_CASH } from "./user.const";
import { upgradesData } from "../upgrade/data/upgrades";
import { EUpgradeCategory } from "../upgrade/upgrade.interface";
import { EDealerUpgrade } from "src/upgrade/data/dealerUpgrades";
//import { subHour } from "date-fns";

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<User>
  ) {}

  private getIdFromReferralToken(referralToken: string) {
    return Buffer.from(referralToken, "base64").toString("utf-8");
  }

  async findOneOrCreate(user: AuthTokenData, referralToken?: string) {
    const existingUser = await this.userModel.findOne({ id: user.id });
    if (existingUser) {
      return existingUser;
    }

    let referrer: User;
    if (referralToken) {
      referrer = await this.findByReferralToken(referralToken);
      if (referrer) {
        referrer.cashAmount += REFERRAL_CASH;
        referrer.referredUsers.push(user.username);
        await referrer.save();
      }
    }

    const dealerUpgrades = upgradesData.find(
      (e) => e.category === EUpgradeCategory.DEALER
    );
    const weed = dealerUpgrades.upgrades.find(
      (u) => u.id === EDealerUpgrade.WEED
    );
    const customerAmount = dealerUpgrades.upgrades.find(
      (u) => u.id === EDealerUpgrade.CUSTOMER_AMOUNT
    );
    const customerNeeds = dealerUpgrades.upgrades.find(
      (u) => u.id === EDealerUpgrade.CUSTOMER_NEEDS
    );

    // Set lastSell to one hour ago to get the full amount of customer when starting the game
    // const lastSell = subHours(new Date(), 1).toISOString();

    return this.userModel.create({
      ...user,
      cashAmount: referrer?.username
        ? STARTING_CASH + REFERRAL_CASH
        : STARTING_CASH,
      reputation: 1,
      products: [
        this.initUserProduct({
          name: EProduct.WEED,
          quantity: 0,
          unlocked: true,
        }),
      ],
      upgrades: [weed, customerAmount, customerNeeds],
      referredBy: referrer?.username,
      // lastSell,
    });
  }

  async findByReferralToken(referralToken: string) {
    const id = this.getIdFromReferralToken(referralToken);
    return this.userModel.findOne({ id });
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userModel.findOne({ id }).exec();
    if (!user) {
      throw new NotFoundException("User not found");
    }
    return user;
  }

  async update(userId: number, updateData: Partial<User>): Promise<User> {
    const user = await this.userModel
      .findOneAndUpdate({ id: userId }, { $set: updateData }, { new: true })
      .exec();
    if (!user) {
      throw new NotFoundException("User not found");
    }
    return user;
  }

  async delete(id: number): Promise<void> {
    const result = await this.userModel.deleteOne({ id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException("User not found");
    }
  }

  initUserProduct(productData: UserProduct) {
    const product = new UserProduct();
    product.unlocked = productData.unlocked;
    product.name = productData.name;
    product.quantity = productData.quantity;
    return product;
  }
}

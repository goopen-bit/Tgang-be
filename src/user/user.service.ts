import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './schemas/user.schema';
import { AuthTokenData } from '../config/types';
import { EProduct } from '../product/product.const';
import { REFERRAL_CASH, STARTING_CASH } from './user.const';
import { upgradesData } from '../upgrade/data/upgrades';
import { EDealerUpgrade } from '../upgrade/upgrade.interface';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<User>,
  ) {}

  private getIdFromReferralToken(referralToken: string) {
    return Buffer.from(referralToken, 'base64').toString('utf-8');
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

    const weed = upgradesData.product[EProduct.WEED];
    const customerAmount = upgradesData.dealer[EDealerUpgrade.CUSTOMER_AMOUNT];
    const customerNeeds = upgradesData.dealer[EDealerUpgrade.CUSTOMER_NEEDS];

    // Set lastSell to one hour ago to get the full amount of customer when starting the game
    // const lastSell = subHours(new Date(), 1).toISOString();

    return this.userModel.create({
      ...user,
      cashAmount: referrer?.username
        ? STARTING_CASH + REFERRAL_CASH
        : STARTING_CASH,
      reputation: 1,
      products: [
        {
          name: EProduct.WEED,
          quantity: 0,
          title: weed.title,
          image: weed.image,
          level: 1,
        },
      ],
      dealerUpgrades: [
        {
          product: EDealerUpgrade.CUSTOMER_AMOUNT,
          title: customerAmount.title,
          image: customerAmount.image,
          level: 0,
        },
        {
          product: EDealerUpgrade.CUSTOMER_NEEDS,
          title: customerNeeds.title,
          image: customerNeeds.image,
          level: 0,
        },
      ],
      referredBy: referrer?.username,
    });
  }

  async findByReferralToken(referralToken: string) {
    const id = this.getIdFromReferralToken(referralToken);
    return this.userModel.findOne({ id });
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userModel.findOne({ id }).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async update(userId: number, updateData: Partial<User>): Promise<User> {
    const user = await this.userModel
      .findOneAndUpdate({ id: userId }, { $set: updateData }, { new: true })
      .exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async delete(id: number): Promise<void> {
    const result = await this.userModel.deleteOne({ id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException('User not found');
    }
  }
}

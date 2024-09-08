import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { User } from "./schemas/user.schema";
import { AuthTokenData } from "../config/types";
import { EProduct } from "../market/market.const";
import {
  PREMIUM_REFERRAL_CASH,
  PREMIUM_REFERRAL_REPUTATION,
  REFERRAL_CASH,
  REFERRAL_REPUTATION,
  ROBBERY_AMOUNT_PER_DAILY_STRIKE,
  ROBBERY_MAX_AMOUNT_PER_DAILY_STRIKE,
  STARTING_CASH,
} from "./user.const";
import { upgradesData } from "../upgrade/data/upgrades";
import { InjectMixpanel } from "../analytics/injectMixpanel.decorator";
import { Mixpanel } from "mixpanel";
import { subDays } from "date-fns";

@Injectable()
export class UserService {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    @InjectModel(User.name)
    private userModel: Model<User>,
    @InjectMixpanel() private readonly mixpanel: Mixpanel,
  ) {}

  private getIdFromReferralToken(referralToken: string) {
    return Buffer.from(referralToken, "base64").toString("utf-8");
  }

  async findOneOrCreate(
    user: AuthTokenData,
    ip: string,
    referralToken?: string,
  ) {
    const existingUser = await this.userModel.findOne({ id: user.id });
    if (existingUser) {
      if (existingUser.isPremium !== user.isPremium) {
        existingUser.isPremium = user.isPremium;
        await existingUser.save();
      }
      return { user: existingUser, signup: false };
    }
    this.mixpanel.people.set(
      user.id.toString(),
      {
        $name: user.username,
        $created: new Date(),
        HERB: 1,
      },
      {
        $ip: ip,
      },
    );

    this.mixpanel.track("SignUp", {
      distinct_id: user.id.toString(),
      $ip: ip,
      username: user.username,
      referredBy: referralToken ? "Yes" : "No",
    });

    let referrer: User;
    if (referralToken) {
      referrer = await this.findByReferralToken(referralToken);
      if (referrer) {
        if (user.isPremium) {
          referrer.cashAmount += PREMIUM_REFERRAL_CASH;
          referrer.reputation += PREMIUM_REFERRAL_REPUTATION;
        } else {
          referrer.cashAmount += REFERRAL_CASH;
          referrer.reputation += REFERRAL_REPUTATION;
        }
        referrer.referredUsers.push({
          id: user.id,
          username: user.username,
          reward: user.isPremium ? PREMIUM_REFERRAL_CASH : REFERRAL_CASH,
        });
        await referrer.save();

        this.mixpanel.track("Referral Success", {
          distinct_id: referrer.id.toString(),
          referred_user: user.id.toString(),
        });
      }
    }

    const HERB = upgradesData.product[EProduct.HERB];

    const newUser = await this.userModel.create({
      ...user,
      cashAmount: referrer?.username
        ? STARTING_CASH + REFERRAL_CASH
        : STARTING_CASH,
      reputation: user.isPremium ? 500 : 1,
      products: [
        {
          name: EProduct.HERB,
          quantity: 100,
          title: HERB.title,
          image: HERB.image,
          level: 1,
        },
      ],
      referredBy: referrer?.username,
    });

    // Set additional user properties
    this.mixpanel.people.set(user.id.toString(), {
      starting_cash: newUser.cashAmount,
      referred_by: newUser.referredBy || "None",
    });

    return { user: newUser, signup: true };
  }
  async findByReferralToken(referralToken: string) {
    const id = this.getIdFromReferralToken(referralToken);
    return this.userModel.findOne({ id });
  }

  async dailyRobbery(id: number) {
    const user = await this.findOne(id);
    const date = new Date();

    if (!user.lastRobbery) {
      user.lastRobbery = date;
      user.robberyStrike = 1;
    } else {
      if (user.lastRobbery > subDays(date, 1)) {
        throw new HttpException(
          "You can only claim the reward once per day.",
          HttpStatus.BAD_REQUEST,
        );
      }

      this.logger.debug(
        `Last robbery: ${user.lastRobbery}, date: ${subDays(date, 2)}`,
      );
      this.logger.debug(user.lastRobbery > subDays(date, 2));
      if (user.lastRobbery < subDays(date, 2)) {
        user.robberyStrike = 1;
      } else {
        user.robberyStrike += 1;
      }
    }
    // We give 1000$ per extra daily strike
    const rewardAmount = user.robberyStrike * ROBBERY_AMOUNT_PER_DAILY_STRIKE;
    user.cashAmount +=
      rewardAmount > ROBBERY_MAX_AMOUNT_PER_DAILY_STRIKE
        ? ROBBERY_MAX_AMOUNT_PER_DAILY_STRIKE
        : rewardAmount;
    user.lastRobbery = date;
    await user.save();

    this.mixpanel.track("Daily Robbery", {
      distinct_id: user.id,
      reward_amount: rewardAmount,
      robbery_strike: user.robberyStrike,
    });
    return user;
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

  async getLeaderboard() {
    return this.userModel.aggregate([
      {
        $sort: { reputation: -1 },
      },
      {
        $limit: 100,
      },
      {
        $setWindowFields: {
          sortBy: { reputation: -1 },
          output: {
            rank: { $rank: {} },
          },
        },
      },
      {
        $project: {
          username: 1,
          reputation: 1,
          rank: 1,
        },
      },
    ]);
  }

  async findPvpPlayers(userId: string) {
    const players = await this.userModel.aggregate([
      {
        $match: {
          id: { $ne: parseInt(userId) },
          'pvp.pvpEnabled': true,
          'pvp.todayDefendNbr': 0
        }
      },
      {
        $addFields: {
          totalValue: {
            $add: [
              '$cashAmount',
              { $sum: '$products.quantity' }
            ]
          }
        }
      },
      {
        $sort: { totalValue: -1 }
      },
      {
        $limit: 10
      },
      {
        $project: {
          id: 1,
          username: 1,
          cashAmount: 1,
          products: 1,
          pvp: 1,
          totalValue: 1
        }
      }
    ]).exec();

    return players;
  }
}

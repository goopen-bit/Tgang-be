import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { User } from "./schemas/user.schema";
import { AuthTokenData } from "../config/types";
import { EProduct } from "../market/market.const";
import {
  REFERRAL_CASH,
  ROBBERY_AMOUNT_PER_DAILY_STRIKE,
  STARTING_CASH,
} from "./user.const";
import { upgradesData } from "../upgrade/data/upgrades";
import { Cron } from "@nestjs/schedule";
import { InjectRedis } from "@goopen/nestjs-ioredis-provider";
import Redis from "ioredis";

@Injectable()
export class UserService {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    @InjectModel(User.name)
    private userModel: Model<User>,

    @InjectRedis() private readonly redisClient: Redis
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

    const weed = upgradesData.product[EProduct.WEED];

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
      referredBy: referrer?.username,
    });
  }

  async findByReferralToken(referralToken: string) {
    const id = this.getIdFromReferralToken(referralToken);
    return this.userModel.findOne({ id });
  }

  async dailyRobbery(id: number) {
    const user = await this.findOne(id);
    const date = new Date();
    const now = date.getTime();
    const twentyFour = 8.64e7;

    if (!user.lastRobbery) {
      user.lastRobbery = date;
      user.robberyStrike = 1;
    } else {
      const isSameDay =
        user.lastRobbery.getDate() === date.getDate() &&
        user.lastRobbery.getMonth() === date.getMonth() &&
        user.lastRobbery.getFullYear() === date.getFullYear();

      if (isSameDay) {
        throw new Error("You can only claim the reward once per day.");
      }

      const isRobberyStrike = now - user.lastRobbery.getTime();
      if (isRobberyStrike > twentyFour) {
        user.robberyStrike = 1;
      } else {
        user.robberyStrike += 1;
      }
    }

    // We give 1000$ per extra daily strike
    const rewardAmount = user.robberyStrike * ROBBERY_AMOUNT_PER_DAILY_STRIKE;
    user.cashAmount += rewardAmount;
    user.lastRobbery = date;
    await user.save();
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

  @Cron('0 * * * *')
  async updateLeaderboard() {
    // Loop through the documents by batches of 1000
    let skip = 0;
    while (true) {
      const users = await this.userModel
        .find()
        .skip(skip)
        .limit(1000)
        .exec();

      if (users.length === 0) {
        break;
      }

      const board = [];
      users.forEach((user) => {
        board.push(user.reputation, user.id);
      });

      await this.redisClient.zadd("leaderboard", ...board);

      skip += 1000;
    }
      
  }

  async getLeatherboard(username: string) {
    // const top = await this.redisClient.zrevrange("leaderboard", 0, 9, "WITHSCORES");
    // const rank = await this.redisClient.zrank("leaderboard", username, "WITHSCORE");
    // return { rank: rank + 1, score };
  }
}

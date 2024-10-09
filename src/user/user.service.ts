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
  PVP_BASE_ACCURACY,
  PVP_BASE_CRITICAL_HIT_CHANCE,
  PVP_BASE_DAMAGE,
  PVP_BASE_EVASION,
  PVP_BASE_HEALTH_POINTS,
  PVP_BASE_PROTECTION,
  PVP_NUMBER_OF_PLAYERS,
  REFERRAL_CASH,
  REFERRAL_REPUTATION,
  ROBBERY_AMOUNT_PER_DAILY_STRIKE,
  ROBBERY_MAX_AMOUNT_PER_DAILY_STRIKE,
  STARTING_CASH,
} from "./user.const";
import { upgradesData } from "../upgrade/data/upgrades";
import { InjectMixpanel } from "../analytics/injectMixpanel.decorator";
import { Mixpanel } from "mixpanel";
import { differenceInDays, subDays } from "date-fns";
import { InjectRedis } from "@goopen/nestjs-ioredis-provider";
import Redis from "ioredis";
import { faker } from "@faker-js/faker";
import { BotUser } from "./user.interface";
import { reputationLevels } from "./data/reputationLevel";
import { UserPvp } from "./schemas/userPvp.schema";
import { BOT_TIME_BASE } from "../multiplayer/multiplayer.const";
import {
  achievements,
  EAchievement,
  Achievement,
  AchievementResponse,
} from "./data/achievements";

@Injectable()
export class UserService {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    @InjectModel(User.name)
    private userModel: Model<User>,

    @InjectRedis() private readonly redis: Redis,

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
      let needsSave = false;
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      // Check and reset PVP attacks if necessary
      if (existingUser.pvp && existingUser.pvp.lastAttackDate < today) {
        existingUser.pvp.attacksToday = 0;
        existingUser.pvp.lastAttackDate = today;
        needsSave = true;
      }

      if (existingUser.isPremium !== user.isPremium) {
        existingUser.isPremium = user.isPremium;
        needsSave = true;
      }

      if (needsSave) {
        await existingUser.save();
      }

      return { user: existingUser, signup: false };
    }

    this.mixpanel.people.set(
      user.id.toString(),
      {
        $name: user.username,
        $created: new Date(),
        HERB: 100,
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
      pvp: {
        victory: 0,
        defeat: 0,
        lastAttackDate: new Date(0),
        attacksToday: 0,
        lastDefendDate: new Date(0),
      } as UserPvp,
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
    this.logger.debug("Getting leaderboard");
    return this.userModel.aggregate([
      {
        $sort: { reputation: -1 },
      },
      {
        $limit: 50,
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

  async findDefender(userId: number, attackerUserId: number) {
    let defender: User | BotUser = await this.userModel.findOne({ id: userId });
    if (!defender) {
      const botsString = await this.redis.get(`bots:${attackerUserId}`);
      if (!botsString) {
        throw new NotFoundException("Defender not found");
      }
      const bots: BotUser[] = JSON.parse(botsString);
      defender = bots.find((bot) => bot.id === userId);
    }

    return defender;
  }

  getBotKey(userId: number) {
    return `bots:${userId}`;
  }

  private async createBots(numberOfBots: number, userId: number) {
    const existingBots = await this.redis.get(this.getBotKey(userId));
    if (existingBots) {
      return JSON.parse(existingBots) as BotUser[];
    }

    const bots = [];
    for (let i = 0; i < numberOfBots; i++) {
      const products = [];
      for (let j = 0; j < Math.floor(Math.random() * 3) + 1; j++) {
        const product = Object.keys(upgradesData.product)[
          Math.floor(Math.random() * Object.keys(upgradesData.product).length)
        ];
        products.push({
          name: product,
          quantity: Math.floor(Math.random() * 400) + 100,
          title: upgradesData.product[product].title,
          image: upgradesData.product[product].image,
          level: 1,
        });
      }

      bots.push({
        id: faker.number.int(),
        username: faker.internet.userName({
          firstName: faker.person.firstName(),
        }),
        cashAmount: Math.floor(Math.random() * 100000) + 10000,
        reputation: Math.floor(Math.random() * 100000) + 1000,
        products: products,
        userLevel: reputationLevels[Math.floor(Math.random() * 5)],
        pvp: {
          victory: Math.floor(
            Math.random() * differenceInDays(new Date(), BOT_TIME_BASE),
          ),
          defeat: Math.floor(
            Math.random() * differenceInDays(new Date(), BOT_TIME_BASE),
          ),
          lastAttackDate: new Date(0),
          attacksToday: 0,
          lastDefendDate: new Date(0),
          healthPoints: PVP_BASE_HEALTH_POINTS,
          protection: PVP_BASE_PROTECTION,
          damage: PVP_BASE_DAMAGE,
          accuracy: PVP_BASE_ACCURACY,
          evasion: PVP_BASE_EVASION,
        },
        isBot: true,
      });
    }

    await this.redis.set(
      this.getBotKey(userId),
      JSON.stringify(bots),
      "EX",
      3600,
    );
    return bots as BotUser[];
  }

  async findPvpPlayers(today: Date, userId: number, exIds: number[]) {
    const players = await this.userModel.aggregate([
      {
        $match: {
          id: { $nin: [userId, ...exIds] },
          reputation: { $gt: 1000 },
          $or: [
            { "pvp.lastDefendDate": { $lt: today } },
            { "pvp.lastDefendDate": { $exists: false } },
            { "pvp.lastDefendDate": null },
          ],
        },
      },
      {
        $sample: { size: PVP_NUMBER_OF_PLAYERS },
      },
      {
        $project: {
          id: 1,
          username: 1,
          cashAmount: 1,
          products: 1,
          pvp: 1,
          reputation: 1,
        },
      },
    ]);

    players.forEach((player) => {
      player.userLevel = reputationLevels.find(
        (level) =>
          player.reputation >= level.minReputation &&
          player.reputation <= level.maxReputation,
      );
      if (!player.pvp) {
        player.pvp = {
          victory: 0,
          defeat: 0,
          lastAttackDate: new Date(0),
          attacksToday: 0,
          lastDefendDate: new Date(0),
          healthPoints: PVP_BASE_HEALTH_POINTS,
          protection: PVP_BASE_PROTECTION,
          damage: PVP_BASE_DAMAGE,
          accuracy: PVP_BASE_ACCURACY,
          evasion: PVP_BASE_EVASION,
          criticalChance: PVP_BASE_CRITICAL_HIT_CHANCE,
        };
      } else {
        player.pvp = {
          ...player.pvp,
          healthPoints: player.pvp.healthPoints || PVP_BASE_HEALTH_POINTS,
          protection: player.pvp.protection || PVP_BASE_PROTECTION,
          damage: player.pvp.damage || PVP_BASE_DAMAGE,
          accuracy: player.pvp.accuracy || PVP_BASE_ACCURACY,
          evasion: player.pvp.evasion || PVP_BASE_EVASION,
          criticalChance:
            player.pvp.criticalChance || PVP_BASE_CRITICAL_HIT_CHANCE,
        };
      }
    });

    if (players.length < 1) {
      const bots = await this.createBots(
        PVP_NUMBER_OF_PLAYERS - players.length,
        userId,
      );
      players.push(...bots);
    }

    return players;
  }

  getAllAchievements(): AchievementResponse[] {
    return achievements.map(({ id, name, description }) => ({
      id,
      name,
      description,
    }));
  }

  async unlockAchievement(
    userId: number,
    achievementId: EAchievement,
  ): Promise<User> {
    const user = await this.findOne(userId);
    const achievement = achievements.find((a) => a.id === achievementId);
    if (!achievement) {
      throw new NotFoundException("Achievement not found");
    }
    if (
      achievement.checkRequirement(user) &&
      !user.achievements[achievementId]
    ) {
      user.achievements[achievementId] = true;
      await user.save();

      this.mixpanel.track("Achievement Unlocked", {
        distinct_id: user.id.toString(),
        achievement: achievement.name,
      });
    }

    return user;
  }
}

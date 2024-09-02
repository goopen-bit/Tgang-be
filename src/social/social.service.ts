import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { telegramBotToken } from "../config/env";
import { Telegram } from "telegraf";
import {
  SOCIAL_CASH_REWARD,
  SOCIAL_REPUTATION_REWARD,
  SocialChannel,
} from "./social.const";
import { UserService } from "../user/user.service";
import { socials } from "./data/socials";
import { Mixpanel } from "mixpanel";
import { InjectMixpanel } from "src/analytics/injectMixpanel.decorator";
import { addHours } from "date-fns";

@Injectable()
export class SocialService {
  private readonly telegram: Telegram;

  constructor(
    private userService: UserService,
    @InjectMixpanel() private readonly mixpanel: Mixpanel,
  ) {
    this.telegram = new Telegram(telegramBotToken);
  }

  getSocials() {
    return socials;
  }

  verify(userId: number, channel: SocialChannel) {
    switch (channel) {
      case SocialChannel.TELEGRAM_CHANNEL:
        return this.verifyChannelMember(userId);
      // case SocialChannel.TELEGRAM_GROUP:
      //   return this.verifyGroupMember(userId);
      case SocialChannel.TWITTER:
      case SocialChannel.FACEBOOK:
      case SocialChannel.INSTAGRAM:
      case SocialChannel.TIKTOK:
      case SocialChannel.YOUTUBE:
        return this.verifySocial(userId, channel);
      default:
        throw new HttpException(
          "Invalid social channel",
          HttpStatus.BAD_REQUEST,
        );
    }
  }

  private async verifyTelegram(userId: number, channel: SocialChannel) {
    const social = socials[channel];
    const member = await this.telegram.getChatMember(social.id, userId);
    if (
      member.status === "creator" ||
      member.status === "administrator" ||
      member.status === "member"
    ) {
      const user = await this.userService.findOne(userId);
      if (!user.socials) {
        user.socials = [];
      }
      const social = user.socials.find((s) => s.channel === channel);
      if (social) {
        if (social.member) {
          throw new HttpException(
            "You have already verified this channel",
            HttpStatus.BAD_REQUEST,
          );
        } else {
          social.member = true;
        }
      } else {
        user.socials.push({ channel: channel, member: true });
      }
      user.cashAmount += SOCIAL_CASH_REWARD;
      user.reputation += SOCIAL_REPUTATION_REWARD;
      await user.save();

      this.mixpanel.track("Social Verified", {
        distinct_id: user.id,
        channel: channel,
      });

      return user;
    } else {
      throw new HttpException(
        "You are not a member of the Telegram channel",
        HttpStatus.FORBIDDEN,
      );
    }
  }

  async verifyChannelMember(userId: number) {
    try {
      const user = await this.verifyTelegram(
        userId,
        SocialChannel.TELEGRAM_CHANNEL,
      );
      return user;
    } catch (_) {
      throw new HttpException(
        "You are not a member of the Telegram channel",
        HttpStatus.FORBIDDEN,
      );
    }
  }

  // async verifyGroupMember(userId: number) {
  //   try {
  //     const user = await this.verifyTelegram(userId, SocialChannel.TELEGRAM_GROUP);
  //     return user;
  //   } catch (_) {
  //     throw new HttpException('You are not a member of the Telegram group', HttpStatus.FORBIDDEN);
  //   }
  // }

  async verifySocial(userId: number, channel: SocialChannel) {
    const user = await this.userService.findOne(userId);
    const social = user.socials?.find((s) => s.channel === channel);
    if (!social) {
      throw new HttpException(
        "You have not joined this social channel",
        HttpStatus.BAD_REQUEST,
      );
    }
    if (social.member) {
      throw new HttpException(
        "You have already verified this channel",
        HttpStatus.BAD_REQUEST,
      );
    }

    if (social.joined && addHours(social.joined, 1) < new Date()) {
      social.member = true;
      user.cashAmount += SOCIAL_CASH_REWARD;
      user.reputation += SOCIAL_REPUTATION_REWARD;
      await user.save();

      this.mixpanel.track("Social Verified", {
        distinct_id: user.id,
        channel: channel,
      });

      return user;
    } else {
      throw new HttpException(
        "Verification is still pending",
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  join(userId: number, channel: SocialChannel) {
    switch (channel) {
      case SocialChannel.TELEGRAM_CHANNEL:
      // case SocialChannel.TELEGRAM_GROUP:
        return {}
      case SocialChannel.TWITTER:
      case SocialChannel.FACEBOOK:
      case SocialChannel.INSTAGRAM:
      case SocialChannel.TIKTOK:
      case SocialChannel.YOUTUBE:
        return this.joinSocial(userId, channel);
      default:
        throw new HttpException(
          "Invalid social channel",
          HttpStatus.BAD_REQUEST,
        );
    }
  }

  async joinSocial(userId: number, channel: SocialChannel) {
    const user = await this.userService.findOne(userId);
    if (!user.socials) {
      user.socials = [];
    }
    if (user.socials.find((s) => s.channel === channel)) {
      return {};
    }
    const userSocial = { channel: channel, member: false, joined: new Date() }
    user.socials.push(userSocial);
    await user.save();

    return userSocial
  }
}

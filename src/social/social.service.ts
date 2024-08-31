import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { telegramBotToken } from '../config/env';
import { Telegram } from 'telegraf';
import { SOCIAL_CASH_REWARD, SOCIAL_REPUTATION_REWARD, SocialChannel } from './social.const';
import { UserService } from '../user/user.service';
import { socials } from './data/socials';

@Injectable()
export class SocialService {
  private readonly telegram: Telegram;

  constructor(
    private userService: UserService,
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
      default:
        throw new HttpException('Invalid social channel', HttpStatus.BAD_REQUEST);
    }
  }

  private async verifyTelegram(userId: number, channel: SocialChannel) {
    const social = socials[channel];
    const member = await this.telegram.getChatMember(social.id, userId);

    if (
      member.status === 'creator' ||
      member.status === 'administrator' ||
      member.status === 'member'
    ) {
      const user = await this.userService.findOne(userId);
      if (!user.socials) {
        user.socials = [];
      }
      const social = user.socials.find((s) => s.channel === channel);
      if (social) {
        if (social.member) {
          throw new HttpException('You have already verified this channel', HttpStatus.BAD_REQUEST);
        } else {
          social.member = true;
        }
      } else {
        user.socials.push({ channel: channel, member: true });
      }
      user.cashAmount += SOCIAL_CASH_REWARD;
      user.reputation += SOCIAL_REPUTATION_REWARD;
      await user.save();
      return user;
    }
  }

  async verifyChannelMember(userId: number) {
    try {
      const user = await this.verifyTelegram(userId, SocialChannel.TELEGRAM_CHANNEL);
      return user;
    } catch (_) {
      throw new HttpException('You are not a member of the Telegram channel', HttpStatus.FORBIDDEN);
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
}

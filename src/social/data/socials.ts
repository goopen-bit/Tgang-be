import { SocialChannel } from "../social.const";
import { SocialData } from "../social.interface";

export const socials: Record<SocialChannel, SocialData> = {
  [SocialChannel.TELEGRAM_CHANNEL]: {
    id: '@cartel_game_community',
    url: 'https://t.me/cartel_game_community',
    title: 'Cartel Announcements',
    image: '/assets/social/telegram.png',
  },
  [SocialChannel.TELEGRAM_GROUP]: {
    id: '', // TODO: Add group ID when available
    url: '',
    title: 'Cartel Group',
    image: '/assets/social/telegram.png',
  },
};

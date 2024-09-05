import { SocialChannel } from "../social.const";
import { SocialData } from "../social.interface";

export const socials: Record<SocialChannel, SocialData> = {
  [SocialChannel.TELEGRAM_CHANNEL]: {
    id: '@cartel_game_community',
    url: 'https://t.me/cartel_game_community',
    title: 'Cartel Announcements',
    image: '/assets/social/telegram.png',
  },
  // [SocialChannel.TELEGRAM_GROUP]: {
  //   id: '', // TODO: Add group ID when available
  //   url: '',
  //   title: 'Cartel Group',
  //   image: '/assets/social/telegram.png',
  // },
  [SocialChannel.YOUTUBE]: {
    id: '@CartelGameTon',
    url: 'https://www.youtube.com/@CartelGameTon',
    title: 'Cartel YouTube',
    image: '/assets/social/youtube.png',
  },
  [SocialChannel.TWITTER]: {
    id: '@CartelGameTon',
    url: 'https://x.com/CartelGameTon',
    title: 'Cartel X',
    image: '/assets/social/x.png',
  },
  [SocialChannel.TIKTOK]: {
    id: 'cartelgameton',
    url: 'https://www.tiktok.com/@cartelgameton',
    title: 'Cartel TikTok',
    image: '/assets/social/tiktok.png',
  },
  [SocialChannel.FACEBOOK]: {
    id: 'CartelGameTon',
    url: 'https://www.facebook.com/cartelgameton/',
    title: 'Cartel Facebook',
    image: '/assets/social/facebook.png',
  },
  [SocialChannel.INSTAGRAM]: {
    id: 'cartelgameton',
    url: 'https://www.instagram.com/cartelgameton/',
    title: 'Cartel Instagram',
    image: '/assets/social/instagram.png',
  },
};

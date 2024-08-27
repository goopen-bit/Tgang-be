import { Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';
import { TelegramService } from './telegram.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TelegrafModule.forRoot({
      token: process.env.TELEGRAM_BOT_TOKEN, // Ensure you have TELEGRAM_BOT_TOKEN in your .env file
    }),
  ],
  providers: [TelegramService],
})
export class TelegramModule {}
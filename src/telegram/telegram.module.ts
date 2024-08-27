import { Module } from "@nestjs/common";
import { TelegrafModule } from "nestjs-telegraf";
import { TelegramService } from "./telegram.service";
import { ConfigModule } from "@nestjs/config";
import { telegramBotToken } from "../config/env";

@Module({
  imports: [
    ConfigModule.forRoot(),
    TelegrafModule.forRoot({
      token: telegramBotToken,
    }),
  ],
  providers: [TelegramService],
})
export class TelegramModule {}

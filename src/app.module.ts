import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './common/health/health.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { MarketModule } from './market/market.module';
import { UpgradeModule } from './upgrade/upgrade.module';
import { LabModule } from './lab/lab.module';
import { ShippingModule } from './shipping/shipping.module';
import { SocialModule } from './social/social.module';
import { MultiplayerModule } from './multiplayer/multiplayer.module';
import { appConfigImports } from './config/app';
import { AchievementsService } from './achievements/achievements.service';
import { AchievementsModule } from './achievements/achievements.module';

@Module({
  imports: [
    ...appConfigImports,
    HealthModule,
    AuthModule,
    UserModule,
    MarketModule,
    UpgradeModule,
    LabModule,
    ShippingModule,
    SocialModule,
    MultiplayerModule,
    AchievementsModule,
  ],
  controllers: [AppController],
  providers: [AppService, AchievementsService],
})
export class AppModule {}

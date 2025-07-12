import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './common/health/health.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { UpgradeModule } from './upgrade/upgrade.module';
import { LabModule } from './lab/lab.module';
import { SocialModule } from './social/social.module';
import { MultiplayerModule } from './multiplayer/multiplayer.module';
import { appConfigImports } from './config/app';
import { AchievementsService } from './achievements/achievements.service';
import { AchievementsModule } from './achievements/achievements.module';
import { PoolModule } from './pool/pool.module';

@Module({
  imports: [
    ...appConfigImports,
    HealthModule,
    AuthModule,
    UserModule,
    UpgradeModule,
    LabModule,
    SocialModule,
    MultiplayerModule,
    AchievementsModule,
    PoolModule,
  ],
  controllers: [AppController],
  providers: [AppService, AchievementsService],
})
export class AppModule {}

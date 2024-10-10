import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { AchievementsService } from './achievements.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Auth } from "../decorators/auth.decorator";
import { AuthTokenData } from '../config/types';
import { EAchievement } from '../user/data/achievements';
import { GetAuthToken } from "../decorators/get-auth-token.decorator";

@Auth()
@Controller('achievements')
export class AchievementsController {
  constructor(private readonly achievementsService: AchievementsService) {}

  @Get()
  getAllAchievements() {
    return this.achievementsService.getAllAchievements();
  }

  @Get('unlock/:achievementId')
  unlockAchievement(
    @GetAuthToken() user: AuthTokenData,
    @Param('achievementId') achievementId: EAchievement,
  ) {
    return this.achievementsService.unlockAchievement(user.id, achievementId);
  }
}

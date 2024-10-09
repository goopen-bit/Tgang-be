import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseInterceptors,
} from "@nestjs/common";
import { UserService } from "./user.service";
import { Auth } from "../decorators/auth.decorator";
import { AuthTokenData } from "../config/types";
import { GetAuthToken } from "../decorators/get-auth-token.decorator";
import { setWalletDto } from "./dto/set-wallet.dto";
import { CacheInterceptor, CacheTTL } from "@nestjs/cache-manager";
import { AchievementResponse, EAchievement } from "./data/achievements";
import { Achievement } from "./data/achievements";

@Auth()
@Controller("users")
export class UserController {
  constructor(private userService: UserService) {}

  @Get()
  login(@GetAuthToken() user: AuthTokenData) {
    return this.userService.findOne(user.id);
  }

  @Post("/robbery")
  dailyRobbery(@GetAuthToken() user: AuthTokenData) {
    return this.userService.dailyRobbery(user.id);
  }

  @Get("/leaderboard")
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(60000)
  leaderboard() {
    return this.userService.getLeaderboard();
  }

  @Post("/wallet")
  setWallet(@GetAuthToken() user: AuthTokenData, @Body() body: setWalletDto) {
    return this.userService.update(user.id, {
      wallet: body.tonWalletAddress,
    });
  }

  @Get("/achievements")
  getAllAchievements(): AchievementResponse[] {
    return this.userService.getAllAchievements();
  }

  @Get("/unlock-achievement/:achievementId")
  unlockAchievement(
    @GetAuthToken() user: AuthTokenData,
    @Param("achievementId") achievementId: EAchievement,
  ) {
    return this.userService.unlockAchievement(user.id, achievementId);
  }
}

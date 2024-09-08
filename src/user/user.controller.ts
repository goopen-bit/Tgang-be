import { Body, Controller, Get, Post, UseInterceptors } from "@nestjs/common";
import { UserService } from "./user.service";
import { Auth } from "../decorators/auth.decorator";
import { AuthTokenData } from "../config/types";
import { GetAuthToken } from "../decorators/get-auth-token.decorator";
import { setWalletDto } from "./dto/set-wallet.dto";
import { CacheInterceptor, CacheTTL } from "@nestjs/cache-manager";

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
}

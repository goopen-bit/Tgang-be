import { Controller, Post, Body } from "@nestjs/common";
import { MultiplayerService } from "./multiplayer.service";
import { Auth } from "../decorators/auth.decorator";
import { GetAuthToken } from "../decorators/get-auth-token.decorator";
import { AuthTokenData } from "../config/types";

@Auth()
@Controller("multiplayer")
export class MultiplayerController {
  constructor(private readonly multiplayerService: MultiplayerService) {}

  @Post("search")
  async searchPlayer(@GetAuthToken() user: AuthTokenData) {
    return this.multiplayerService.searchPlayer();
  }

  @Post("fight")
  async startFight(
    @GetAuthToken() user: AuthTokenData,
    @Body("opponentId") opponentId: string,
  ) {
    return this.multiplayerService.startFight(user.id.toString(), opponentId);
  }

  @Post("enable-pvp")
  async enablePvp(@GetAuthToken() user: AuthTokenData) {
    return this.multiplayerService.enablePvp(user.id.toString());
  }
}

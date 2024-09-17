import { Controller, Post, Get, Param, ParseIntPipe } from "@nestjs/common";
import { MultiplayerService } from "./multiplayer.service";
import { Auth } from "../decorators/auth.decorator";
import { GetAuthToken } from "../decorators/get-auth-token.decorator";
import { AuthTokenData } from "../config/types";

@Auth()
@Controller("multiplayer")
export class MultiplayerController {
  constructor(private readonly multiplayerService: MultiplayerService) {}

  @Get("search")
  async searchPlayer(@GetAuthToken() user: AuthTokenData) {
    return this.multiplayerService.searchPlayer(user.id);
  }

  @Post("fight/:opponentId")
  async startFight(
    @GetAuthToken() user: AuthTokenData,
    @Param("opponentId", new ParseIntPipe()) opponentId: number,
  ) {
    return this.multiplayerService.startFight(user.id, opponentId);
  }
}

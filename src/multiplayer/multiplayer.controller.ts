import { Controller, Post, Get, Param, ParseIntPipe, Body } from "@nestjs/common";
import { MultiplayerService } from "./multiplayer.service";
import { Auth } from "../decorators/auth.decorator";
import { GetAuthToken } from "../decorators/get-auth-token.decorator";
import { AuthTokenData } from "../config/types";
import { AttackDto } from "./dto/attack.dto";
import { StartBattleDto } from "./dto/battle.dto";

@Auth()
@Controller("multiplayer")
export class MultiplayerController {
  constructor(private readonly multiplayerService: MultiplayerService) {}

  @Get("search")
  async searchPlayer(@GetAuthToken() user: AuthTokenData) {
    return this.multiplayerService.searchPlayer(user.id);
  }

  @Post("start/:opponentId")
  async startFight(
    @GetAuthToken() user: AuthTokenData,
    @Param("opponentId", new ParseIntPipe()) opponentId: number,
    @Body() body: StartBattleDto
  ) {
    return this.multiplayerService.startBattle(user.id, opponentId, body.selectedItemIds);
  }

  @Post("attack/:battleId")
  async performAttack(
    @GetAuthToken() user: AuthTokenData,
    @Param("battleId") battleId: string,
    @Body() body: AttackDto
  ) {
    return this.multiplayerService.performAttack(user.id, battleId, body);
  }

  @Get("battle-results")
  async getBattleResults(@GetAuthToken() user: AuthTokenData) {
    return this.multiplayerService.getBattleResults(user.id);
  }
}

import { Body, Controller, Get, Post } from "@nestjs/common";
import { LabService } from "./lab.service";
import { Auth } from "../decorators/auth.decorator";
import { AuthTokenData } from "../config/types";
import { GetAuthToken } from "../decorators/get-auth-token.decorator";
import { BuyLabDto } from "./dto/buy-lab.dto";

@Auth()
@Controller("labs")
export class LabController {
  constructor(private labService: LabService) {}

  @Get()
  getLabs() {
    return this.labService.getLabs();
  }

  @Post("/buy-plot")
  buyPlot(@GetAuthToken() user: AuthTokenData) {
    return this.labService.buyLabPlot(user.id);
  }

  @Post("/buy")
  buy(
    @GetAuthToken() user: AuthTokenData, 
    @Body() body: BuyLabDto,
  ) {
    return this.labService.buyLab(user.id, body);
  }

  @Post("/collect")
  collectLabProduction(
    @GetAuthToken() user: AuthTokenData,
    @Body("plotId") plotId: number
  ) {
    return this.labService.collectLabProduction(user.id, plotId);
  }
}

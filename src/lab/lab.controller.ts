import { Body, Controller, Get, Param, Post, Put } from "@nestjs/common";
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

  @Put("/:plotId/capacity")
  upgradeCapacity(
    @GetAuthToken() user: AuthTokenData,
    @Param("plotId") plotId: number
  ) {
    return this.labService.upgradeLabCapacity(user.id, plotId);
  }

  @Put("/:plotId/production")
  upgradeProduction(
    @GetAuthToken() user: AuthTokenData,
    @Param("plotId") plotId: number
  ) {
    return this.labService.upgradeLabProduction(user.id, plotId);
  }

  @Post("/:plotId/collect")
  collectLabProduction(
    @GetAuthToken() user: AuthTokenData,
    @Param("plotId") plotId: number
  ) {
    return this.labService.collectLabProduction(user.id, plotId);
  }
}

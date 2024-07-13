import { Controller, Post } from "@nestjs/common";
import { LabService } from "./lab.service";
import { Auth } from "../decorators/auth.decorator";
import { AuthTokenData } from "../config/types";
import { GetAuthToken } from "../decorators/get-auth-token.decorator";

@Auth()
@Controller("lab")
export class LabController {
  constructor(private labService: LabService) {}

  @Post("/buy")
  buy(@GetAuthToken() user: AuthTokenData) {
    return this.labService.buyLab(user.id);
  }
}

import { Injectable, Logger } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { createHmac } from "crypto";
import { telegramBotToken } from "../config/env";
import { UserService } from "../user/user.service";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    private jwtService: JwtService,
    private userService: UserService,
  ) {}

  async login(telegramInitData: any, ip: string) {
    this.logger.debug(telegramInitData);

    const initData = new URLSearchParams(telegramInitData);
    initData.sort();

    const hash = initData.get("hash");
    initData.delete("hash");
    const dataToCheck = [...initData.entries()]
      .map(([key, value]) => key + "=" + value)
      .join("\n");
    const secretKey = createHmac("sha256", "WebAppData")
      .update(telegramBotToken)
      .digest();
    const _hash = createHmac("sha256", secretKey)
      .update(dataToCheck)
      .digest("hex");

    if (_hash !== hash) {
      return { error: "Invalid hash" };
    }

    const user = JSON.parse(telegramInitData.user);

    const { signup } = await this.userService.findOneOrCreate(
      {
        id: user.id,
        username: user.username || user.first_name,
      },
      ip,
      initData.get("start_param"),
    );
    console.log(`signup`);
    console.log(signup);
    return {
      access_token: this.jwtService.sign({
        id: user.id,
        username: user.username,
      }),
      signup,
    };
  }
}

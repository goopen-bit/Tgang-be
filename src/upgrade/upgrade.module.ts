import { Module } from "@nestjs/common";
import { UpgradeService } from "./upgrade.service";
import { UpgradeController } from "./upgrade.controller";
import { UserModule } from "../user/user.module";
import { MarketModule } from "../market/market.module";

@Module({
  imports: [UserModule, MarketModule],
  providers: [UpgradeService],
  exports: [UpgradeService],
  controllers: [UpgradeController],
})
export class UpgradeModule {}

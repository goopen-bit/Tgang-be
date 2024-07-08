import { Module } from "@nestjs/common";
import { UpgradeService } from "./upgrade.service";
import { UpgradeController } from "./upgrade.controller";
import { UserModule } from "../user/user.module";

@Module({
  imports: [UserModule],
  providers: [UpgradeService],
  exports: [UpgradeService],
  controllers: [UpgradeController],
})
export class UpgradeModule {}

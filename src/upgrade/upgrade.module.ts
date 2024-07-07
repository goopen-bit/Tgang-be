import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Upgrade, UpgradeSchema } from "./upgrade.schema";
import { UpgradeService } from "./upgrade.service";
import { UpgradeController } from "./upgrade.controller";
import { UserModule } from "../user/user.module";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Upgrade.name, schema: UpgradeSchema }]),
    UserModule,
  ],
  providers: [UpgradeService],
  exports: [UpgradeService],
  controllers: [UpgradeController],
})
export class UpgradeModule {}

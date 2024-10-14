import { Module } from "@nestjs/common";
import { LabService } from "./lab.service";
import { LabController } from "./lab.controller";
import { UserModule } from "../user/user.module";
import { MultiplayerModule } from "../multiplayer/multiplayer.module";

@Module({
  imports: [UserModule],
  providers: [LabService],
  exports: [LabService],
  controllers: [LabController],
})
export class LabModule {}

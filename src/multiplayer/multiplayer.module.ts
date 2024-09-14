import { Module } from '@nestjs/common';
import { MultiplayerController } from './multiplayer.controller';
import { MultiplayerService } from './multiplayer.service';
import { UserModule } from '../user/user.module';
import { BattleResult, BattleResultSchema } from './schemas/battleResult.schema';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: BattleResult.name, schema: BattleResultSchema }]),
    UserModule
  ],
  controllers: [MultiplayerController],
  providers: [MultiplayerService],
})
export class MultiplayerModule {}